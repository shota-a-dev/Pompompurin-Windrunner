/**
 * Pom Runner - Main Game Script
 * Version: v0.9.1 (Updated)
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
    this.life = 1.0;
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

// --- 背景レイヤークラス ---
class BackgroundLayer {
  constructor(id, speedFactor, color, img) {
    this.id = id;
    this.x = 0;
    this.speedFactor = speedFactor;
    this.color = color;
    this.img = img;
  }

  update(speed) {
    this.x -= speed * this.speedFactor;
    const loopWidth = this.img && this.img.width > 0 ? this.img.width : 1280;
    if (this.x <= -loopWidth) this.x += loopWidth;
  }

  draw(ctx, canvasWidth, canvasHeight, groundY) {
    const isGround = this.id === 'ground';
    const drawY = isGround ? groundY : 0;
    const drawHeight = isGround ? 110 : canvasHeight;

    if (this.img.complete && this.img.width > 0) {
      const loopWidth = this.img.width;
      ctx.drawImage(this.img, this.x, drawY, loopWidth, drawHeight);
      ctx.drawImage(this.img, this.x + loopWidth, drawY, loopWidth, drawHeight);
      if (this.x + loopWidth < canvasWidth) {
        ctx.drawImage(
          this.img,
          this.x + loopWidth * 2,
          drawY,
          loopWidth,
          drawHeight,
        );
      }
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(0, drawY, canvasWidth, drawHeight);
    }
  }
}

// --- プレイヤークラス ---
class Player {
  constructor(config) {
    this.x = 150;
    this.y = 0;
    this.width = 140;
    this.height = 140;
    this.vy = 0;
    this.jumpCount = 0;
    this.maxJumps = 2;
    this.groundY = config.baseHeight - 100;
    this.frame = 0;
    this.animTimer = 0;
    this.wasOnGround = true;
    this.config = config;

    // 初期位置の設定
    this.y = this.groundY - this.height;
  }

  jump() {
    if (this.jumpCount < this.maxJumps) {
      this.vy = this.config.jumpPower;
      this.jumpCount++;
    }
  }

  update(createParticles) {
    this.vy += this.config.gravity;
    this.y += this.vy;

    const isOnGround = this.y + this.height >= this.groundY;
    if (isOnGround) {
      this.y = this.groundY - this.height;
      this.vy = 0;
      this.jumpCount = 0;
      if (!this.wasOnGround) {
        // 着地パーティクル
        createParticles(this.x + 50, this.groundY, '#D2B48C', 5);
      }
    }
    this.wasOnGround = isOnGround;

    this.animTimer++;
    if (isOnGround) {
      if (this.animTimer % 6 === 0) {
        this.frame = (this.frame + 1) % 4;
      }
    } else {
      this.frame = this.vy < 0 ? 2 : 3;
    }
  }

  draw(ctx, playerImage, isFever) {
    if (playerImage && playerImage.complete) {
      const isSprite = playerImage.width >= this.width * 4;
      if (isSprite) {
        const sw = playerImage.width / 4;
        const sh = playerImage.height;
        ctx.drawImage(
          playerImage,
          this.frame * sw,
          0,
          sw,
          sh,
          this.x,
          this.y,
          this.width,
          this.height,
        );
      } else {
        ctx.drawImage(playerImage, this.x, this.y, this.width, this.height);
      }

      // フィーバー時の演出：キラキラ光る虹色のオーラ
      if (isFever) {
        ctx.save();
        const hue = (Date.now() / 5) % 360; // 時間で色が変化
        ctx.shadowBlur = 30;
        ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.lineWidth = 6;
        // プレイヤーの周囲に輝きを描画
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 20);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      ctx.fillStyle = isFever ? '#FF4500' : '#FDE047';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  getHitbox() {
    const pPaddingX = 20;
    const pPaddingY = 15;
    return {
      x: this.x + pPaddingX,
      y: this.y + pPaddingY,
      w: this.width - pPaddingX * 2,
      h: this.height - pPaddingY * 2,
    };
  }
}

// --- ゲームオブジェクト（基底） ---
class GameObject {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.collected = false;
  }

  update(speed) {
    this.x -= speed;
  }

  isOffscreen() {
    return this.x + this.width < -100;
  }
}

// --- コインクラス ---
class Coin extends GameObject {
  constructor(x, y, width, height, angle) {
    super(x, y, width, height, 'coin');
    this.baseY = y;
    this.angle = angle;
  }

  update(speed) {
    super.update(speed);
    this.angle += 0.1;
    this.y = this.baseY + Math.sin(this.angle) * 10;
  }

  draw(ctx, img) {
    if (img && img.complete && img.width > 0) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(253, 224, 71, 0.8)';
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

// --- 敵クラス ---
class Enemy extends GameObject {
  constructor(x, y, width, height, subtype) {
    super(x, y, width, height, 'enemy');
    this.subtype = subtype; // 'normal' or 'flying'
  }

  draw(ctx, imgNormal, imgFly, animTimer) {
    const img = this.subtype === 'flying' ? imgFly : imgNormal;
    if (img && img.complete && img.width > 0) {
      const drawY =
        this.subtype === 'flying'
          ? this.y + Math.sin(animTimer * 0.1) * 10
          : this.y;
      ctx.drawImage(img, this.x, drawY, this.width, this.height);
    } else {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

// --- メインゲームエンジン ---
class PomRunner {
  constructor() {
    this.config = {
      baseHeight: 720,
      version: 'v0.9.1',
      playerImagePath: 'assets/image/player.png',
      assets: {
        bgBack: 'assets/image/bg_back.png',
        bgMid: 'assets/image/bg_mid.png',
        bgFront: 'assets/image/bg_front.png',
        ground: 'assets/image/ground.png',
        coin: 'assets/image/coin.png',
        enemy: 'assets/image/enemy_land.png',
        enemyFly: 'assets/image/enemy_fly.png',
        purinBest: 'assets/image/purin_update_best.png',
        purinGameOver: 'assets/image/purin_gameover.png',
      },
      sounds: {
        bgm: 'assets/audio/bgm.mp3',
        coin: 'assets/audio/coin.mp3',
        gameover: 'assets/audio/gameover.mp3',
        highscore: 'assets/audio/highscore.mp3',
      },
      gravity: 0.8,
      jumpPower: -18,
      initialGameSpeed: 8,
      speedIncrement: 0.0005,
      spawnInterval: 100,
      feverThreshold: 100,
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

    this.player = new Player(this.config);

    this.layers = [
      new BackgroundLayer('bgBack', 0.1, '#4A90E2', new Image()),
      new BackgroundLayer('bgMid', 0.3, '#63A4FF', new Image()),
      new BackgroundLayer('bgFront', 0.6, '#83B9FF', new Image()),
      new BackgroundLayer('ground', 1.0, '#8B4513', new Image()),
    ];

    this.gameObjects = [];
    this.particles = [];
    this.spawnTimer = 0;

    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.images = {};
    this.audio = {};
    this.bestScore = parseInt(localStorage.getItem('pomRunnerBestScore')) || 0;

    this.init();
  }

  async init() {
    const startBestUI = document.getElementById('startBestScore');
    if (startBestUI) startBestUI.innerText = this.bestScore;

    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
      const verTag = document.createElement('div');
      verTag.innerText = this.config.version;
      verTag.style.position = 'absolute';
      verTag.style.top = '20px';
      verTag.style.right = '20px';
      verTag.style.fontSize = '18px';
      verTag.style.fontWeight = '900';
      verTag.style.color = '#5E3A21';
      verTag.style.opacity = '0.5';
      startScreen.appendChild(verTag);
    }

    for (const [key, path] of Object.entries(this.config.sounds)) {
      this.audio[key] = new Audio(path);
      if (key === 'bgm') {
        this.audio[key].loop = true;
        this.audio[key].volume = 0.5;
      }
    }

    const loadPromises = [];
    const loadImage = (imgObj, src) => {
      return new Promise((resolve) => {
        imgObj.src = src;
        imgObj.onload = () => resolve();
        imgObj.onerror = () => resolve();
      });
    };

    this.playerImage = new Image();
    loadPromises.push(
      loadImage(this.playerImage, this.config.playerImagePath).then(() => {
        this.images.player = true;
      }),
    );

    this.layers.forEach((layer) => {
      loadPromises.push(loadImage(layer.img, this.config.assets[layer.id]));
    });

    this.coinImg = new Image();
    loadPromises.push(loadImage(this.coinImg, this.config.assets.coin));
    this.enemyImg = new Image();
    loadPromises.push(loadImage(this.enemyImg, this.config.assets.enemy));
    this.enemyFlyImg = new Image();
    loadPromises.push(loadImage(this.enemyFlyImg, this.config.assets.enemyFly));

    const imgBest = new Image();
    loadPromises.push(loadImage(imgBest, this.config.assets.purinBest));
    const imgGameOver = new Image();
    loadPromises.push(loadImage(imgGameOver, this.config.assets.purinGameOver));

    await Promise.all(loadPromises);

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
    this.gameLoop();
  }

  handleResize() {
    const displayHeight = window.innerHeight;
    const scale = displayHeight / this.config.baseHeight;
    this.canvas.height = this.config.baseHeight;
    this.canvas.width = window.innerWidth / scale;
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

    // 音響再生の改善: ロードを明示的に行い、再生を試みる
    if (this.audio.bgm) {
      this.audio.bgm.load();
      this.audio.bgm.currentTime = 0;
      this.audio.bgm
        .play()
        .then(() => console.log('BGM started'))
        .catch((err) => console.log('Audio playback failed:', err));
    }

    document.getElementById('start-screen').classList.add('hidden');
    this.state.gameStarted = true;
    this.state.isPaused = false;
    this.handleResize();
  }

  handleInput() {
    if (this.state.isPaused || !this.state.gameStarted || this.state.isGameOver)
      return;
    this.player.jump();
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

    if (this.state.isFever) {
      this.state.feverTimer--;
      // 無敵中：キラキラのパーティクルを常に発生させる
      if (this.player.animTimer % 3 === 0) {
        const hue = (Date.now() / 2) % 360;
        this.createParticles(
          this.player.x + Math.random() * this.player.width,
          this.player.y + Math.random() * this.player.height,
          `hsl(${hue}, 100%, 75%)`,
          2,
        );
      }
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

    const scoreUI = document.getElementById('currentScore');
    if (scoreUI) scoreUI.innerText = this.state.score;
    this.state.gameSpeed += this.config.speedIncrement;

    // プレイヤー更新
    this.player.update((x, y, color, count) =>
      this.createParticles(x, y, color, count),
    );

    // 背景更新
    this.layers.forEach((layer) => layer.update(currentSpeed));

    // パーティクル更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) this.particles.splice(i, 1);
    }

    // オブジェクト生成
    this.spawnTimer++;
    if (this.spawnTimer > this.config.spawnInterval) {
      this.spawnObject();
      this.spawnTimer = 0;
    }
    this.updateObjects(currentSpeed);
  }

  spawnObject() {
    const isEnemy = Math.random() < 0.3;

    if (isEnemy) {
      const isFlying = Math.random() > 0.7;
      const subtype = isFlying ? 'flying' : 'normal';
      const y = isFlying
        ? this.player.groundY - 180
        : this.player.groundY - 100;
      this.gameObjects.push(
        new Enemy(this.state.screenWidth + 100, y, 100, 100, subtype),
      );
    } else {
      const coinCount = Math.floor(Math.random() * 3) + 3;
      const baseX = this.state.screenWidth + 100;
      const baseY = this.player.groundY - 150 - Math.random() * 200;

      for (let i = 0; i < coinCount; i++) {
        const offsetY = Math.sin(i * 0.5) * 30;
        this.gameObjects.push(
          new Coin(baseX + i * 60, baseY + offsetY, 55, 55, i * 0.5),
        );
      }
    }
  }

  updateObjects(currentSpeed) {
    const pHitbox = this.player.getHitbox();

    for (let i = this.gameObjects.length - 1; i >= 0; i--) {
      const obj = this.gameObjects[i];
      obj.update(currentSpeed);

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
          this.createParticles(obj.x + 25, obj.y + 25, '#FDE047', 12);

          if (this.audio.coin) {
            this.audio.coin.currentTime = 0;
            this.audio.coin.play().catch(() => {});
          }

          if (!this.state.isFever) {
            this.state.feverGauge += 10;
            if (this.state.feverGauge >= this.config.feverThreshold) {
              this.state.isFever = true;
              this.state.feverTimer = 600; // 時間を300から600に延長
            }
          }
        } else {
          if (this.state.isFever) {
            obj.collected = true;
            this.createParticles(obj.x + 40, obj.y + 40, '#FF4500', 15);
          } else {
            this.gameOver();
          }
        }
      }
      if (obj.isOffscreen() || obj.collected) this.gameObjects.splice(i, 1);
    }
  }

  gameOver() {
    this.state.isGameOver = true;
    this.state.isPaused = true;

    if (this.audio.bgm) this.audio.bgm.pause();

    const isNewBest = this.state.score > this.bestScore;
    if (isNewBest) {
      this.bestScore = this.state.score;
      localStorage.setItem('pomRunnerBestScore', this.bestScore);
      if (this.audio.highscore) {
        this.audio.highscore.currentTime = 0;
        this.audio.highscore.play().catch(() => {});
      }
    } else {
      if (this.audio.gameover) {
        this.audio.gameover.currentTime = 0;
        this.audio.gameover.play().catch(() => {});
      }
    }

    const finalScoreUI = document.getElementById('finalScore');
    if (finalScoreUI) finalScoreUI.innerText = this.state.score;

    const resultImage = document.getElementById('resultImage');
    const resultTitle = document.getElementById('resultTitle');

    if (resultImage) {
      resultImage.src = isNewBest
        ? this.config.assets.purinBest
        : this.config.assets.purinGameOver;
      resultImage.classList.remove('hidden');
    }
    if (resultTitle) {
      resultTitle.innerText = isNewBest ? 'NEW RECORD!' : 'GAME OVER';
      resultTitle.className = isNewBest
        ? 'text-3xl font-black mb-4 text-orange-500'
        : 'text-3xl font-black mb-4 text-red-500';
    }

    const goScreen = document.getElementById('gameover-screen');
    if (goScreen) {
      goScreen.classList.remove('hidden');
      setTimeout(() => goScreen.classList.add('opacity-100'), 10);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 背景（奥3層）
    for (let i = 0; i < 3; i++) {
      this.layers[i].draw(
        this.ctx,
        this.canvas.width,
        this.canvas.height,
        this.player.groundY,
      );
    }

    if (this.state.isFever) {
      this.ctx.fillStyle = 'rgba(255, 224, 71, 0.15)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.particles.forEach((p) => p.draw(this.ctx));

    // プレイヤー
    this.player.draw(this.ctx, this.playerImage, this.state.isFever);

    // 背景（手前：地面）
    this.layers[3].draw(
      this.ctx,
      this.canvas.width,
      this.canvas.height,
      this.player.groundY,
    );

    // オブジェクト
    this.drawObjects();
  }

  drawObjects() {
    this.gameObjects.forEach((obj) => {
      if (obj.type === 'coin') {
        obj.draw(this.ctx, this.coinImg);
      } else if (obj.type === 'enemy') {
        obj.draw(
          this.ctx,
          this.enemyImg,
          this.enemyFlyImg,
          this.player.animTimer,
        );
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => new PomRunner());
