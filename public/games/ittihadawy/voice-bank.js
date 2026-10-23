// Short voices are decoded once and played on the already-unlocked game context.
// Music continues to stream through its existing HTML audio player.
export class GameVoiceBank {
  constructor(context, fetchAudio = (...args) => fetch(...args)) {
    this.context = context;
    this.fetchAudio = fetchAudio;
    this.buffers = new Map();
    this.voices = new Map();
  }
  load(url) {
    if (!this.buffers.has(url)) {
      const pending = this.fetchAudio(url).then(response => {
        if (!response.ok) throw new Error(`Voice HTTP ${response.status}`);
        return response.arrayBuffer();
      }).then(bytes => this.context.decodeAudioData(bytes));
      this.buffers.set(url, pending);
      pending.catch(() => { if (this.buffers.get(url) === pending) this.buffers.delete(url); });
    }
    return this.buffers.get(url);
  }
  preload(urls) { return Promise.allSettled(urls.map(url => this.load(url))); }
  voice(url) {
    if (!this.voices.has(url)) this.voices.set(url, new BufferedVoice(this, url));
    return this.voices.get(url);
  }
  stopAll() { for (const voice of this.voices.values()) voice.pause(); }
}
class BufferedVoice {
  constructor(bank, url) {
    this.bank = bank;
    this.url = url;
    this.bufferedVoice = true;
    this.version = 0;
    this.source = null;
    this.level = 1;
    this._muted = false;
    this.paused = true;
    this.gain = bank.context.createGain();
    this.gain.connect(bank.context.destination);
  }
  setVolume(value) {
    this.level = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    this.applyVolume();
  }
  applyVolume() { this.gain.gain.setTargetAtTime(this._muted ? 0 : this.level, this.bank.context.currentTime, .01); }
  set volume(value) { this.setVolume(value); }
  get volume() { return this.level; }
  set muted(value) { this._muted = !!value; this.applyVolume(); }
  get muted() { return this._muted; }
  set currentTime(value) { if (value === 0) this.pause(); }
  get currentTime() { return 0; }
  pause() {
    this.version++;
    this.paused = true;
    if (this.source) {
      const source = this.source;
      this.source = null;
      try { source.stop(); } catch {}
      source.disconnect();
    }
  }
  async play() {
    this.pause();
    const version = this.version;
    const context = this.bank.context;
    const [buffer] = await Promise.all([this.bank.load(this.url), context.resume()]);
    if (version !== this.version || this._muted || context.state === 'closed') return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain);
    source.onended = () => {
      source.disconnect();
      if (this.source === source) { this.source = null; this.paused = true; }
    };
    this.source = source;
    this.paused = false;
    this.applyVolume();
    source.start(context.currentTime);
  }
}
