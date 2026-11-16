import { DEMO_COSMIC_COVER, DEMO_SYNTHWAVE_COVER } from '../constants/visualizer';
import { getTranslations } from '../i18n/translations';
import { Track } from '../types/audio';

function encodeWavFromAudioBuffer(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

async function renderSynthwaveDemoUrl(): Promise<string> {
  const sampleRate = 44100;
  const duration = 24;
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const master = ctx.createGain();
  master.gain.value = 0.72;
  master.connect(ctx.destination);

  const bpm = 118;
  const beatDur = 60 / bpm;
  const sixteenth = beatDur / 4;
  const totalBeats = Math.floor(duration / beatDur);

  // Kick drum on every beat + driving off-beat bass + synthwave arp
  const bassRoots = [36, 36, 43, 41]; // C2, C2, G2, F2
  const arpScale = [60, 63, 67, 70, 72, 70, 67, 63];

  for (let beat = 0; beat < totalBeats; beat++) {
    const t = beat * beatDur;

    // Punchy Kick
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(135, t);
    kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.14);
    kickGain.gain.setValueAtTime(0.95, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    kickOsc.connect(kickGain);
    kickGain.connect(master);
    kickOsc.start(t);
    kickOsc.stop(t + 0.34);

    // Snare on beats 2 & 4
    if (beat % 2 === 1) {
      const noiseBuf = ctx.createBuffer(1, sampleRate * 0.22, sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.06));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.35, t);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      noise.connect(filter);
      filter.connect(sGain);
      sGain.connect(master);
      noise.start(t);
    }

    // 16th-note bass & arpeggio
    const barIdx = Math.floor(beat / 4) % bassRoots.length;
    const bassFreq = midiToFreq(bassRoots[barIdx]);

    for (let step = 0; step < 4; step++) {
      const st = t + step * sixteenth;
      if (st >= duration) break;

      // Sub/Saw Bass
      const bOsc = ctx.createOscillator();
      const bFilter = ctx.createBiquadFilter();
      const bGain = ctx.createGain();
      bOsc.type = 'sawtooth';
      bOsc.frequency.setValueAtTime(bassFreq, st);
      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(step === 0 ? 320 : 780, st);
      bFilter.frequency.exponentialRampToValueAtTime(180, st + sixteenth * 0.9);
      bGain.gain.setValueAtTime(step === 0 ? 0.14 : 0.3, st);
      bGain.gain.exponentialRampToValueAtTime(0.01, st + sixteenth * 0.95);
      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(master);
      bOsc.start(st);
      bOsc.stop(st + sixteenth);

      // Lead Arpeggio
      const arpMidi = arpScale[(beat * 4 + step) % arpScale.length] + (barIdx === 2 ? 7 : barIdx === 3 ? 5 : 0);
      const aOsc = ctx.createOscillator();
      const aFilter = ctx.createBiquadFilter();
      const aGain = ctx.createGain();
      aOsc.type = 'triangle';
      aOsc.frequency.setValueAtTime(midiToFreq(arpMidi), st);
      aFilter.type = 'lowpass';
      aFilter.frequency.value = 2600;
      aGain.gain.setValueAtTime(0.16, st);
      aGain.gain.exponentialRampToValueAtTime(0.005, st + sixteenth * 0.85);
      aOsc.connect(aFilter);
      aFilter.connect(aGain);
      aGain.connect(master);
      aOsc.start(st);
      aOsc.stop(st + sixteenth * 0.9);
    }
  }

  const rendered = await ctx.startRendering();
  const wavBlob = encodeWavFromAudioBuffer(rendered);
  return URL.createObjectURL(wavBlob);
}

async function renderCosmicAmbientDemoUrl(): Promise<string> {
  const sampleRate = 44100;
  const duration = 24;
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);

  const chords = [
    [48, 55, 60, 63, 67], // Cm9
    [44, 51, 56, 60, 63], // Abmaj7
    [46, 53, 58, 62, 65], // Bb6
    [43, 50, 55, 58, 62], // Gm7
  ];

  const barDur = 6;
  chords.forEach((chord, idx) => {
    const start = idx * barDur;
    chord.forEach((midi, voiceIdx) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();

      osc.type = voiceIdx === 0 ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(midiToFreq(midi), start);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, start);
      filter.frequency.linearRampToValueAtTime(1400, start + barDur * 0.5);
      filter.frequency.linearRampToValueAtTime(400, start + barDur);

      pan.pan.value = voiceIdx === 0 ? 0 : (voiceIdx % 2 === 0 ? -0.45 : 0.45);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(voiceIdx === 0 ? 0.34 : 0.08, start + 1.4);
      gain.gain.linearRampToValueAtTime(0.001, start + barDur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(pan);
      pan.connect(master);
      osc.start(start);
      osc.stop(start + barDur + 0.05);
    });
  });

  // Soft pulsing sub-heartbeats + crystalline bells
  for (let i = 0; i < 24; i++) {
    const t = i * 1.0;
    const bell = ctx.createOscillator();
    const bGain = ctx.createGain();
    const chord = chords[Math.floor(i / 6) % chords.length];
    const note = chord[2 + (i % 3)] + 12;
    bell.type = 'sine';
    bell.frequency.setValueAtTime(midiToFreq(note), t);
    bGain.gain.setValueAtTime(0.11, t);
    bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
    bell.connect(bGain);
    bGain.connect(master);
    bell.start(t);
    bell.stop(t + 0.9);
  }

  const rendered = await ctx.startRendering();
  const wavBlob = encodeWavFromAudioBuffer(rendered);
  return URL.createObjectURL(wavBlob);
}

let cachedDemoTracks: Track[] | null = null;

export async function createDemoTracks(): Promise<Track[]> {
  if (cachedDemoTracks) {
    return cachedDemoTracks;
  }

  const t = getTranslations();
  const [synthUrl, cosmicUrl] = await Promise.all([
    renderSynthwaveDemoUrl(),
    renderCosmicAmbientDemoUrl(),
  ]);

  cachedDemoTracks = [
    {
      id: 'demo-synthwave',
      title: 'Synthwave Neon Pulse (Demo)',
      artist: 'YRitmX Generator',
      cover: DEMO_SYNTHWAVE_COVER,
      src: synthUrl,
      sourceName: t.demoSynthSourceName,
      durationHint: 24,
      isObjectUrl: true,
    },
    {
      id: 'demo-cosmic',
      title: 'Cosmic Ambient Flow (Demo)',
      artist: 'YRitmX Generator',
      cover: DEMO_COSMIC_COVER,
      src: cosmicUrl,
      sourceName: t.demoSynthSourceName,
      durationHint: 24,
      isObjectUrl: true,
    },
  ];

  return cachedDemoTracks;
}
