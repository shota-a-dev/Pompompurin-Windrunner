/**
 * Pom Runner - Main Game Script
 * Version: v0.5.0
 * 修正: スプライトアニメーション、パーティクル演出、フィーバーモード、描画順序調整
 */

// --- 演出用パーティクルクラス ---
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 5 + 2;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;
    this.life = 1.0; // 1.0から0まで減少
    this.decay = Math.random() * 0.05 + 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

class PomRunner {
  constructor() {
    this.config = {
      baseHeight: 720,
      version: 'v0.5.0',
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
      feverThreshold: 100, // フィーバー突入に必要なゲージ
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
      feverGauge: 0,
      isFever: false,
      feverTimer: 0,
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
      // アニメーション用
      frame: 0,
      animTimer: 0,
      wasOnGround: true,
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
    this.particles = [];
    this.spawnTimer = 0;

    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.images = {};
    this.init();
  }

  init() {
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

    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', (e) => this.startGame(e));

    const retryBtn = document.getElementById('retry-btn');
    retryBtn.addEventListener('click', () => location.reload());

    window.addEventListener(
      'touchstart',
      (e) => {
        if (e.target.tagName === 'BUTTON') return;
        e.preventDefault();
        this.handleInput();
      },
      { passive: false },
    );

    window.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
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

  // --- 2段ジャンプロジック (v0.4.0を継承) ---
  handleInput() {
    if (this.state.isPaused || !this.state.gameStarted || this.state.isGameOver)
      return;

    if (this.player.jumpCount < this.player.maxJumps) {
      this.player.vy = this.config.jumpPower;
      this.player.jumpCount++;
    }
  }

  createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
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

    // --- フィーバー管理 ---
    if (this.state.isFever) {
      this.state.feverTimer--;
      if (this.state.feverTimer <= 0) {
        this.state.isFever = false;
        this.state.feverGauge = 0;
      }
    }

    const currentSpeed = this.state.isFever
      ? this.state.gameSpeed * 1.5
      : this.state.gameSpeed;
    this.state.distance += currentSpeed;
    this.state.score =
      Math.floor(this.state.distance / 10) + this.state.coins * 100;
    document.getElementById('currentScore').innerText = this.state.score;
    this.state.gameSpeed += this.config.speedIncrement;

    // --- 物理演算 ---
    this.player.vy += this.config.gravity;
    this.player.y += this.player.vy;

    const isOnGround =
      this.player.y + this.player.height >= this.player.groundY;
    if (isOnGround) {
      this.player.y = this.player.groundY - this.player.height;
      this.player.vy = 0;
      this.player.jumpCount = 0;

      // 着地演出（土煙）
      if (!this.player.wasOnGround) {
        this.createParticles(
          this.player.x + 50,
          this.player.groundY,
          '#D2B48C',
          5,
        );
      }
    }
    this.player.wasOnGround = isOnGround;

    // --- アニメーション制御 ---
    this.player.animTimer++;
    if (isOnGround) {
      if (this.player.animTimer % 6 === 0) {
        this.player.frame = (this.player.frame + 1) % 4;
      }
    } else {
      // ジャンプ中フレーム
      this.player.frame = this.player.vy < 0 ? 2 : 3;
    }

    // --- レイヤーとパーティクルの更新 ---
    this.layers.forEach((layer) => {
      layer.x -= currentSpeed * layer.speedFactor;
      if (layer.x <= -1280) layer.x += 1280;
    });

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) this.particles.splice(i, 1);
    }

    this.spawnTimer++;
    if (this.spawnTimer > this.config.spawnInterval) {
      this.spawnObject();
      this.spawnTimer = 0;
    }
    this.updateObjects(currentSpeed);
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

  updateObjects(currentSpeed) {
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
      obj.x -= currentSpeed;

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
          this.createParticles(obj.x + 25, obj.y + 25, '#FDE047', 10);

          // フィーバーゲージ加算
          if (!this.state.isFever) {
            this.state.feverGauge += 10;
            if (this.state.feverGauge >= this.config.feverThreshold) {
              this.state.isFever = true;
              this.state.feverTimer = 300; // 約5秒
            }
          }
        } else {
          // 敵との衝突（フィーバー中は無敵）
          if (this.state.isFever) {
            obj.collected = true;
            this.createParticles(obj.x + 40, obj.y + 40, '#FF4500', 12);
          } else {
            this.gameOver();
          }
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

    // 1. 背景レイヤー (Frontまで)
    for (let i = 0; i < 3; i++) {
      this.drawParallaxLayer(this.layers[i]);
    }

    // フィーバー時の背景エフェクト
    if (this.state.isFever) {
      this.ctx.fillStyle = 'rgba(255, 224, 71, 0.1)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 2. パーティクル
    this.particles.forEach((p) => p.draw(this.ctx));

    // 3. プレイヤー (スプライト対応)
    if (this.images.player) {
      const img = this.playerImage;
      // スプライトシート（横に4枚並んでいると仮定）かどうかの判定
      const isSprite = img.width >= this.player.width * 4;
      if (isSprite) {
        const sw = img.width / 4;
        const sh = img.height;
        this.ctx.drawImage(
          img,
          this.player.frame * sw,
          0,
          sw,
          sh,
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height,
        );
      } else {
        this.ctx.drawImage(
          img,
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height,
        );
      }
      // フィーバー中のオーラ
      if (this.state.isFever) {
        this.ctx.strokeStyle = '#FDE047';
        this.ctx.lineWidth = 5;
        this.ctx.strokeRect(
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height,
        );
      }
    } else {
      this.ctx.fillStyle = this.state.isFever ? '#FF4500' : '#FDE047';
      this.ctx.fillRect(
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.height,
      );
    }

    // 4. 地面 (プレイヤーより手前に描画し、足元が少し重なるようにする)
    this.drawParallaxLayer(this.layers[3]);

    // 5. オブジェクト (コイン・敵)
    this.drawObjects();
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
    const drawHeight = isGround ? 110 : this.canvas.height; // 地面を少し高くして重なりを強調
    if (img.complete && img.width > 0) {
      const loopWidth = img.width;
      this.ctx.drawImage(img, layer.x, drawY, loopWidth, drawHeight);
      this.ctx.drawImage(
        img,
        layer.x + loopWidth,
        drawY,
        loopWidth,
        drawHeight,
      );
      if (layer.x + loopWidth < this.canvas.width) {
        this.ctx.drawImage(
          img,
          layer.x + loopWidth * 2,
          drawY,
          loopWidth,
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
