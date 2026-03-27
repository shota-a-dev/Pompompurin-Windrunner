import 'phaser';

export default class Coin extends Phaser.GameObjects.Sprite {
    private angleVal: number = 0;
    private baseY: number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'coin');
        this.baseY = y;
        this.angleVal = Math.random() * Math.PI * 2;
        
        scene.add.existing(this);
        scene.physics.add.existing(this); // 判定用には物理エンジンを残す
        (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        
        this.setDisplaySize(55, 55);
        this.setDepth(30); // 地面(20)より手前
        this.setOrigin(0, 0);
    }

    public updateObject(speed: number): void {
        // old と同じ移動方式
        this.x -= speed;
        
        // old と同じ浮遊アニメーション
        this.angleVal += 0.1;
        this.y = this.baseY + Math.sin(this.angleVal) * 10;

        if (this.x < -100) {
            this.destroy();
        }
    }
}
