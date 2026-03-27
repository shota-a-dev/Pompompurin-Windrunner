import 'phaser';
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }
    preload() {
        this.load.image('bg_back', 'assets/image/background/bg_back.png');
        this.load.image('bg_mid', 'assets/image/background/bg_mid.png');
        this.load.image('bg_front', 'assets/image/background/bg_front.png');
        this.load.image('ground', 'assets/image/background/ground.png');
        // oldのロジック sw = width / 4 を手動で厳密適用
        // 762 / 4 = 190
        this.load.spritesheet('player', 'assets/image/sprites/player.png', {
            frameWidth: 190, // 直しました。
            frameHeight: 190,
            margin: 0,
            spacing: 0
        });
        this.load.image('coin', 'assets/image/sprites/coin.png');
        this.load.image('enemy_land', 'assets/image/sprites/enemy_land.png');
        this.load.image('enemy_fly', 'assets/image/sprites/enemy_fly.png');
        this.load.image('purin_gameover', 'assets/image/ui/purin_gameover.png');
        this.load.image('purin_best', 'assets/image/ui/purin_update_best.png');
        const { width, height } = this.scale;
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);
        this.load.on('complete', () => loadingText.destroy());
    }
    create() {
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({ key: 'jump', frames: [{ key: 'player', frame: 2 }] });
        this.anims.create({ key: 'fall', frames: [{ key: 'player', frame: 3 }] });
        this.scene.start('TitleScene');
    }
}
