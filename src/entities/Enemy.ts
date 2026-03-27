import 'phaser';

export default class Enemy extends Phaser.GameObjects.Sprite {
    private type: 'land' | 'fly';
    private animTimer: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, type: 'land' | 'fly') {
        super(scene, x, y, type === 'fly' ? 'enemy_fly' : 'enemy_land');
        this.type = type;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        
        this.setDisplaySize(100, 100);
        this.setDepth(30); // 地面(20)より手前
        this.setOrigin(0, 0);
    }

    public updateObject(speed: number): void {
        // old と同じ移動方式
        this.x -= speed;

        // old と同じ上下運動 (飛行タイプのみ)
        if (this.type === 'fly') {
            this.animTimer++;
            this.y += Math.sin(this.animTimer * 0.1) * 2;
        }

        if (this.x < -100) {
            this.destroy();
        }
    }
}
