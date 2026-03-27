export default class SoundGenerator {
    private static audioCtx: AudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    private static bgmNode: AudioBufferSourceNode | null = null;

    private static playTone(freq: number, type: OscillatorType, duration: number, volume: number, startTime: number = 0): void {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime || this.audioCtx.currentTime);
        
        gain.gain.setValueAtTime(volume, startTime || this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, (startTime || this.audioCtx.currentTime) + duration);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start(startTime || this.audioCtx.currentTime);
        osc.stop((startTime || this.audioCtx.currentTime) + duration);
    }

    public static playJump(): void {
        this.playTone(440, 'sine', 0.1, 0.1);
        this.playTone(660, 'sine', 0.1, 0.05, this.audioCtx.currentTime + 0.05);
    }

    public static playCoin(): void {
        this.playTone(880, 'sine', 0.1, 0.1);
    }

    public static playFever(): void {
        const now = this.audioCtx.currentTime;
        this.playTone(523.25, 'square', 0.1, 0.1, now);
        this.playTone(659.25, 'square', 0.1, 0.1, now + 0.1);
        this.playTone(783.99, 'square', 0.2, 0.1, now + 0.2);
    }

    public static playHit(): void {
        this.playTone(110, 'sawtooth', 0.3, 0.2);
    }

    /**
     * ウィンドランナー風の軽快なBGMをループ再生する
     */
    public static playBGM(): void {
        if (this.bgmNode) return; // 二重再生防止

        const tempo = 140; // 少しテンポアップ
        const secondsPerBeat = 60 / tempo;
        const loopDuration = secondsPerBeat * 16;
        
        // より明るく軽快なメロディ (C, G, E, F, G...)
        const melody = [
            523.25, 783.99, 659.25, 698.46, 783.99, 0, 1046.50, 0,
            880.00, 783.99, 698.46, 659.25, 523.25, 0, 587.33, 0
        ];

        const playLoop = () => {
            const now = this.audioCtx.currentTime;
            for (let i = 0; i < melody.length; i++) {
                if (melody[i] > 0) {
                    // 歯切れの良いtriangle波でメロディ
                    this.playTone(melody[i], 'triangle', secondsPerBeat * 0.5, 0.03, now + i * secondsPerBeat);
                }
                
                // 軽快なベースライン (裏打ち)
                if (i % 2 === 1) {
                    const baseFreq = i < 8 ? 261.63 : 196.00; // C4 or G3
                    this.playTone(baseFreq, 'sine', secondsPerBeat * 0.2, 0.04, now + i * secondsPerBeat);
                }
            }
            // 次のループを予約
            setTimeout(playLoop, loopDuration * 1000 - 50);
        };

        playLoop();
    }
}
