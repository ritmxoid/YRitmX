export interface ParsedAudioTags {
  title?: string;
  artist?: string;
  coverUrl?: string;
}

function readSynchsafeInt(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) >>> 0) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function readUint24BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 16) + (bytes[offset + 1] << 8) + bytes[offset + 2];
}

function decodeText(bytes: Uint8Array, encoding: number): string {
  if (bytes.length === 0) return '';
  try {
    if (encoding === 0) {
      return new TextDecoder('iso-8859-1').decode(bytes).replace(/\0+$/, '').trim();
    }
    if (encoding === 1) {
      // UTF-16 with BOM
      if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
        return new TextDecoder('utf-16be').decode(bytes.subarray(2)).replace(/\0+$/, '').trim();
      }
      if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
        return new TextDecoder('utf-16le').decode(bytes.subarray(2)).replace(/\0+$/, '').trim();
      }
      return new TextDecoder('utf-16le').decode(bytes).replace(/\0+$/, '').trim();
    }
    if (encoding === 2) {
      return new TextDecoder('utf-16be').decode(bytes).replace(/\0+$/, '').trim();
    }
    return new TextDecoder('utf-8').decode(bytes).replace(/\0+$/, '').trim();
  } catch {
    return '';
  }
}

function findNullTerminator(bytes: Uint8Array, start: number, encoding: number): number {
  if (encoding === 1 || encoding === 2) {
    for (let i = start; i + 1 < bytes.length; i += 2) {
      if (bytes[i] === 0 && bytes[i + 1] === 0) return i;
    }
    return bytes.length;
  }
  for (let i = start; i < bytes.length; i++) {
    if (bytes[i] === 0) return i;
  }
  return bytes.length;
}

function parseApicFrame(data: Uint8Array, isV22: boolean): string | undefined {
  if (data.length < 4) return undefined;
  const encoding = data[0];
  let cursor = 1;
  let mime = 'image/jpeg';

  if (isV22) {
    const fmt = String.fromCharCode(data[1], data[2], data[3]).toUpperCase();
    mime = fmt === 'PNG' ? 'image/png' : 'image/jpeg';
    cursor = 4;
  } else {
    const mimeEnd = findNullTerminator(data, cursor, 0);
    const rawMime = new TextDecoder('iso-8859-1').decode(data.subarray(cursor, mimeEnd)).trim();
    if (rawMime) {
      mime = rawMime.includes('/') ? rawMime : `image/${rawMime.toLowerCase()}`;
    }
    cursor = mimeEnd + 1;
  }

  if (cursor >= data.length) return undefined;
  // Picture type byte
  cursor += 1;
  if (cursor >= data.length) return undefined;

  // Description string
  const descEnd = findNullTerminator(data, cursor, encoding);
  cursor = descEnd + (encoding === 1 || encoding === 2 ? 2 : 1);

  if (cursor >= data.length) return undefined;
  const imgBytes = data.subarray(cursor);
  if (imgBytes.length < 16) return undefined;

  const blob = new Blob([new Uint8Array(imgBytes)], { type: mime });
  return URL.createObjectURL(blob);
}

export async function parseAudioMetadata(file: File): Promise<ParsedAudioTags> {
  const result: ParsedAudioTags = {};

  try {
    // Read up to first 2MB to extract ID3v2 header & embedded cover art quickly
    const headSlice = file.slice(0, Math.min(file.size, 2 * 1024 * 1024));
    const buffer = await headSlice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const majorVersion = bytes[3];
      const flags = bytes[5];
      const tagSize = readSynchsafeInt(bytes, 6);
      const endOffset = Math.min(bytes.length, 10 + tagSize);
      let offset = 10;

      // Skip extended header if present (ID3v2.3 / v2.4)
      if ((flags & 0x40) !== 0 && offset + 4 <= endOffset) {
        const extSize = majorVersion === 4 ? readSynchsafeInt(bytes, offset) : readUint32BE(bytes, offset);
        offset += majorVersion === 4 ? extSize : extSize + 4;
      }

      const isV22 = majorVersion === 2;
      const frameHeaderSize = isV22 ? 6 : 10;

      while (offset + frameHeaderSize <= endOffset) {
        if (bytes[offset] === 0) break;

        let frameId = '';
        let frameSize = 0;

        if (isV22) {
          frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2]);
          frameSize = readUint24BE(bytes, offset + 3);
        } else {
          frameId = String.fromCharCode(
            bytes[offset],
            bytes[offset + 1],
            bytes[offset + 2],
            bytes[offset + 3]
          );
          frameSize =
            majorVersion === 4
              ? readSynchsafeInt(bytes, offset + 4)
              : readUint32BE(bytes, offset + 4);
        }

        if (frameSize <= 0 || offset + frameHeaderSize + frameSize > endOffset) {
          break;
        }

        const frameData = bytes.subarray(offset + frameHeaderSize, offset + frameHeaderSize + frameSize);

        if ((frameId === 'TIT2' || frameId === 'TT2') && frameData.length > 1) {
          const text = decodeText(frameData.subarray(1), frameData[0]);
          if (text) result.title = text;
        } else if ((frameId === 'TPE1' || frameId === 'TP1') && frameData.length > 1) {
          const text = decodeText(frameData.subarray(1), frameData[0]);
          if (text) result.artist = text;
        } else if ((frameId === 'APIC' || frameId === 'PIC') && !result.coverUrl) {
          const coverUrl = parseApicFrame(frameData, isV22);
          if (coverUrl) result.coverUrl = coverUrl;
        }

        offset += frameHeaderSize + frameSize;
      }
    }

    // Fallback to ID3v1 at end of file if title/artist still missing
    if ((!result.title || !result.artist) && file.size >= 128) {
      const tailSlice = file.slice(file.size - 128, file.size);
      const tailBuffer = await tailSlice.arrayBuffer();
      const tail = new Uint8Array(tailBuffer);
      if (tail[0] === 0x54 && tail[1] === 0x41 && tail[2] === 0x47) {
        const decoder = new TextDecoder('iso-8859-1');
        const t = decoder.decode(tail.subarray(3, 33)).replace(/\0+$/, '').trim();
        const a = decoder.decode(tail.subarray(33, 63)).replace(/\0+$/, '').trim();
        if (!result.title && t) result.title = t;
        if (!result.artist && a) result.artist = a;
      }
    }
  } catch {
    // Gracefully return partial/empty tags if malformed file
  }

  return result;
}
