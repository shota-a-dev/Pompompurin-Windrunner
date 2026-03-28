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
    private groundGroup!: Phaser.Physics.Arcade.Group;
    private coins!: Phaser.GameObjects.Group;
    private enemies!: Phaser.GameObjects.Group;
    private coinEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private enemyDebrisEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    
    private gameSpeed: number = GameConfig.SPEED.NORMAL;
    private score: number = 0;
    private lastMilestoneScore: number = 0;
    private distance: number = 0;
    private spawnTimer: number = 0;
    private groundSpawnX: number = 0; // 地面を生成する次のX座標
    private feverGauge: number = 0;
    private isFever: boolean = false;
    private feverTimer: number = 0;
    private isGameOver: boolean = false;

    // 統計データ
    private coinsCollected: number = 0;
    private enemiesDefeated: number = 0;

    constructor() {
        super('MainGameScene');
    }

    create() {
        this.score = 0;
        this.lastMilestoneScore = 0;
        this.distance = 0;
        this.spawnTimer = 0;
        this.feverGauge = 0;
        this.isFever = false;
        this.isGameOver = false;
        this.gameSpeed = GameConfig.SPEED.NORMAL;
        this.groundSpawnX = 0;
        this.coinsCollected = 0;
        this.enemiesDefeated = 0;

        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) uiLayer.classList.remove('hidden');

        this.background = new Background(this);
        
        // 地面グループの初期化 (動的に動かすため通常のGroupにする)
        this.groundGroup = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        
        // 初期の地面を生成（画面幅分＋α）
        while (this.groundSpawnX < this.scale.width + GameConfig.GROUND.BLOCK_WIDTH) {
            this.spawnGround(false); // 最初は穴を開けない
        }

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
            emitting: false
        }).setDepth(GameConfig.DEPTH.OBJECTS + 1);

        // 砂埃用のテクスチャ
        const dustSize = GameConfig.PLAYER.DUST_SIZE;
        const circle = this.make.graphics({ x: 0, y: 0 });
        circle.fillStyle(0xD2B48C, 1);
        circle.fillCircle(dustSize, dustSize, dustSize);
        circle.generateTexture('dust_particle', dustSize * 2, dustSize * 2);
        
        // 敵の破片用のテクスチャ
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
            emitting: false
        }).setDepth(GameConfig.DEPTH.OBJECTS + 1);

        this.events.on('playerRun', (x: number, y: number) => {
            this.dustEmitter.explode(GameConfig.PLAYER.DUST_AMOUNT, x, y); 
        });

        this.events.on('playerLand', () => {
            this.cameras.main.shake(100, GameConfig.JUICE.LANDING_SHAKE);
        });

        this.scene.stop('UIScene');

        // プレイヤーと地面の衝突判定
        this.physics.add.collider(this.player, this.groundGroup);
        
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);

        this.input.on('pointerdown', () => this.player.jump());
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return;

        // 落下判定
        if (this.player.y > this.scale.height) {
            this.handleGameOver();
            return;
        }

        if (this.isFever) {
            this.feverTimer -= delta;
            if (this.feverTimer <= 0) {
                this.isFever = false;
                this.feverGauge = 0;
                this.player.setFeverMode(false);
            }
        }

        const deltaMultiplier = delta / (1000 / 60);
        const currentSpeed = (this.isFever 
            ? this.gameSpeed * GameConfig.SPEED.FEVER_SPEED_MAGNIFICATION 
            : this.gameSpeed) * deltaMultiplier;
        
        this.background.update(currentSpeed);
        this.player.updatePlayer();

        // 地面ブロックの移動と生成
        this.updateGround(currentSpeed);

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
        
        const scoreMilestone = Math.floor(this.score / 1000);
        if (scoreMilestone > this.lastMilestoneScore) {
            this.gameSpeed += GameConfig.SPEED.INCREMENT;
            this.lastMilestoneScore = scoreMilestone;
        }

        this.updateScoreUI();

        this.spawnTimer += deltaMultiplier;
        if (this.spawnTimer > GameConfig.SPAWN.INTERVAL) {
            this.spawnObject();
            this.spawnTimer = 0;
        }
    }

    private spawnGround(allowHole: boolean = true) {
        if (allowHole && Math.random() < GameConfig.GROUND.HOLE_CHANCE) {
            this.groundSpawnX += GameConfig.GROUND.BLOCK_WIDTH;
            return;
        }

        const ground = this.add.sprite(this.groundSpawnX, GameConfig.GROUND.Y, 'ground')
            .setOrigin(0, 0)
            .setDepth(GameConfig.DEPTH.GROUND);
        
        // 見た目のサイズを固定
        ground.setDisplaySize(GameConfig.GROUND.BLOCK_WIDTH, GameConfig.GROUND.HEIGHT);
        
        // 物理ボディの設定を個別に強化
        this.groundGroup.add(ground);
        const body = ground.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);
        
        this.groundSpawnX += GameConfig.GROUND.BLOCK_WIDTH;
    }

    private updateGround(speed: number) {
        this.groundGroup.getChildren().forEach((child: any) => {
            child.x -= speed;
            if (child.x < -GameConfig.GROUND.BLOCK_WIDTH) {
                child.destroy();
            }
        });

        this.groundSpawnX -= speed;

        while (this.groundSpawnX < this.scale.width + GameConfig.GROUND.BLOCK_WIDTH) {
            this.spawnGround();
        }
    }

    private updateScoreUI(jump: boolean = false) {
        const scoreUI = document.getElementById('currentScore');
        if (scoreUI) {
            scoreUI.innerText = this.score.toString();
            if (jump) {
                scoreUI.style.transform = `scale(${GameConfig.JUICE.COIN_SCORE_JUMP})`;
                setTimeout(() => {
                    scoreUI.style.transform = 'scale(1)';
                }, 100);
            }
        }
    }

    private spawnObject() {
        const x = this.scale.width + 100;
        const groundY = GameConfig.GROUND.Y;

        // 地面があるかどうかの簡易チェック
        const hasGroundAtSpawn = this.groundGroup.getChildren().some((child: any) => {
            return child.x <= x && (child.x + GameConfig.GROUND.BLOCK_WIDTH) >= x;
        });

        if (Math.random() < 0.7) {
            // コインは穴の上でもOK（空中配置）
            const coinCount = Math.floor(Math.random() * 3) + 3;
            const baseY = groundY - 150 - Math.random() * 200;
            for (let i = 0; i < coinCount; i++) {
                const coin = new Coin(this, x + i * 60, baseY);
                coin.setDepth(GameConfig.DEPTH.OBJECTS);
                this.coins.add(coin);
            }
        } else {
            const isFly = Math.random() > 0.7;
            // 地上敵の場合、地面があるときのみ生成
            if (!isFly && !hasGroundAtSpawn) return;

            const y = isFly ? groundY - 180 : groundY - 100;
            const enemy = new Enemy(this, x, y, isFly ? 'fly' : 'land');
            enemy.setDepth(GameConfig.DEPTH.OBJECTS);
            this.enemies.add(enemy);
        }
    }

    private collectCoin(player: any, coin: any) {
        if (coin.body) coin.body.enable = false; // 物理判定を即座に無効化
        this.coinEmitter.explode(10, coin.x + 25, coin.y + 25);
        coin.destroy();
        SoundGenerator.playCoin();
        this.distance += 1000;
        this.coinsCollected++; // 統計加算
        this.updateScoreUI(true);
        if (!this.isFever) {
            this.feverGauge += GameConfig.FEVER.COIN_REWARD;
            if (this.feverGauge >= GameConfig.FEVER.THRESHOLD) this.startFever();
        }
    }

    private startFever() {
        this.isFever = true;
        this.feverTimer = GameConfig.FEVER.DURATION;
        this.player.setFeverMode(true);
        SoundGenerator.playFever();
    }

    private hitEnemy(player: any, enemy: any) {
        if (this.isFever) {
            // 敵撃破時のバラバラ演出
            this.enemyDebrisEmitter.explode(12, enemy.x + 50, enemy.y + 50);
            enemy.destroy();
            this.enemiesDefeated++; // 統計加算
            this.cameras.main.shake(100, 0.01);
            SoundGenerator.playCoin();
        } else {
            SoundGenerator.playHit();
            this.handleGameOver();
        }
    }

    private handleGameOver() {
        this.isGameOver = true;
        this.physics.pause();
        this.showGameOver();
    }

    private async showGameOver() {
        const gameOverScreen = document.getElementById('gameover-screen');
        const finalScoreUI = document.getElementById('finalScore');
        const resultImage = document.getElementById('resultImage');
        
        // 統計表示用のHTML要素
        const resultDistanceUI = document.getElementById('resultDistance');
        const resultCoinsUI = document.getElementById('resultCoins');
        const resultEnemiesUI = document.getElementById('resultEnemies');

        if (finalScoreUI) finalScoreUI.innerText = this.score.toString();
        
        // 統計反映
        if (resultDistanceUI) resultDistanceUI.innerText = Math.floor(this.distance / 100).toString();
        if (resultCoinsUI) resultCoinsUI.innerText = this.coinsCollected.toString();
        if (resultEnemiesUI) resultEnemiesUI.innerText = this.enemiesDefeated.toString();

        // 累計コインの保存（コレクション用）
        const totalCoins = parseInt(localStorage.getItem('pomRunnerTotalCoins') || '0');
        localStorage.setItem('pomRunnerTotalCoins', (totalCoins + this.coinsCollected).toString());

            if (resultImage) {
            const bestScore = parseInt(localStorage.getItem('pomRunnerBestScore') || '0');
            const isNewBest = this.score > bestScore;
            (resultImage as HTMLImageElement).src = isNewBest ? 'assets/image/ui/purin_update_best.png' : 'assets/image/ui/purin_gameover.png';
            if (isNewBest) {
                // 自己ベスト更新時にクラッカー音を鳴らす（AudioContext を確実に resume してから）
                try { await SoundGenerator.ensureAudioStarted(); } catch (e) { /* ignore */ }
                try { SoundGenerator.playCracker(); } catch (e) { /* 念のため例外は無視 */ }
                localStorage.setItem('pomRunnerBestScore', this.score.toString());
            }
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
