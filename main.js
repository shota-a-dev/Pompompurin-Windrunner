/**
 * Pom Runner - Main Game Script
 * Version: v0.2.0
 * ステップ2: 2段ジャンプ、パララックス背景、速度上昇の実装
 */

class PomRunner {
  constructor() {
    this.config = {
      baseHeight: 720,
      version: 'v0.2.0',
      playerImagePath: 'assets/image/player.png',
      // 背景アセットの定義
      assets: {
        bgBack: 'assets/image/bg_back.png',
        bgMid: 'assets/image/bg_mid.png',
        bgFront: 'assets/image/bg_front.png',
        ground: 'assets/image/ground.png',
      },
      // 物理定数
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

    // プレイヤーオブジェクト
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

    // 背景レイヤーの状態（x座標と速度倍率）
    this.layers = [
      {
        id: 'bgBack',
        x: 0,
        speedFactor: 0.1,
        color: '#87CEEB',
        img: new Image(),
      },
      {
        id: 'bgMid',
        x: 0,
        speedFactor: 0.3,
        color: '#4FC3F7',
        img: new Image(),
      },
      {
        id: 'bgFront',
        x: 0,
        speedFactor: 0.6,
        color: '#29B6F6',
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
    // プレイヤー画像の読み込み
    this.playerImage.src = this.config.playerImagePath;
    this.playerImage.onload = () => (this.isPlayerLoaded = true);

    // 背景画像の読み込み
    this.layers.forEach((layer) => {
      layer.img.src = this.config.assets[layer.id];
    });

    this.updateViewportVariable();
    window.addEventListener('resize', () => {
      this.updateViewportVariable();
      this.handleResize();
    });

    this.handleResize();

    // 初期状態の設定
    this.state.gameSpeed = this.config.initialGameSpeed;
    this.player.groundY = this.config.baseHeight - 100;
    this.player.y = this.player.groundY - this.player.height;

    const startBtn = document.getElementById('start-button');
    startBtn.addEventListener('click', (e) => this.startGame(e));

    // ジャンプ操作（画面全体へのクリック/タッチ）
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
    if (e) e.stopPropagation(); // 重複入力を防止

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

  /**
   * 入力処理：ジャンプの実行
   */
  handleInput(e) {
    if (this.state.isPaused || !this.state.gameStarted) return;

    // 2段ジャンプ判定
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
   * ゲームロジックの更新
   */
  update() {
    if (this.state.isPaused || !this.state.gameStarted) return;

    // 速度の上昇
    this.state.gameSpeed += this.config.speedIncrement;

    // プレイヤーの物理演算
    this.player.vy += this.config.gravity;
    this.player.y += this.player.vy;

    // 着地判定
    const footY = this.player.y + this.player.height;
    if (footY >= this.player.groundY) {
      this.player.y = this.player.groundY - this.player.height;
      this.player.vy = 0;
      this.player.jumpCount = 0;
    }

    // 背景のスクロール更新
    this.layers.forEach((layer) => {
      layer.x -= this.state.gameSpeed * layer.speedFactor;
      // ループ処理（画像が読み込まれている場合は画像幅、そうでない場合はキャンバス幅でループ）
      const resetThreshold =
        layer.img.complete && layer.img.width > 0
          ? layer.img.width
          : this.state.screenWidth;
      if (layer.x <= -resetThreshold) {
        layer.x += resetThreshold;
      }
    });
  }

  /**
   * 描画処理
   */
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. 背景レイヤーの描画（遠い順）
    this.layers.forEach((layer) => {
      this.drawParallaxLayer(layer);
    });

    // 2. プレイヤーの描画
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
        // フォールバック表示（ポムポムプリン色の矩形）
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
   * パララックスレイヤーをシームレスに描画する
   */
  drawParallaxLayer(layer) {
    const img = layer.img;
    const isGround = layer.id === 'ground';
    const drawY = isGround ? this.player.groundY : 0;
    const drawHeight = isGround ? 100 : this.canvas.height;

    if (img.complete && img.width > 0) {
      // 画像を2枚並べてループ描画
      this.ctx.drawImage(img, layer.x, drawY, img.width, drawHeight);
      this.ctx.drawImage(
        img,
        layer.x + img.width,
        drawY,
        img.width,
        drawHeight,
      );

      // 画面幅が広い場合に備え、さらにもう1枚（安全策）
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
      // フォールバック描画
      this.ctx.fillStyle = layer.color;
      this.ctx.fillRect(0, drawY, this.canvas.width, drawHeight);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PomRunner();
});
