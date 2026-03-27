import 'phaser';
export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }
    preload() {
        // 起動時に最小限必要な素材（ロード画面のバーなど）があればここで読み込む
    }
    create() {
        // ロード画面へ遷移
        this.scene.start('PreloadScene');
    }
}
