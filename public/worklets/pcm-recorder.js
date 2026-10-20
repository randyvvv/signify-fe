// AudioWorklet Kelas Live: audio mikrofon (sample rate konteks, mis. 48 kHz) ->
// PCM 16-bit mono 16 kHz, dikirim ke thread utama per 100 ms beserta level suara.
const TARGET_RATE = 16000;
const CHUNK_SAMPLES = 1600; // 100 ms

class PcmRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    // `sampleRate` = sample rate AudioContext (global di AudioWorkletGlobalScope).
    this.ratio = sampleRate / TARGET_RATE;
    this.phase = 0;
    this.acc = 0;
    this.count = 0;
    this.out = new Int16Array(CHUNK_SAMPLES);
    this.outLen = 0;
    this.sumSquares = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      // Rata-rata sampel per jendela keluaran = low-pass sederhana sebelum downsample.
      this.acc += channel[i];
      this.count++;
      this.phase += 1;
      if (this.phase < this.ratio) continue;
      this.phase -= this.ratio;

      const sample = Math.max(-1, Math.min(1, this.acc / this.count));
      this.acc = 0;
      this.count = 0;
      this.sumSquares += sample * sample;
      this.out[this.outLen++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;

      if (this.outLen === CHUNK_SAMPLES) {
        const level = Math.sqrt(this.sumSquares / CHUNK_SAMPLES);
        const pcm = this.out.buffer;
        this.port.postMessage({ pcm, level }, [pcm]);
        this.out = new Int16Array(CHUNK_SAMPLES);
        this.outLen = 0;
        this.sumSquares = 0;
      }
    }
    return true;
  }
}

registerProcessor("pcm-recorder", PcmRecorder);
