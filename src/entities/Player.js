import 'phaser';
import SoundGenerator from '../utils/SoundGenerator';
import { GameConfig } from '../config/GameConfig';
export default class Player extends Phaser.Physics.Arcade.Sprite {
    jumpCount = 0;
    maxJumps = GameConfig.PLAYER.MAX_JUMPS;
    jumpPower = GameConfig.PLAYER.JUMP_POWER;
    groundLine = GameConfig.PLAYER.GROUND_Y;
    isFever = false;
    feverColorIndex = 0;
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        // 物理境界を地面の高さに合わせる
        this.setCollideWorldBounds(true);
        this.scene.physics.world.bounds.height = GameConfig.GROUND.Y;
        const body = this.body;
        if (body) {
            body.setSize(GameConfig.PLAYER.HITBOX.WIDTH, GameConfig.PLAYER.HITBOX.HEIGHT);
            body.setOffset(GameConfig.PLAYER.HITBOX.OFFSET_X, GameConfig.PLAYER.HITBOX.OFFSET_Y);
        }
        this.setOrigin(0, 0);
        this.setDepth(GameConfig.DEPTH.PLAYER);
    }
    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.setVelocityY(this.jumpPower);
            this.jumpCount++;
            SoundGenerator.playJump();
        }
    }
    updatePlayer() {
        // フィーバー時の虹色演出 (AUTOモード/WebGLで動作)
        if (this.isFever) {
            this.feverColorIndex += 10;
            // HSVカラーをRGBに変換してセット
            const color = Phaser.Display.Color.HSVToRGB((this.feverColorIndex % 360) / 360, 0.8, 1).color;
            this.setTint(color);
        }
        const groundY = GameConfig.PLAYER.GROUND_Y;
        const body = this.body;
        // 落下中または接地中(y速度が0以上)の場合のみ、接地座標への吸着を行う
        if (body && this.y >= groundY - 1 && body.velocity.y >= 0) {
            this.y = groundY;
            this.setVelocityY(0);
            this.jumpCount = 0;
            if (this.anims.currentAnim?.key !== 'run') {
                this.play('run', true);
            }
            if (Math.random() < 0.4) {
                this.scene.events.emit('playerRun', this.x + 85, this.y + 160);
            }
        }
        else if (body) {
            if (body.velocity.y < 0) {
                this.play('jump', true);
            }
            else {
                this.play('fall', true);
            }
        }
    }
    setFeverMode(isFever) {
        this.isFever = isFever;
        if (!isFever) {
            this.clearTint();
        }
    }
}
