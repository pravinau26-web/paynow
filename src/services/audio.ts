// Web Audio API & HTML5 Audio Service with pre-buffered waveforms & custom upload support
import { SOUND_DATA_URIS } from './soundAssets';

const CUSTOM_TONES_STORAGE_KEY = 'paynow_custom_audio_tones_v1';

export interface CustomToneMeta {
  isCustomSuccess: boolean;
  successFileName?: string;
  isCustomFailure: boolean;
  failureFileName?: string;
  isCustomInitiate: boolean;
  initiateFileName?: string;
}

class SoundService {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  // Pre-decoded AudioBuffers for zero-latency, 100% reliable playback
  private initiateBuffer: AudioBuffer | null = null;
  private successBuffer: AudioBuffer | null = null;
  private failureBuffer: AudioBuffer | null = null;

  // Custom User-Uploaded Audio
  private customSuccessUri: string | null = null;
  private customSuccessBuffer: AudioBuffer | null = null;
  private customSuccessFileName: string | null = null;

  private customFailureUri: string | null = null;
  private customFailureBuffer: AudioBuffer | null = null;
  private customFailureFileName: string | null = null;

  private customInitiateUri: string | null = null;
  private customInitiateBuffer: AudioBuffer | null = null;
  private customInitiateFileName: string | null = null;

  // Active audio element for stopping previous preview
  private activeAudioEl: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Load any custom tones stored by user
      this.loadCustomSoundsFromStorage();

      // Unlock and decode on the very first user interaction
      const unlockAudio = () => {
        this.initContext();
        this.preloadAudioBuffers();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });

      // Attempt decoding immediately in background if context allows
      setTimeout(() => {
        this.preloadAudioBuffers();
      }, 300);
    }
  }

  private loadCustomSoundsFromStorage() {
    try {
      const stored = localStorage.getItem(CUSTOM_TONES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.success) {
          this.customSuccessUri = parsed.success;
          this.customSuccessFileName = parsed.successFileName || 'custom-success.mp3';
        }
        if (parsed.failure) {
          this.customFailureUri = parsed.failure;
          this.customFailureFileName = parsed.failureFileName || 'custom-failure.mp3';
        }
        if (parsed.initiate) {
          this.customInitiateUri = parsed.initiate;
          this.customInitiateFileName = parsed.initiateFileName || 'custom-initiate.mp3';
        }
      }
    } catch {
      // Ignore
    }
  }

  private saveCustomSoundsToStorage() {
    try {
      const payload = {
        success: this.customSuccessUri,
        successFileName: this.customSuccessFileName,
        failure: this.customFailureUri,
        failureFileName: this.customFailureFileName,
        initiate: this.customInitiateUri,
        initiateFileName: this.customInitiateFileName,
      };
      localStorage.setItem(CUSTOM_TONES_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore
    }
  }

  public initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Base64 Data URI to ArrayBuffer helper
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Safe decoder supporting both modern Promise & legacy callback WebAudio APIs
  private async decodeBufferSafely(base64: string): Promise<AudioBuffer | null> {
    const ctx = this.initContext();
    if (!ctx) return null;

    try {
      const arrayBuf = this.base64ToArrayBuffer(base64);
      const maybePromise = ctx.decodeAudioData(
        arrayBuf,
        () => {},
        () => {}
      );
      if (maybePromise && typeof maybePromise.then === 'function') {
        return await maybePromise;
      }
    } catch {
      // Fallback
    }

    return new Promise<AudioBuffer | null>((resolve) => {
      try {
        const freshBuf = this.base64ToArrayBuffer(base64);
        ctx.decodeAudioData(
          freshBuf,
          (decoded) => resolve(decoded),
          () => resolve(null)
        );
      } catch {
        resolve(null);
      }
    });
  }

  // Pre-decode audio into high-performance AudioBuffers
  public async preloadAudioBuffers() {
    try {
      this.initContext();
      if (!this.initiateBuffer) {
        this.initiateBuffer = await this.decodeBufferSafely(SOUND_DATA_URIS.initiate);
      }
      if (!this.successBuffer) {
        this.successBuffer = await this.decodeBufferSafely(SOUND_DATA_URIS.success);
      }
      if (!this.failureBuffer) {
        this.failureBuffer = await this.decodeBufferSafely(SOUND_DATA_URIS.failure);
      }

      // Preload custom decoded buffers if any
      if (this.customSuccessUri && !this.customSuccessBuffer) {
        this.customSuccessBuffer = await this.decodeBufferSafely(this.customSuccessUri);
      }
      if (this.customFailureUri && !this.customFailureBuffer) {
        this.customFailureBuffer = await this.decodeBufferSafely(this.customFailureUri);
      }
      if (this.customInitiateUri && !this.customInitiateBuffer) {
        this.customInitiateBuffer = await this.decodeBufferSafely(this.customInitiateUri);
      }
    } catch {
      // Ignore
    }
  }

  // Play an AudioBuffer with maximum fidelity and zero mobile restrictions
  private playBuffer(buffer: AudioBuffer | null, volume: number = 1.0): boolean {
    try {
      const ctx = this.initContext();
      if (!ctx || !buffer) return false;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
      return true;
    } catch {
      return false;
    }
  }

  // Fallback via HTMLAudioElement
  private playAudioElement(dataUri: string, volume: number = 1.0): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (this.activeAudioEl) {
          try {
            this.activeAudioEl.pause();
            this.activeAudioEl.currentTime = 0;
          } catch {
            // Ignore
          }
        }
        const audio = new Audio(dataUri);
        audio.volume = volume;
        this.activeAudioEl = audio;
        const playPromise = audio.play();
        if (playPromise) {
          playPromise
            .then(() => resolve(true))
            .catch(() => resolve(false));
        } else {
          resolve(true);
        }
      } catch {
        resolve(false);
      }
    });
  }

  // =========================================================================
  // CUSTOM AUDIO TONE UPLOAD & MANAGEMENT API
  // =========================================================================
  public async setCustomSound(
    type: 'success' | 'failure' | 'initiate',
    dataUri: string,
    fileName: string
  ): Promise<void> {
    this.initContext();
    if (type === 'success') {
      this.customSuccessUri = dataUri;
      this.customSuccessFileName = fileName;
      this.customSuccessBuffer = await this.decodeBufferSafely(dataUri);
    } else if (type === 'failure') {
      this.customFailureUri = dataUri;
      this.customFailureFileName = fileName;
      this.customFailureBuffer = await this.decodeBufferSafely(dataUri);
    } else if (type === 'initiate') {
      this.customInitiateUri = dataUri;
      this.customInitiateFileName = fileName;
      this.customInitiateBuffer = await this.decodeBufferSafely(dataUri);
    }
    this.saveCustomSoundsToStorage();
  }

  public resetSound(type: 'success' | 'failure' | 'initiate') {
    if (type === 'success') {
      this.customSuccessUri = null;
      this.customSuccessBuffer = null;
      this.customSuccessFileName = null;
    } else if (type === 'failure') {
      this.customFailureUri = null;
      this.customFailureBuffer = null;
      this.customFailureFileName = null;
    } else if (type === 'initiate') {
      this.customInitiateUri = null;
      this.customInitiateBuffer = null;
      this.customInitiateFileName = null;
    }
    this.saveCustomSoundsToStorage();
  }

  public getCustomToneMeta(): CustomToneMeta {
    return {
      isCustomSuccess: Boolean(this.customSuccessUri),
      successFileName: this.customSuccessFileName || undefined,
      isCustomFailure: Boolean(this.customFailureUri),
      failureFileName: this.customFailureFileName || undefined,
      isCustomInitiate: Boolean(this.customInitiateUri),
      initiateFileName: this.customInitiateFileName || undefined,
    };
  }

  // Stop any active audio
  public stopAll() {
    if (this.activeAudioEl) {
      try {
        this.activeAudioEl.pause();
        this.activeAudioEl.currentTime = 0;
      } catch {
        // Ignore
      }
    }
  }

  // =========================================================================
  // 1. TRANSACTION INITIATE SOUND
  // =========================================================================
  async playPaymentInitiate() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 1. Custom uploaded sound priority
    if (this.customInitiateUri) {
      if (this.customInitiateBuffer && this.playBuffer(this.customInitiateBuffer, 0.7)) {
        return;
      }
      const ok = await this.playAudioElement(this.customInitiateUri, 0.7);
      if (ok) return;
    }

    // 2. Default Initiate sound
    if (this.initiateBuffer && this.playBuffer(this.initiateBuffer, 0.5)) {
      return;
    }

    const decoded = await this.decodeBufferSafely(SOUND_DATA_URIS.initiate);
    if (decoded) {
      this.initiateBuffer = decoded;
      if (this.playBuffer(decoded, 0.5)) return;
    }

    const html5Success = await this.playAudioElement(SOUND_DATA_URIS.initiate, 0.5);
    if (!html5Success) {
      this.playSynthesizedInitiate();
    }
  }

  private playSynthesizedInitiate() {
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.16);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.23);
      osc2.stop(now + 0.23);
    } catch {
      // Ignore
    }
  }

  // =========================================================================
  // 2. PAYMENT SUCCESS SOUND
  // =========================================================================
  async playPaymentSuccess() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Ignore
      }
    }

    // 1. Custom user-uploaded sound priority
    if (this.customSuccessUri) {
      if (this.customSuccessBuffer && this.playBuffer(this.customSuccessBuffer, 1.0)) {
        return;
      }
      const ok = await this.playAudioElement(this.customSuccessUri, 1.0);
      if (ok) return;
    }

    // 2. Default Studio Pre-decoded AudioBuffer
    if (this.successBuffer && this.playBuffer(this.successBuffer, 1.0)) {
      return;
    }

    // 3. Fast decode & buffer play
    const decoded = await this.decodeBufferSafely(SOUND_DATA_URIS.success);
    if (decoded) {
      this.successBuffer = decoded;
      if (this.playBuffer(decoded, 1.0)) return;
    }

    // 4. HTML5 Audio Element
    const html5Success = await this.playAudioElement(SOUND_DATA_URIS.success, 1.0);
    if (!html5Success) {
      this.playSynthesizedSuccessChime();
    }
  }

  private playSynthesizedSuccessChime() {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Authentic Google Pay chime notes (D5 -> F#5 -> A5 -> D6 -> A6/D7 sparkle)
      const notes = [
        { freq: 587.33, start: 0.00, dur: 0.55, vol: 0.38 }, // D5
        { freq: 739.99, start: 0.13, dur: 0.65, vol: 0.42 }, // F#5
        { freq: 880.00, start: 0.26, dur: 0.85, vol: 0.46 }, // A5
        { freq: 1174.66, start: 0.42, dur: 2.20, vol: 0.52 }, // D6 (main bell)
        { freq: 1760.00, start: 0.56, dur: 3.10, vol: 0.36 }, // A6
        { freq: 2349.32, start: 0.58, dur: 3.00, vol: 0.28 }, // D7
        { freq: 2959.96, start: 0.62, dur: 2.60, vol: 0.16 }, // F#7
      ];

      notes.forEach((n) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const oscHarm = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + n.start;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, noteTime);

        oscHarm.type = 'triangle';
        oscHarm.frequency.setValueAtTime(n.freq * 2.003, noteTime);

        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(n.vol, noteTime + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + n.dur);

        osc.connect(gain);
        oscHarm.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        oscHarm.start(noteTime);
        osc.stop(noteTime + n.dur + 0.05);
        oscHarm.stop(noteTime + n.dur + 0.05);
      });

      // Metallic transients and crystalline chimes
      const sparkles = [
        { time: 0.01, freq: 3600 },
        { time: 0.14, freq: 4400 },
        { time: 0.27, freq: 5200 },
        { time: 0.43, freq: 6200 },
        { time: 0.57, freq: 7400 },
      ];
      sparkles.forEach((s) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + s.time;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(s.freq, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.17);
      });
    } catch {
      // Ignore
    }
  }

  // =========================================================================
  // 3. PAYMENT FAILURE SOUND
  // =========================================================================
  async playPaymentFailure() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 1. Custom uploaded sound priority
    if (this.customFailureUri) {
      if (this.customFailureBuffer && this.playBuffer(this.customFailureBuffer, 1.0)) {
        return;
      }
      const ok = await this.playAudioElement(this.customFailureUri, 1.0);
      if (ok) return;
    }

    // 2. Default AudioBuffer
    if (this.failureBuffer && this.playBuffer(this.failureBuffer, 1.0)) {
      return;
    }

    const decoded = await this.decodeBufferSafely(SOUND_DATA_URIS.failure);
    if (decoded) {
      this.failureBuffer = decoded;
      if (this.playBuffer(decoded, 1.0)) return;
    }

    const html5Success = await this.playAudioElement(SOUND_DATA_URIS.failure, 1.0);
    if (!html5Success) {
      this.playSynthesizedFailureSound();
    }
  }

  private playSynthesizedFailureSound() {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1: 0.0s to 0.22s (mid-low negative buzzer)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(290, now);
      osc1.frequency.exponentialRampToValueAtTime(220, now + 0.22);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.23);

      // Tone 2: 0.28s to 1.15s (deep decline thud)
      const t2 = now + 0.28;
      const osc2 = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(165, t2);
      osc2.frequency.exponentialRampToValueAtTime(80, t2 + 0.75);

      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(82, t2);
      oscSub.frequency.exponentialRampToValueAtTime(40, t2 + 0.75);

      gain2.gain.setValueAtTime(0.35, t2);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.85);

      osc2.connect(gain2);
      oscSub.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(t2);
      oscSub.start(t2);
      osc2.stop(t2 + 0.88);
      oscSub.stop(t2 + 0.88);
    } catch {
      // Ignore
    }
  }

  // Soft Keypad click sound
  playKeypadClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Ignore
    }
  }

  // QR detect soft beep (distinct from payment success)
  playQrScanBeep() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1600, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.10);
    } catch {
      // Ignore
    }
  }

  // Biometric sensor unlock sound
  playBiometricUnlock() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }

  // Compatibility aliases
  playCoinSound() {
    this.playPaymentSuccess();
  }

  playSuccessChime() {
    this.playPaymentSuccess();
  }

  playErrorSound() {
    this.playPaymentFailure();
  }
}

export const sounds = new SoundService();
