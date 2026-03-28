import 'phaser';
import { GameConfig } from '../config/GameConfig';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // 起動時に最小限必要な素材（ロード画面のバーなど）があればここで読み込む
    }

    create() {
        // 初期ウィンドウ比からゲーム幅を再計算して適用する
        // これにより iPhone のアドレスバー等による初回縦長描画を抑制する
        try {
            const baseHeight = GameConfig.REFERENCE_HEIGHT;
            const aspect = window.innerWidth / window.innerHeight;
            const baseWidth = Math.round(baseHeight * aspect);
            this.scale.resize(baseWidth, baseHeight);

            // canvas の CSS を調整して親幅に広げる
            const canvas = this.game.canvas as HTMLCanvasElement | null;
            if (canvas) {
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                canvas.style.maxHeight = '100vh';
                canvas.style.display = 'block';
                canvas.style.margin = '0 auto';
            }

            // Phaser の内部リサイズ処理が走るように resize イベントを送る
            try { window.dispatchEvent(new Event('resize')); } catch (e) { /* ignore */ }
        } catch (e) {
            // 初期リサイズに失敗しても起動は継続
            console.warn('BootScene: initial resize failed', e);
        }

        // ロード画面へ遷移
        this.scene.start('PreloadScene');
    }
}
