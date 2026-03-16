/**
 * Pom Runner - Main Game Script
 * Version: v0.3.0
 * ステップ3: スポナー、当たり判定、スコアシステムの実装
 */

class PomRunner {
  constructor() {
    this.config = {
      baseHeight: 720,
      version: 'v0.3.0',
      playerImagePath: 'assets/image/player.png',
      assets: {
        bgBack: 'assets/image/bg_back.png',
        bgMid: 'assets/image/bg_mid.png',
        bgFront: 'assets/image/bg_front.png',
        ground: 'assets/image/ground.png',
        coin: 'assets/image/coin.png',
        enemy: 'assets/image/enemy_land.png',
      },
      gravity: 0.8,
      jumpPower: -18,
      initialGameSpeed: 8,
      speedIncrement: 0.0005,
      spawnInterval: 100, // 生成の間隔（フレーム数）
    };

    this.state = {
      isPaused: true,
      gameStarted: false,
      isGameOver: false,
      screenWidth: 0,
      screenHeight: 0,
      gameSpeed: 0,
      distance: 0,
      score: 0,
      coins: 0,
    };

    this.player = {
      x: 150,
      y: 0,
      width: 100,
      height: 100,
      vy: 0,
      jumpCount: 0,
      maxJumps: 2,
      groundY: 0,
    };

    // 背景レイヤー
    this.layers = [
      {
        id: 'bgBack',
        x: 0,
        speedFactor: 0.1,
        color: '#4A90E2',
        img: new Image(),
      },
      {
        id: 'bgMid',
        x: 0,
        speedFactor: 0.3,
        color: '#63A4FF',
        img: new Image(),
      },
      {
        id: 'bgFront',
        x: 0,
        speedFactor: 0.6,
        color: '#83B9FF',
        img: new Image(),
      },
      {
        id: 'ground',
        x: 0,
        speedFactor: 1.0,
        color: '#8B4513',
        img: new Image(),
      },
    ];

    // ゲームオブジェクト管理（コイン・敵）
    this.gameObjects = [];
    this.spawnTimer = 0;

    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // アセット読み込み管理
    this.images = {};
    this.loadedImagesCount = 0;

    this.init();
  }

  init() {
    // 全アセットの一括読み込み
    this.playerImage = new Image();
    this.playerImage.src = this.config.playerImagePath;
    this.playerImage.onload = () => {
      this.images.player = true;
    };

    this.layers.forEach((layer) => {
      layer.img.src = this.config.assets[layer.id];
    });

    this.coinImg = new Image();
    this.coinImg.src = this.config.assets.coin;
    this.enemyImg = new Image();
    this.enemyImg.src = this.config.assets.enemy;

    this.updateViewportVariable();
    window.addEventListener('resize', () => {
      this.updateViewportVariable();
      this.handleResize();
    });

    this.handleResize();

    // 初期数値設定
    this.state.gameSpeed = this.config.initialGameSpeed;
    this.player.groundY = this.config.baseHeight - 100;
    this.player.y = this.player.groundY - this.player.height;

    const startBtn = document.getElementById('start-button');
    startBtn.addEventListener('click', (e) => this.startGame(e));

    window.addEventListener('touchstart', (e) => this.handleInput(e), {
      passive: false,
    });
    window.addEventListener('mousedown', (e) => this.handleInput(e));

    this.gameLoop();
  }

  updateViewportVariable() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  handleResize() {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';
    const scale = displayHeight / this.config.baseHeight;
    this.canvas.height = this.config.baseHeight;
    this.canvas.width = displayWidth / scale;
    this.state.screenWidth = this.canvas.width;
    this.state.screenHeight = this.canvas.height;
  }

  async startGame(e) {
    if (e) e.preventDefault();
    if (this.state.isGameOver) {
      location.reload(); // ゲームオーバー時はリロード
      return;
    }
    if (!this.state.gameStarted) {
      const doc = document.documentElement;
      try {
        if (doc.requestFullscreen) await doc.requestFullscreen();
        else if (doc.webkitRequestFullscreen)
          await doc.webkitRequestFullscreen();
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (err) {
        console.warn('Fullscreen error:', err);
      }

      setTimeout(() => {
        this.handleResize();
        document.getElementById('ui-start-screen').style.display = 'none';
        this.state.gameStarted = true;
        this.state.isPaused = false;
      }, 300);
    }
  }

  handleInput(e) {
    if (this.state.isPaused || !this.state.gameStarted || this.state.isGameOver)
      return;
    if (this.player.jumpCount < this.player.maxJumps) {
      this.player.vy = this.config.jumpPower;
      this.player.jumpCount++;
    }
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * 更新ロジック
   */
  update() {
    if (this.state.isPaused || !this.state.gameStarted || this.state.isGameOver)
      return;

    // スコア計算
    this.state.distance += this.state.gameSpeed;
    this.state.score =
      Math.floor(this.state.distance / 10) + this.state.coins * 100;

    // 速度上昇
    this.state.gameSpeed += this.config.speedIncrement;

    // プレイヤー物理
    this.player.vy += this.config.gravity;
    this.player.y += this.player.vy;
    if (this.player.y + this.player.height >= this.player.groundY) {
      this.player.y = this.player.groundY - this.player.height;
      this.player.vy = 0;
      this.player.jumpCount = 0;
    }

    // 背景スクロール
    this.layers.forEach((layer) => {
      layer.x -= this.state.gameSpeed * layer.speedFactor;
      if (layer.x <= -1280) layer.x += 1280;
    });

    // オブジェクト生成（スポナー）
    this.spawnTimer++;
    if (this.spawnTimer > this.config.spawnInterval) {
      this.spawnObject();
      this.spawnTimer = 0;
    }

    // オブジェクト更新と当たり判定
    this.updateObjects();
  }

  spawnObject() {
    const type = Math.random() > 0.4 ? 'coin' : 'enemy';
    const obj = {
      type: type,
      x: this.state.screenWidth + 100,
      y:
        type === 'enemy'
          ? this.player.groundY - 80
          : this.player.groundY - 150 - Math.random() * 200,
      width: type === 'enemy' ? 80 : 50,
      height: type === 'enemy' ? 80 : 50,
      collected: false,
    };
    this.gameObjects.push(obj);
  }

  updateObjects() {
    // プレイヤーの当たり判定（シニアエンジニアの配慮：見た目より少し小さく設定）
    const pPaddingX = 15;
    const pPaddingY = 10;
    const pHitbox = {
      x: this.player.x + pPaddingX,
      y: this.player.y + pPaddingY,
      w: this.player.width - pPaddingX * 2,
      h: this.player.height - pPaddingY * 2,
    };

    for (let i = this.gameObjects.length - 1; i >= 0; i--) {
      const obj = this.gameObjects[i];
      obj.x -= this.state.gameSpeed;

      // 当たり判定チェック
      if (
        !obj.collected &&
        pHitbox.x < obj.x + obj.width &&
        pHitbox.x + pHitbox.w > obj.x &&
        pHitbox.y < obj.y + obj.height &&
        pHitbox.y + pHitbox.h > obj.y
      ) {
        if (obj.type === 'coin') {
          obj.collected = true;
          this.state.coins++;
        } else if (obj.type === 'enemy') {
          this.gameOver();
        }
      }

      // 画面外に出たオブジェクトを削除（メモリ管理）
      if (obj.x + obj.width < -100 || obj.collected) {
        this.gameObjects.splice(i, 1);
      }
    }
  }

  gameOver() {
    this.state.isGameOver = true;
    this.state.isPaused = true;
    // 画面を赤くフラッシュさせる演出
    document.getElementById('game-container').classList.add('game-over-active');
  }

  /**
   * 描画ロジック
   */
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. 背景
    this.layers.forEach((layer) => this.drawParallaxLayer(layer));

    // 2. オブジェクト（コイン・敵）
    this.drawObjects();

    // 3. プレイヤー
    if (this.state.gameStarted) {
      if (this.images.player) {
        this.ctx.drawImage(
          this.playerImage,
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height,
        );
      } else {
        this.ctx.fillStyle = '#FFECB3';
        this.ctx.fillRect(
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height,
        );
      }
    }

    // 4. UI（スコア・ゲームオーバー表示）
    this.drawUI();
  }

  drawObjects() {
    this.gameObjects.forEach((obj) => {
      if (obj.type === 'coin') {
        if (this.coinImg.complete && this.coinImg.width > 0) {
          this.ctx.drawImage(this.coinImg, obj.x, obj.y, obj.width, obj.height);
        } else {
          this.ctx.fillStyle = '#FFD700'; // 黄色い円
          this.ctx.beginPath();
          this.ctx.arc(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            obj.width / 2,
            0,
            Math.PI * 2,
          );
          this.ctx.fill();
        }
      } else {
        if (this.enemyImg.complete && this.enemyImg.width > 0) {
          this.ctx.drawImage(
            this.enemyImg,
            obj.x,
            obj.y,
            obj.width,
            obj.height,
          );
        } else {
          this.ctx.fillStyle = '#FF0000'; // 赤い四角
          this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
      }
    });
  }

  drawUI() {
    this.ctx.save();
    // スコア表示
    this.ctx.fillStyle = 'white';
    this.ctx.shadowColor = 'black';
    this.ctx.shadowBlur = 4;
    this.ctx.font = 'bold 30px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(
      `SCORE: ${this.state.score}`,
      this.state.screenWidth - 20,
      50,
    );
    this.ctx.fillText(
      `COINS: ${this.state.coins}`,
      this.state.screenWidth - 20,
      90,
    );

    // ゲームオーバー表示
    if (this.state.isGameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(0, 0, this.state.screenWidth, this.state.screenHeight);
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 60px Arial';
      this.ctx.fillText(
        'GAME OVER',
        this.state.screenWidth / 2,
        this.state.screenHeight / 2,
      );
      this.ctx.font = '30px Arial';
      this.ctx.fillText(
        'Tap to Restart',
        this.state.screenWidth / 2,
        this.state.screenHeight / 2 + 60,
      );
    }
    this.ctx.restore();
  }

  drawParallaxLayer(layer) {
    const img = layer.img;
    const isGround = layer.id === 'ground';
    const drawY = isGround ? this.player.groundY : 0;
    const drawHeight = isGround ? 100 : this.canvas.height;
    const loopWidth = 1280;

    if (img.complete && img.width > 0) {
      this.ctx.drawImage(img, layer.x, drawY, img.width, drawHeight);
      this.ctx.drawImage(
        img,
        layer.x + img.width,
        drawY,
        img.width,
        drawHeight,
      );
      if (layer.x + img.width < this.canvas.width) {
        this.ctx.drawImage(
          img,
          layer.x + img.width * 2,
          drawY,
          img.width,
          drawHeight,
        );
      }
    } else {
      this.ctx.save();
      this.ctx.fillStyle = layer.color;
      this.ctx.fillRect(0, drawY, this.canvas.width, drawHeight);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 5;
      for (let i = 0; i <= loopWidth / 200 + 1; i++) {
        const lineX = layer.x + i * 200;
        this.ctx.beginPath();
        this.ctx.moveTo(lineX, drawY);
        this.ctx.lineTo(lineX, drawY + drawHeight);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PomRunner();
});
