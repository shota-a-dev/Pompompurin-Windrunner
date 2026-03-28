import 'phaser';
import SoundGenerator from '../utils/SoundGenerator';
import { GameConfig } from '../config/GameConfig';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    private jumpCount: number = 0;
    private maxJumps: number = GameConfig.PLAYER.MAX_JUMPS;
    private jumpPower: number = GameConfig.PLAYER.JUMP_POWER;
    private isFever: boolean = false;
    private feverColorIndex: number = 0;
    private wasInAir: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // 初期テクスチャを個別画像の一つに設定
        super(scene, x, y, 'purin_run_0');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 物理境界の設定（下への落下を許容）
        this.setCollideWorldBounds(true);
        (this.scene.physics.world.bounds as any).height = GameConfig.REFERENCE_HEIGHT + 200; 
        
        // 以前の左上基準 (0, 0) に戻す
        this.setOrigin(0, 0);
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setSize(GameConfig.PLAYER.HITBOX.WIDTH, GameConfig.PLAYER.HITBOX.HEIGHT);
            body.setOffset(GameConfig.PLAYER.HITBOX.OFFSET_X, GameConfig.PLAYER.HITBOX.OFFSET_Y);
        }

        this.setDepth(GameConfig.DEPTH.PLAYER);
    }

    public jump(): void {
        if (this.jumpCount < this.maxJumps) {
            this.setVelocityY(this.jumpPower);
            this.jumpCount++;
            this.wasInAir = true;
            SoundGenerator.playJump();
        }
    }

    public updatePlayer(): void {
        // フィーバー時の虹色演出
        if (this.isFever) {
            this.feverColorIndex += 10;
            const color = Phaser.Display.Color.HSVToRGB((this.feverColorIndex % 360) / 360, 0.8, 1).color;
            this.setTint(color);
        }

        const groundY = GameConfig.PLAYER.GROUND_Y; // 440 (以前の安定値)
        const body = this.body as Phaser.Physics.Arcade.Body;

        // 接地判定（物理的な接触 + 高さが目標に近いこと）
        if (body && body.touching.down && body.velocity.y >= 0 && Math.abs(this.y - groundY) < 15) {
            if (this.wasInAir) {
                this.scene.events.emit('playerLand');
                this.wasInAir = false;
            }

            this.y = groundY; // 座標の微細なズレを補正して吸着
            this.setVelocityY(0);
            this.jumpCount = 0;
            
            if (this.anims.currentAnim?.key !== 'run') {
                this.play('run', true);
            }
            
            if (Math.random() < 0.4) {
                this.scene.events.emit('playerRun', this.x + 85, this.y + 160);
            }
        } else if (body) {
            this.wasInAir = true;
            if (body.velocity.y < 0) {
                this.play('jump', true);
            } else {
                this.play('fall', true);
            }
        }
    }

    public setFeverMode(isFever: boolean): void {
        this.isFever = isFever;
        if (!isFever) {
            this.clearTint();
        }
    }
}
