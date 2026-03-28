import 'phaser';
import { GameConfig } from '../config/GameConfig';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        this.load.image('bg_back', 'assets/image/background/bg_back.png');
        this.load.image('bg_mid', 'assets/image/background/bg_mid.png');
        this.load.image('bg_front', 'assets/image/background/bg_front.png');
        this.load.image('ground', 'assets/image/background/ground.png');

        // 個別画像の読み込み (160x160)
        this.load.image('purin_run_0', 'assets/image/sprites/purin_run_0.png');
        this.load.image('purin_run_1', 'assets/image/sprites/purin_run_1.png');
        this.load.image('purin_jump', 'assets/image/sprites/purin_jump.png');
        this.load.image('purin_fall', 'assets/image/sprites/purin_fall.png');
        
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
        // アニメーションの作成（個別画像を指定）
        this.anims.create({
            key: 'run',
            frames: [
                { key: 'purin_run_0' },
                { key: 'purin_run_1' }
            ],
            frameRate: GameConfig.PLAYER.ANIM_FPS, // 設定ファイルから取得
            repeat: -1
        });
        
        this.anims.create({
            key: 'jump',
            frames: [{ key: 'purin_jump' }]
        });
        
        this.anims.create({
            key: 'fall',
            frames: [{ key: 'purin_fall' }]
        });

        this.scene.start('TitleScene');
    }
}
