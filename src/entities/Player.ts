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
        super(scene, x, y, 'purin_run_0');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 物理世界の境界設定（下への落下を許容）
        this.setCollideWorldBounds(true);
        (this.scene.physics.world.bounds as any).height = GameConfig.REFERENCE_HEIGHT + 500; 
        
        this.setOrigin(0, 0);
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setSize(GameConfig.PLAYER.HITBOX.WIDTH, GameConfig.PLAYER.HITBOX.HEIGHT);
            body.setOffset(GameConfig.PLAYER.HITBOX.OFFSET_X, GameConfig.PLAYER.HITBOX.OFFSET_Y);
            
            // 物理挙動の安定化設定
            body.setBounce(0, 0);
            body.setDamping(true);
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

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        const groundY = GameConfig.PLAYER.GROUND_Y; // 440 (頭基準の接地目標)

        // 【刷新】物理エンジンによる衝突判定を100%信頼する方式
        // 1. body.touching.down: 他の物理ボディ（地面）の上にいるか
        // 2. body.velocity.y >= 0: 上昇中でない（ジャンプした瞬間はリセットしない）
        // 3. Math.abs(this.y - groundY) < 15: 実際の座標が地面の高さに近い
        const isGrounded = (body.touching.down || body.blocked.down) && body.velocity.y >= 0 && Math.abs(this.y - groundY) < 15;

        if (isGrounded) {
            // 着地した瞬間を検知
            if (this.wasInAir) {
                this.scene.events.emit('playerLand');
                this.wasInAir = false;
            }

            // ジャンプ回数をリセット
            this.jumpCount = 0;
            
            if (this.anims.currentAnim?.key !== 'run') {
                this.play('run', true);
            }
            
            if (Math.random() < 0.4) {
                // 接地中のみ土埃を出す
                this.scene.events.emit('playerRun', this.x + 85, this.y + 160);
            }
        } else {
            // 空中
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
