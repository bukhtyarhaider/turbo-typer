// A simple synthesizer for game sounds to avoid external asset dependencies
export class SoundService {
  private ctx: AudioContext | null = null;

  constructor() {
    try {
      this.ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("AudioContext not supported");
    }
  }

  private ensureContext() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playEngineHum(speedRatio: number) {
    // Placeholder
  }

  playBump() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playTypo() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playSuccess() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      1200,
      this.ctx.currentTime + 0.1
    );

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playPowerUp() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(554, this.ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playYahoo() {
    if (!this.ctx) return;
    this.ensureContext();

    const now = this.ctx.currentTime;

    // "Ya" part - short ascending slide
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(400, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.linearRampToValueAtTime(0, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // "Hoo" part - longer, higher slide
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(600, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(1000, now + 0.5);
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  }

  playShieldDeflect() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playHighScore() {
    if (!this.ctx) return;
    this.ensureContext();
    this.playWin(); // Combine with win sound
  }

  playWin() {
    if (!this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // 1. Ribbon Break / Swish
    const noiseSwish = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseSwish.buffer = buffer;
    const swishGain = this.ctx.createGain();

    const swishFilter = this.ctx.createBiquadFilter();
    swishFilter.type = "highpass";
    swishFilter.frequency.value = 1000;

    swishGain.gain.setValueAtTime(0.5, now);
    swishGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noiseSwish.connect(swishFilter);
    swishFilter.connect(swishGain);
    swishGain.connect(this.ctx.destination);
    noiseSwish.start();

    // 2. Crowd Cheer
    const crowdBuffer = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate * 3,
      this.ctx.sampleRate
    );
    const crowdData = crowdBuffer.getChannelData(0);
    for (let i = 0; i < crowdData.length; i++) {
      crowdData[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const crowd = this.ctx.createBufferSource();
    crowd.buffer = crowdBuffer;

    const crowdFilter = this.ctx.createBiquadFilter();
    crowdFilter.type = "lowpass";
    crowdFilter.frequency.setValueAtTime(800, now);
    crowdFilter.frequency.linearRampToValueAtTime(2000, now + 2); // Swell

    const crowdGain = this.ctx.createGain();
    crowdGain.gain.setValueAtTime(0, now);
    crowdGain.gain.linearRampToValueAtTime(0.4, now + 0.5);
    crowdGain.gain.linearRampToValueAtTime(0, now + 3);

    crowd.connect(crowdFilter);
    crowdFilter.connect(crowdGain);
    crowdGain.connect(this.ctx.destination);
    crowd.start(now + 0.1);

    // 3. Victory Melody (Arpeggio)
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C Major
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;

      const time = now + 0.2 + i * 0.1;
      g.gain.setValueAtTime(0.1, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(time);
      osc.stop(time + 0.6);
    });
  }
}

export const soundService = new SoundService();
