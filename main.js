/**
 * Pom Runner - Main Game Script
 * Version: v0.2.1
 * 修正内容: 画像未読込時でも進んでいることがわかる「デバッグパターン描画」の実装
 */

class PomRunner {
  constructor() {
    this.config = {
      baseHeight: 720,
      version: 'v0.2.1', // バージョン更新
      playerImagePath: 'assets/image/player.png',
      assets: {
        bgBack: 'assets/image/bg_back.png',
        bgMid: 'assets/image/bg_mid.png',
        bgFront: 'assets/image/bg_front.png',
        ground: 'assets/image/ground.png',
      },
      gravity: 0.8,
      jumpPower: -18,
      initialGameSpeed: 8,
      speedIncrement: 0.0005,
    };

    this.state = {
      isPaused: true,
      gameStarted: false,
      screenWidth: 0,
      screenHeight: 0,
      gameSpeed: 0,
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

    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.playerImage = new Image();
    this.isPlayerLoaded = false;

    this.init();
  }

  init() {
    this.playerImage.src = this.config.playerImagePath;
    this.playerImage.onload = () => (this.isPlayerLoaded = true);

    this.layers.forEach((layer) => {
      layer.img.src = this.config.assets[layer.id];
    });

    this.updateViewportVariable();
    window.addEventListener('resize', () => {
      this.updateViewportVariable();
      this.handleResize();
    });

    this.handleResize();

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
    if (e) e.stopPropagation();
    if (!this.state.gameStarted) {
      const doc = document.documentElement;
      try {
        if (doc.requestFullscreen) {
          await doc.requestFullscreen();
        } else if (doc.webkitRequestFullscreen) {
          await doc.webkitRequestFullscreen();
        }
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
    if (this.state.isPaused || !this.state.gameStarted) return;
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
    if (this.state.isPaused || !this.state.gameStarted) return;
    this.state.gameSpeed += this.config.speedIncrement;
    this.player.vy += this.config.gravity;
    this.player.y += this.player.vy;
    const footY = this.player.y + this.player.height;
    if (footY >= this.player.groundY) {
      this.player.y = this.player.groundY - this.player.height;
      this.player.vy = 0;
      this.player.jumpCount = 0;
    }
    this.layers.forEach((layer) => {
      // 基準ループ幅を1280pxに設定（画像がない場合用）
      const loopWidth = 1280;
      layer.x -= this.state.gameSpeed * layer.speedFactor;
      if (layer.x <= -loopWidth) {
        layer.x += loopWidth;
      }
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.layers.forEach((layer) => {
      this.drawParallaxLayer(layer);
    });
    if (this.state.gameStarted) {
      if (this.isPlayerLoaded) {
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
  }

  /**
   * 画像がない場合でも「流れている」ことがわかる模様を描画する改良版
   */
  drawParallaxLayer(layer) {
    const img = layer.img;
    const isGround = layer.id === 'ground';
    const drawY = isGround ? this.player.groundY : 0;
    const drawHeight = isGround ? 100 : this.canvas.height;
    const loopWidth = 1280;

    if (img.complete && img.width > 0) {
      // 画像がある場合の描画
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
      // --- 画像がない場合の「視覚的フィードバック」強化版 ---
      this.ctx.save();

      // レイヤーの基本色で背景を塗る
      this.ctx.fillStyle = layer.color;
      this.ctx.fillRect(0, drawY, this.canvas.width, drawHeight);

      // 進んでいることがわかるように、一定間隔で縦線（または格子）を描画
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 5;

      const patternInterval = 200; // 200pxごとに線を描く
      for (let i = 0; i <= loopWidth / patternInterval + 1; i++) {
        const lineX = layer.x + i * patternInterval;
        this.ctx.beginPath();
        this.ctx.moveTo(lineX, drawY);
        this.ctx.lineTo(lineX, drawY + drawHeight);
        this.ctx.stroke();

        // 地面の場合は、地面っぽく横線も追加
        if (isGround) {
          this.ctx.beginPath();
          this.ctx.moveTo(0, drawY + 10);
          this.ctx.lineTo(this.canvas.width, drawY + 10);
          this.ctx.stroke();
        }
      }
      this.ctx.restore();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PomRunner();
});
