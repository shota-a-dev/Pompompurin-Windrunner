/**
 * Pom Runner - Main Game Script
 * Version: v0.4.0
 * 修正: 2段階ジャンプ不具合修正、リトライ機能修正、UI統合
 */

class PomRunner {
  constructor() {
    this.config = {
      baseHeight: 720,
      version: 'v0.4.0',
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
      spawnInterval: 100,
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

    this.gameObjects = [];
    this.spawnTimer = 0;

    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.images = {};
    this.init();
  }

  init() {
    // 画像ロード
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

    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();

    // UIイベント設定
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', (e) => this.startGame(e));

    const retryBtn = document.getElementById('retry-btn');
    retryBtn.addEventListener('click', () => location.reload());

    // 2段階ジャンプ不具合修正: イベントを窓口1つに絞り、stopPropagationで制御
    window.addEventListener(
      'touchstart',
      (e) => {
        if (e.target.tagName === 'BUTTON') return; // ボタン操作を優先
        e.preventDefault();
        this.handleInput();
      },
      { passive: false },
    );

    window.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      // touchstartが動く環境ではmousedownを無視して重複防止
      if ('ontouchstart' in window) return;
      this.handleInput();
    });

    this.state.gameSpeed = this.config.initialGameSpeed;
    this.player.groundY = this.config.baseHeight - 100;
    this.player.y = this.player.groundY - this.player.height;

    this.gameLoop();
  }

  handleResize() {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    const scale = displayHeight / this.config.baseHeight;
    this.canvas.height = this.config.baseHeight;
    this.canvas.width = displayWidth / scale;
    this.state.screenWidth = this.canvas.width;
    this.state.screenHeight = this.canvas.height;
  }

  async startGame(e) {
    if (e) e.preventDefault();
    if (this.state.gameStarted) return;

    const doc = document.documentElement;
    try {
      if (doc.requestFullscreen) await doc.requestFullscreen();
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (err) {}

    document.getElementById('start-screen').classList.add('hidden');
    this.state.gameStarted = true;
    this.state.isPaused = false;
    this.handleResize();
  }

  handleInput() {
    if (this.state.isPaused || !this.state.gameStarted || this.state.isGameOver)
      return;

    // ジャンプ判定
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

  update() {
    if (this.state.isPaused || !this.state.gameStarted || this.state.isGameOver)
      return;

    this.state.distance += this.state.gameSpeed;
    this.state.score =
      Math.floor(this.state.distance / 10) + this.state.coins * 100;

    // UIスコアの更新
    document.getElementById('currentScore').innerText = this.state.score;

    this.state.gameSpeed += this.config.speedIncrement;
    this.player.vy += this.config.gravity;
    this.player.y += this.player.vy;

    if (this.player.y + this.player.height >= this.player.groundY) {
      this.player.y = this.player.groundY - this.player.height;
      this.player.vy = 0;
      this.player.jumpCount = 0;
    }

    this.layers.forEach((layer) => {
      layer.x -= this.state.gameSpeed * layer.speedFactor;
      if (layer.x <= -1280) layer.x += 1280;
    });

    this.spawnTimer++;
    if (this.spawnTimer > this.config.spawnInterval) {
      this.spawnObject();
      this.spawnTimer = 0;
    }

    this.updateObjects();
  }

  spawnObject() {
    const type = Math.random() > 0.4 ? 'coin' : 'enemy';
    this.gameObjects.push({
      type: type,
      x: this.state.screenWidth + 100,
      y:
        type === 'enemy'
          ? this.player.groundY - 80
          : this.player.groundY - 150 - Math.random() * 200,
      width: type === 'enemy' ? 80 : 50,
      height: type === 'enemy' ? 80 : 50,
      collected: false,
    });
  }

  updateObjects() {
    const pPaddingX = 20;
    const pPaddingY = 15;
    const pHitbox = {
      x: this.player.x + pPaddingX,
      y: this.player.y + pPaddingY,
      w: this.player.width - pPaddingX * 2,
      h: this.player.height - pPaddingY * 2,
    };

    for (let i = this.gameObjects.length - 1; i >= 0; i--) {
      const obj = this.gameObjects[i];
      obj.x -= this.state.gameSpeed;

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
        } else {
          this.gameOver();
        }
      }
      if (obj.x + obj.width < -100 || obj.collected)
        this.gameObjects.splice(i, 1);
    }
  }

  gameOver() {
    this.state.isGameOver = true;
    this.state.isPaused = true;
    document.getElementById('finalScore').innerText = this.state.score;
    const goScreen = document.getElementById('gameover-screen');
    goScreen.classList.remove('hidden');
    setTimeout(() => goScreen.classList.add('opacity-100'), 10);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.layers.forEach((layer) => this.drawParallaxLayer(layer));
    this.drawObjects();
    if (this.images.player) {
      this.ctx.drawImage(
        this.playerImage,
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.height,
      );
    } else {
      this.ctx.fillStyle = '#FDE047';
      this.ctx.fillRect(
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.height,
      );
    }
  }

  drawObjects() {
    this.gameObjects.forEach((obj) => {
      const img = obj.type === 'coin' ? this.coinImg : this.enemyImg;
      if (img.complete && img.width > 0) {
        this.ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
      } else {
        this.ctx.fillStyle = obj.type === 'coin' ? '#FDE047' : '#FF0000';
        this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      }
    });
  }

  drawParallaxLayer(layer) {
    const img = layer.img;
    const isGround = layer.id === 'ground';
    const drawY = isGround ? this.player.groundY : 0;
    const drawHeight = isGround ? 100 : this.canvas.height;
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
      this.ctx.fillStyle = layer.color;
      this.ctx.fillRect(0, drawY, this.canvas.width, drawHeight);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => new PomRunner());
