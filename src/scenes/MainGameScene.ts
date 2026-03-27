import 'phaser';
import Player from '../entities/Player';
import Background from '../entities/Background';
import Coin from '../entities/Coin';
import Enemy from '../entities/Enemy';
import SoundGenerator from '../utils/SoundGenerator';
import { GameConfig } from '../config/GameConfig';

export default class MainGameScene extends Phaser.Scene {
    private player!: Player;
    private background!: Background;
    private coins!: Phaser.GameObjects.Group;
    private enemies!: Phaser.GameObjects.Group;
    private coinEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private enemyDebrisEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    
    private gameSpeed: number = GameConfig.SPEED.NORMAL;
    private score: number = 0;
    private distance: number = 0;
    private spawnTimer: number = 0;
    private feverGauge: number = 0;
    private isFever: boolean = false;
    private feverTimer: number = 0;
    private isGameOver: boolean = false;

    constructor() {
        super('MainGameScene');
    }

    create() {
        this.score = 0;
        this.distance = 0;
        this.spawnTimer = 0;
        this.feverGauge = 0;
        this.isFever = false;
        this.isGameOver = false;
        this.gameSpeed = GameConfig.SPEED.NORMAL;

        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) uiLayer.classList.remove('hidden');

        this.background = new Background(this);
        this.player = new Player(this, GameConfig.PLAYER.START_X, GameConfig.PLAYER.START_Y);

        this.coins = this.add.group();
        this.enemies = this.add.group();

        // BGMの開始
        SoundGenerator.playBGM();

        this.coinEmitter = this.add.particles(0, 0, 'coin', {
            speed: { min: -100, max: 100 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            gravityY: 200,
            emitting: false // 最初から出ないように固定
        }).setDepth(GameConfig.DEPTH.OBJECTS + 1);

        // 砂埃用のテクスチャ (サイズを設定値に連動)
        const dustSize = GameConfig.PLAYER.DUST_SIZE;
        const circle = this.make.graphics({ x: 0, y: 0 });
        circle.fillStyle(0xD2B48C, 1);
        circle.fillCircle(dustSize, dustSize, dustSize);
        circle.generateTexture('dust_particle', dustSize * 2, dustSize * 2);
        
        // 敵の破片用のテクスチャ（赤い丸）
        const redCircle = this.make.graphics({ x: 0, y: 0 });
        redCircle.fillStyle(0xFF0000, 1);
        redCircle.fillCircle(8, 8, 8);
        redCircle.generateTexture('enemy_debris', 16, 16);
        
        circle.destroy();
        redCircle.destroy();

        this.dustEmitter = this.add.particles(0, 0, 'dust_particle', {
            scale: { start: 1, end: 0 },
            alpha: { start: 0.6, end: 0 },
            speed: { min: 20, max: GameConfig.PLAYER.DUST_SPEED },
            angle: { min: 180, max: 230 },
            lifespan: GameConfig.PLAYER.DUST_LIFESPAN,
            emitting: false 
        }).setDepth(GameConfig.DEPTH.DUST);

        this.enemyDebrisEmitter = this.add.particles(0, 0, 'enemy_debris', {
            speed: { min: 100, max: 400 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            gravityY: 300,
            emitting: false // 最初から出ないように固定
        }).setDepth(GameConfig.DEPTH.OBJECTS + 1);

        this.events.on('playerRun', (x: number, y: number) => {
            this.dustEmitter.explode(GameConfig.PLAYER.DUST_AMOUNT, x, y); 
        });

        this.scene.stop('UIScene');

        this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);

        this.input.on('pointerdown', () => this.player.jump());
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return;

        if (this.isFever) {
            this.feverTimer -= delta;
            if (this.feverTimer <= 0) {
                this.isFever = false;
                this.feverGauge = 0;
                this.player.setFeverMode(false);
                this.gameSpeed = GameConfig.SPEED.NORMAL;
            }
        }

        const deltaMultiplier = delta / (1000 / 60);
        const currentSpeed = (this.isFever ? GameConfig.SPEED.FEVER : this.gameSpeed) * deltaMultiplier;
        
        this.background.update(currentSpeed);
        this.player.updatePlayer();

        const coinArray = this.coins.getChildren();
        for (let i = coinArray.length - 1; i >= 0; i--) {
            const coin = coinArray[i] as any;
            if (coin && coin.updateObject) coin.updateObject(currentSpeed);
        }

        const enemyArray = this.enemies.getChildren();
        for (let i = enemyArray.length - 1; i >= 0; i--) {
            const enemy = enemyArray[i] as any;
            if (enemy && enemy.updateObject) enemy.updateObject(currentSpeed);
        }

        this.distance += currentSpeed;
        this.score = Math.floor(this.distance / 10);
        
        const scoreUI = document.getElementById('currentScore');
        if (scoreUI) scoreUI.innerText = this.score.toString();

        this.spawnTimer += deltaMultiplier;
        if (this.spawnTimer > GameConfig.SPAWN.INTERVAL) {
            this.spawnObject();
            this.spawnTimer = 0;
        }
    }

    private spawnObject() {
        const x = this.scale.width + 100;
        const groundY = GameConfig.GROUND.Y;

        if (Math.random() < 0.7) {
            const coinCount = Math.floor(Math.random() * 3) + 3;
            const baseY = groundY - 150 - Math.random() * 200;
            for (let i = 0; i < coinCount; i++) {
                const coin = new Coin(this, x + i * 60, baseY);
                coin.setDepth(GameConfig.DEPTH.OBJECTS);
                this.coins.add(coin);
            }
        } else {
            const isFly = Math.random() > 0.7;
            const y = isFly ? groundY - 180 : groundY - 100;
            const enemy = new Enemy(this, x, y, isFly ? 'fly' : 'land');
            enemy.setDepth(GameConfig.DEPTH.OBJECTS);
            this.enemies.add(enemy);
        }
    }

    private collectCoin(player: any, coin: any) {
        this.coinEmitter.explode(10, coin.x + 25, coin.y + 25);
        coin.destroy();
        SoundGenerator.playCoin();
        this.distance += 1000;
        if (!this.isFever) {
            this.feverGauge += GameConfig.FEVER.COIN_REWARD;
            if (this.feverGauge >= GameConfig.FEVER.THRESHOLD) this.startFever();
        }
    }

    private startFever() {
        this.isFever = true;
        this.feverTimer = GameConfig.FEVER.DURATION;
        this.gameSpeed = GameConfig.SPEED.FEVER;
        this.player.setFeverMode(true);
        SoundGenerator.playFever();
    }

    private hitEnemy(player: any, enemy: any) {
        if (this.isFever) {
            // 敵撃破時のバラバラ演出
            this.enemyDebrisEmitter.explode(12, enemy.x + 50, enemy.y + 50);
            enemy.destroy();
            this.cameras.main.shake(100, 0.01);
            SoundGenerator.playCoin(); // 撃破音の代用
        } else {
            SoundGenerator.playHit();
            this.isGameOver = true;
            this.physics.pause();
            this.showGameOver();
        }
    }

    private showGameOver() {
        const gameOverScreen = document.getElementById('gameover-screen');
        const finalScoreUI = document.getElementById('finalScore');
        const resultImage = document.getElementById('resultImage');

        if (finalScoreUI) finalScoreUI.innerText = this.score.toString();
        if (resultImage) {
            const bestScore = parseInt(localStorage.getItem('pomRunnerBestScore') || '0');
            const isNewBest = this.score > bestScore;
            (resultImage as HTMLImageElement).src = isNewBest ? 'assets/image/ui/purin_update_best.png' : 'assets/image/ui/purin_gameover.png';
            if (isNewBest) localStorage.setItem('pomRunnerBestScore', this.score.toString());
        }

        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
            setTimeout(() => gameOverScreen.classList.add('opacity-100'), 10);
            gameOverScreen.style.pointerEvents = 'auto';
        }

        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.onclick = () => location.reload();
        }
    }
}
