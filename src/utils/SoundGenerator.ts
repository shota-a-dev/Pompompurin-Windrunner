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

    public static playCracker(): void {
        // 祝祭的なクラッカー音を複数のバーストとキラキラ音で表現する
        (async () => {
            try {
                if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
            } catch (e) {
                // resume に失敗しても続行する（最悪音が出なくてもゲームは続行）
            }

            const now = this.audioCtx.currentTime;

            // 複数の短いノイズバーストでパーンパーンとしたクラッカー感を再現
            const bursts = [
                { offset: 0.0, duration: 0.12, gain: 0.22, freq: 1400 },
                { offset: 0.12, duration: 0.10, gain: 0.16, freq: 1600 },
                { offset: 0.24, duration: 0.08, gain: 0.12, freq: 1800 }
            ];

            for (const b of bursts) {
                const t = now + b.offset;
                const bufferSize = Math.floor(this.audioCtx.sampleRate * b.duration);
                const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    // 急速に減衰する包絡でパチッとした音にする
                    const env = Math.exp(-8 * (i / bufferSize));
                    data[i] = (Math.random() * 2 - 1) * env;
                }

                const noise = this.audioCtx.createBufferSource();
                noise.buffer = buffer;
                const noiseGain = this.audioCtx.createGain();
                noiseGain.gain.setValueAtTime(b.gain, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, t + b.duration);

                const bp = this.audioCtx.createBiquadFilter();
                bp.type = 'bandpass';
                bp.frequency.setValueAtTime(b.freq, t);
                bp.Q.setValueAtTime(1.2, t);

                noise.connect(bp);
                bp.connect(noiseGain);
                noiseGain.connect(this.audioCtx.destination);

                noise.start(t);
                noise.stop(t + b.duration);
            }

            // 高域のキラキラ（短い高音アルペジオ）を重ねて祝祭感を演出
            const sparkle = [2200, 2600, 3000, 3400];
            sparkle.forEach((f, i) => {
                this.playTone(f, 'sine', 0.06, 0.05, now + 0.04 + i * 0.06);
            });

            // 軽い補助パーカッションで厚みを追加
            this.playTone(1200, 'sawtooth', 0.04, 0.06, now + 0.02);
            this.playTone(900, 'triangle', 0.05, 0.04, now + 0.18);
        })();
    }

    /**
     * ユーザー操作でAudioContextを確実に再開するためのヘルパー
     */
    public static async ensureAudioStarted(): Promise<void> {
        try {
            if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
        } catch (e) {
            // 無視
        }
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
