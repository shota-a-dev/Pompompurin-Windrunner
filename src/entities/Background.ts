import 'phaser';
import { GameConfig } from '../config/GameConfig';

export default class Background {
    private scene: Phaser.Scene;
    private layers: { sprite: Phaser.GameObjects.TileSprite; speed: number }[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        const { height } = this.scene.scale;

        // 背景レイヤーの設定 (GameConfig参照)
        this.addLayer('bg_back', GameConfig.BG_SPEEDS.BACK, 0, height, GameConfig.DEPTH.BACKGROUND);
        this.addLayer('bg_mid', GameConfig.BG_SPEEDS.MID, 0, height, GameConfig.DEPTH.BACKGROUND + 1);
        this.addLayer('bg_front', GameConfig.BG_SPEEDS.FRONT, 0, height, GameConfig.DEPTH.BACKGROUND + 2);
        
        // 地面はMainGameScene側でブロックとして生成するため、ここからは削除
    }

    private addLayer(texture: string, speed: number, y: number, height: number, depth: number): void {
        const { width } = this.scene.scale;
        const sprite = this.scene.add.tileSprite(0, y, width, height, texture)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(depth);
        
        const img = this.scene.textures.get(texture).getSourceImage() as HTMLImageElement;
        if (img) {
            const scale = height / img.height;
            sprite.setTileScale(scale, scale);
        }
        
        this.layers.push({ sprite, speed });
    }

    public update(baseSpeed: number): void {
        this.layers.forEach(layer => {
            layer.sprite.tilePositionX += (baseSpeed * layer.speed) / layer.sprite.tileScaleX;
        });
    }
}
