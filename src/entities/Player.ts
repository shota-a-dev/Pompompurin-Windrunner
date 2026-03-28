import 'phaser';
import SoundGenerator from '../utils/SoundGenerator';
import { GameConfig } from '../config/GameConfig';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    private jumpCount: number = 0;
    private maxJumps: number = GameConfig.PLAYER.MAX_JUMPS;
    private jumpPower: number = GameConfig.PLAYER.JUMP_POWER;
    private groundLine: number = GameConfig.PLAYER.GROUND_Y;
    private isFever: boolean = false;
    private feverColorIndex: number = 0;
    private wasInAir: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 物理境界の設定（左右と上は有効、下への落下を許容するため高さは広めに設定）
        this.setCollideWorldBounds(true);
        (this.scene.physics.world.bounds as any).height = GameConfig.HEIGHT + 200; 
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setSize(GameConfig.PLAYER.HITBOX.WIDTH, GameConfig.PLAYER.HITBOX.HEIGHT);
            body.setOffset(GameConfig.PLAYER.HITBOX.OFFSET_X, GameConfig.PLAYER.HITBOX.OFFSET_Y);
        }

        this.setOrigin(0, 0);
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
        // フィーバー時の虹色演出 (AUTOモード/WebGLで動作)
        if (this.isFever) {
            this.feverColorIndex += 10;
            // HSVカラーをRGBに変換してセット
            const color = Phaser.Display.Color.HSVToRGB((this.feverColorIndex % 360) / 360, 0.8, 1).color;
            this.setTint(color);
        }

        const groundY = GameConfig.PLAYER.GROUND_Y; 
        const body = this.body as Phaser.Physics.Arcade.Body;

        // 修正: 物理エンジンが接地と判断し、かつ下降中であり、さらに地面に近い高さにいる時のみ接地処理を行う
        // これにより、ジャンプの頂点（速度0付近）での誤判定を防ぐ
        if (body && body.touching.down && body.velocity.y >= 0 && Math.abs(this.y - groundY) < 10) {
            // 着地した瞬間を検知
            if (this.wasInAir) {
                this.scene.events.emit('playerLand');
                this.wasInAir = false;
            }

            this.y = groundY; // 座標の微細なズレを補正
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
