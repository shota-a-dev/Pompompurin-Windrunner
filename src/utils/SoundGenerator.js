/**
 * Web Audio API を使用してゲーム音を動的に生成するクラス
 */
export default class SoundGenerator {
    static ctx;
    static init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    static playTone(freq, type, duration, volume) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
    static playJump() {
        this.playTone(440, 'sine', 0.2, 0.1);
        setTimeout(() => this.playTone(660, 'sine', 0.2, 0.05), 50);
    }
    static playCoin() {
        this.playTone(880, 'triangle', 0.1, 0.1);
        setTimeout(() => this.playTone(1320, 'triangle', 0.1, 0.05), 30);
    }
    static playHit() {
        this.playTone(150, 'sawtooth', 0.5, 0.1);
    }
    static playFever() {
        [523, 659, 783, 1046].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 0.3, 0.05), i * 100);
        });
    }
}
