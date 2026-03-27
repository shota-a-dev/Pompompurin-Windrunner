import 'phaser';

export default class Background {
    private scene: Phaser.Scene;
    private layers: { sprite: Phaser.GameObjects.TileSprite; speed: number }[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        const { width, height } = this.scene.scale;

        // old基準の描画順序 (PlayerはDepth 10)
        this.addLayer('bg_back', 0.1, 0, height, 0);
        this.addLayer('bg_mid', 0.2, 0, height, 1);
        this.addLayer('bg_front', 0.4, 0, height, 2);
        
        // 地面は Depth 20 (Playerより手前、oldのlayers[3])
        this.addLayer('ground', 1.0, 620, 110, 20);
    }

    private addLayer(texture: string, speed: number, y: number, height: number, depth: number): void {
        const { width } = this.scene.scale;
        const sprite = this.scene.add.tileSprite(0, y, width, height, texture)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(depth);
        
        // 画像本来のサイズを維持する (oldのdrawImageと同様)
        const img = this.scene.textures.get(texture).getSourceImage() as HTMLImageElement;
        if (img) {
            // 縦幅を合わせつつ、横幅は画面全体に広げる
            const scale = height / img.height;
            sprite.setTileScale(scale, scale);
        }
        
        this.layers.push({ sprite, speed });
    }

    public update(baseSpeed: number): void {
        this.layers.forEach(layer => {
            // 表示倍率(tileScaleX)で割ることで、解像度に関わらず画面上の移動ピクセル数を一定に保つ
            layer.sprite.tilePositionX += (baseSpeed * layer.speed) / layer.sprite.tileScaleX;
        });
    }
}
