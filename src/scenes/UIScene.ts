import 'phaser';

export default class UIScene extends Phaser.Scene {
    private scoreText!: Phaser.GameObjects.Text;
    private feverBar!: Phaser.GameObjects.Graphics;

    constructor() {
        super('UIScene');
    }

    create() {
        const { width } = this.scale;
        
        // スコア表示
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontSize: '32px',
            color: '#5E3A21',
            fontStyle: 'bold'
        });

        // フィーバーゲージの枠
        const barWidth = 300;
        this.add.graphics()
            .lineStyle(4, 0x5E3A21)
            .strokeRect(width / 2 - barWidth / 2, 30, barWidth, 20);

        // ゲージ本体
        this.feverBar = this.add.graphics();

        const mainGame = this.scene.get('MainGameScene');
        
        // スコア更新イベント
        mainGame.events.on('updateScore', (score: number) => {
            this.scoreText.setText(`SCORE: ${score}`);
        });
        
        // フィーバーゲージ更新イベント
        mainGame.events.on('updateFever', (percent: number) => {
            this.feverBar.clear();
            this.feverBar.fillStyle(percent >= 1 ? 0xFF4500 : 0xFDE047, 1);
            this.feverBar.fillRect(width / 2 - barWidth / 2 + 2, 32, (barWidth - 4) * percent, 16);
        });
    }
}
