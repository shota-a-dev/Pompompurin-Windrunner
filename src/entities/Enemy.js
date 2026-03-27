import 'phaser';
export default class Enemy extends Phaser.GameObjects.Sprite {
    enemyType;
    animTimer = 0;
    constructor(scene, x, y, type) {
        super(scene, x, y, type === 'fly' ? 'enemy_fly' : 'enemy_land');
        this.enemyType = type;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.setDisplaySize(100, 100);
        this.setOrigin(0, 0);
    }
    updateObject(speed) {
        // old と同じ移動方式
        this.x -= speed;
        // old と同じ上下運動 (飛行タイプのみ)
        if (this.enemyType === 'fly') {
            this.animTimer++;
            this.y += Math.sin(this.animTimer * 0.1) * 2;
        }
        if (this.x < -100) {
            this.destroy();
        }
    }
}
