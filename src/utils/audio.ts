class AudioEngine {
  ctx: AudioContext | null = null;
  initialized: boolean = false;

  init() {
    if (this.initialized) {
       if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
       return;
    }
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.ctx.resume();
      this.initialized = true;
      this.startCrowd();
    } catch (e) {
      console.error('Web Audio API not supported', e);
    }
  }

  private crowdGain: GainNode | null = null;

  startCrowd() {
    if (!this.ctx) return;
    // Simple low-pass filtered noise for background crowd
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; // Muffled crowd

    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.value = 0.05;

    noise.connect(filter);
    filter.connect(this.crowdGain);
    this.crowdGain.connect(this.ctx.destination);
    noise.start();
  }

  setCrowdVolume(vol: number) {
    if (this.crowdGain && this.ctx) {
      this.crowdGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.5);
    }
  }

  stopCrowd() {
    if (this.crowdGain && this.ctx) {
      this.crowdGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
  }

  playKick() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Add noise burst for the "thwack"
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800 + Math.random() * 400; // variant
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    // Low thump
    osc.type = 'sine';
    const baseFreq = 120 + Math.random() * 60; // variant
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    noise.start(t);
    osc.stop(t + 0.1);
  }

  playWhistle() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // FM modulation for trill effect
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    mod.type = 'sine';
    mod.frequency.value = 50; // Trill speed
    modGain.gain.value = 200; // Trill depth
    mod.connect(modGain);
    modGain.connect(osc.frequency);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2500, t);
    osc.frequency.linearRampToValueAtTime(2800, t + 0.4);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
    gain.gain.setValueAtTime(0.5, t + 0.3);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    mod.start(t);
    osc.stop(t + 0.5);
    mod.stop(t + 0.5);
  }

  playBounce() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playPostHit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playCheer() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.8, t + 0.5);
    gain.gain.setValueAtTime(0.8, t + 2);
    gain.gain.linearRampToValueAtTime(0, t + 3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  playMiss() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // "Ooooh" sound using a low-pass filtered noise + multi-sine
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(300, t);
    osc1.frequency.linearRampToValueAtTime(250, t + 1);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(310, t);
    osc2.frequency.linearRampToValueAtTime(260, t + 1);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.2);
    gain.gain.linearRampToValueAtTime(0, t + 1);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 1);
    osc2.stop(t + 1);
  }
  playHey() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.1);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain.gain.setValueAtTime(0.2, t + 0.08);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

}

export const audio = new AudioEngine();
