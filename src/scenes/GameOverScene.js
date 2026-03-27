import 'phaser';
export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }
    create(data) {
        const { width, height } = this.scale;
        // 暗転
        this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);
        // 結果画像
        this.add.image(width / 2, height / 2 - 50, 'purin_gameover').setScale(0.8);
        this.add.text(width / 2, height / 2 + 100, 'GAME OVER', {
            fontSize: '48px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 160, `FINAL SCORE: ${data.score}`, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 220, 'TAP TO RETRY', {
            fontSize: '24px',
            color: '#FDE047'
        }).setOrigin(0.5);
        this.input.once('pointerdown', () => {
            this.scene.start('MainGameScene');
        });
    }
}
