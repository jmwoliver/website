import type { GameAudio, ToneOptions } from "./types";

export class BrowserGameAudio implements GameAudio {
  #context?: AudioContext;

  async unlock() {
    this.#context ??= new AudioContext();
    if (this.#context.state === "suspended") await this.#context.resume();
  }

  tone({
    frequency,
    duration = 0.08,
    volume = 0.06,
    type = "square",
    endFrequency = frequency,
  }: ToneOptions) {
    const context = this.#context;
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  noise(duration = 0.06, volume = 0.035) {
    const context = this.#context;
    if (!context) return;

    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.buffer = buffer;
    source.connect(gain).connect(context.destination);
    source.start();
  }

  destroy() {
    void this.#context?.close();
  }
}
