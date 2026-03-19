/**
 * Pom Runner - Main Game Script
 * Version: v0.9.0
 * 修正: 画像ロード待ち、キャラサイズ拡大、コイン連続配置、敵画像の使い分け
 * 追加: BGM/SE追加、背景ループの修正、ベストスコア保存、リザルト画像の出し分け
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

class PomRunner {
  constructor() {
    this.config = {
      baseHeight: 720,
      version: 'v0.1.0',
      playerImagePath: 'assets/image/player.png',
      assets: {
        bgBack: 'assets/image/bg_back.png',
        bgMid: 'assets/image/bg_mid.png',
        bgFront: 'assets/image/bg_front.png',
        ground: 'assets/image/ground.png',
        coin: 'assets/image/coin.png',
        enemy: 'assets/image/enemy_land.png',
        enemyFly: 'assets/image/enemy_fly.png',
        purinBest: 'assets/image/purin_update_best.png', // 追加: ベスト更新画像
        purinGameOver: 'assets/image/purin_gameover.png', // 追加: ゲームオーバー画像
      },
      // 追加: 音声ファイルのパス設定
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

    this.player = {
      x: 150,
      y: 0,
      width: 120,
      height: 120,
      vy: 0,
      jumpCount: 0,
      maxJumps: 2,
      groundY: 0,
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
    this.audio = {}; // 追加: 音声オブジェクト格納用

    // 追加: ローカルストレージから自己ベストを取得
    this.bestScore = parseInt(localStorage.getItem('pomRunnerBestScore')) || 0;

    this.init();
  }

  async init() {
    // 自己ベストをスタート画面に反映
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

    // --- 音声の初期化 ---
    for (const [key, path] of Object.entries(this.config.sounds)) {
      this.audio[key] = new Audio(path);
      if (key === 'bgm') {
        this.audio[key].loop = true;
        this.audio[key].volume = 0.5; // BGMの音量は少し下げる
      }
    }

    // --- 画像のロードをPromiseで待機 ---
    const loadPromises = [];

    const loadImage = (imgObj, src) => {
      return new Promise((resolve) => {
        imgObj.src = src;
        imgObj.onload = () => resolve();
        imgObj.onerror = () => resolve(); // エラーが起きても進行を止めない
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

    // 結果画面用の画像もラグ防止のためプリロードしておく
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

    // 追加: BGMの再生を開始
    if (this.audio.bgm) {
      this.audio.bgm.currentTime = 0;
      this.audio.bgm
        .play()
        .catch((err) => console.log('Audio autoplay prevented'));
    }

    document.getElementById('start-screen').classList.add('hidden');
    this.state.gameStarted = true;
    this.state.isPaused = false;
    this.handleResize();
  }

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
    const scoreUI = document.getElementById('currentScore');
    if (scoreUI) scoreUI.innerText = this.state.score;
    this.state.gameSpeed += this.config.speedIncrement;

    this.player.vy += this.config.gravity;
    this.player.y += this.player.vy;

    const isOnGround =
      this.player.y + this.player.height >= this.player.groundY;
    if (isOnGround) {
      this.player.y = this.player.groundY - this.player.height;
      this.player.vy = 0;
      this.player.jumpCount = 0;
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

    this.player.animTimer++;
    if (isOnGround) {
      if (this.player.animTimer % 6 === 0) {
        this.player.frame = (this.player.frame + 1) % 4;
      }
    } else {
      this.player.frame = this.player.vy < 0 ? 2 : 3;
    }

    this.layers.forEach((layer) => {
      layer.x -= currentSpeed * layer.speedFactor;
      // 修正: プレイ中も背景が途切れないよう、固定値ではなく画像の幅に合わせてループさせる
      const loopWidth =
        layer.img && layer.img.width > 0 ? layer.img.width : 1280;
      if (layer.x <= -loopWidth) layer.x += loopWidth;
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
    const isEnemy = Math.random() < 0.3;

    if (isEnemy) {
      const isFlying = Math.random() > 0.7;
      this.gameObjects.push({
        type: 'enemy',
        subtype: isFlying ? 'flying' : 'normal',
        x: this.state.screenWidth + 100,
        y: isFlying ? this.player.groundY - 180 : this.player.groundY - 100,
        width: 100,
        height: 100,
        angle: 0,
        baseY: 0,
        collected: false,
      });
    } else {
      const coinCount = Math.floor(Math.random() * 3) + 3;
      const baseX = this.state.screenWidth + 100;
      const baseY = this.player.groundY - 150 - Math.random() * 200;

      for (let i = 0; i < coinCount; i++) {
        const offsetY = Math.sin(i * 0.5) * 30;
        this.gameObjects.push({
          type: 'coin',
          subtype: 'normal',
          x: baseX + i * 60,
          y: baseY + offsetY,
          width: 55,
          height: 55,
          angle: i * 0.5,
          baseY: baseY + offsetY,
          collected: false,
        });
      }
    }
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

      if (obj.type === 'coin') {
        obj.angle += 0.1;
        obj.y = obj.baseY + Math.sin(obj.angle) * 10;
      }

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

          // 追加: コイン取得音の再生
          if (this.audio.coin) {
            this.audio.coin.currentTime = 0;
            this.audio.coin.play().catch(() => {});
          }

          if (!this.state.isFever) {
            this.state.feverGauge += 10;
            if (this.state.feverGauge >= this.config.feverThreshold) {
              this.state.isFever = true;
              this.state.feverTimer = 300;
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
      if (obj.x + obj.width < -100 || obj.collected)
        this.gameObjects.splice(i, 1);
    }
  }

  gameOver() {
    this.state.isGameOver = true;
    this.state.isPaused = true;

    // 追加: BGM停止
    if (this.audio.bgm) this.audio.bgm.pause();

    // 追加: 自己ベストの判定と保存
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

    // 追加: 画像とテキストの出し分け
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

    for (let i = 0; i < 3; i++) {
      this.drawParallaxLayer(this.layers[i]);
    }

    if (this.state.isFever) {
      this.ctx.fillStyle = 'rgba(255, 224, 71, 0.15)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.particles.forEach((p) => p.draw(this.ctx));

    if (this.images.player) {
      const img = this.playerImage;
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
      if (this.state.isFever) {
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#FDE047';
        this.ctx.strokeStyle = '#FDE047';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height,
        );
        this.ctx.shadowBlur = 0;
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

    this.drawParallaxLayer(this.layers[3]);
    this.drawObjects();
  }

  drawObjects() {
    this.gameObjects.forEach((obj) => {
      let img;
      if (obj.type === 'coin') {
        img = this.coinImg;
      } else {
        img = obj.subtype === 'flying' ? this.enemyFlyImg : this.enemyImg;
      }

      if (img && img.complete && img.width > 0) {
        if (obj.type === 'coin') {
          this.ctx.save();
          this.ctx.shadowBlur = 15;
          this.ctx.shadowColor = 'rgba(253, 224, 71, 0.8)';
          this.ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
          this.ctx.restore();
        } else {
          const drawY =
            obj.subtype === 'flying'
              ? obj.y + Math.sin(this.player.animTimer * 0.1) * 10
              : obj.y;
          this.ctx.drawImage(img, obj.x, drawY, obj.width, obj.height);
        }
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
    const drawHeight = isGround ? 110 : this.canvas.height;
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
