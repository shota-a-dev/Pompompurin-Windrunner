class PomRunner {
  constructor() {
    this.config = {
      baseWidth: 1280,
      baseHeight: 720,
      version: 'v0.1.0',
      playerImagePath: 'assets/image/player.png',
    };

    this.state = {
      isPaused: true,
      gameStarted: false,
    };

    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.playerImage = new Image();
    this.isImageLoaded = false;

    this.init();
  }

  init() {
    this.playerImage.src = this.config.playerImagePath;
    this.playerImage.onload = () => (this.isImageLoaded = true);

    // Chrome/Safariの100vh問題を解決するためのカスタム変数
    this.updateViewportVariable();

    // リサイズ・画面回転時に再計算
    window.addEventListener('resize', () => {
      this.updateViewportVariable();
      this.handleResize();
    });

    this.handleResize();

    const startBtn = document.getElementById('start-button');
    startBtn.addEventListener('click', () => this.startGame());

    this.gameLoop();
  }

  /**
   * モバイルブラウザのツールバーを除いた正確な高さを計算
   */
  updateViewportVariable() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  handleResize() {
    // window.innerHeight を直接使用することで、アドレスバーを除いた高さを取得
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    const targetRatio = this.config.baseWidth / this.config.baseHeight;
    const currentRatio = displayWidth / displayHeight;

    if (currentRatio > targetRatio) {
      // 画面が基準より横長：高さを基準にサイズ決定
      this.canvas.style.height = displayHeight + 'px';
      this.canvas.style.width = displayHeight * targetRatio + 'px';
    } else {
      // 画面が基準より縦長（または一致）：幅を基準にサイズ決定
      this.canvas.style.width = displayWidth + 'px';
      this.canvas.style.height = displayWidth / targetRatio + 'px';
    }

    // 内部の解像度は固定（描画のズレを防ぐ）
    this.canvas.width = this.config.baseWidth;
    this.canvas.height = this.config.baseHeight;
  }

  async startGame() {
    if (!this.state.gameStarted) {
      try {
        // Chromeモバイルで最大化（フルスクリーン）を確実に行う
        const doc = document.documentElement;
        if (doc.requestFullscreen) {
          await doc.requestFullscreen();
        } else if (doc.webkitRequestFullscreen) {
          await doc.webkitRequestFullscreen();
        }

        // 画面向きの固定を再試行
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (err) {
        console.warn('Fullscreen/Orientation lock failed:', err);
      }

      document.getElementById('ui-start-screen').style.display = 'none';
      this.state.gameStarted = true;
      this.state.isPaused = false;
    }
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    if (this.state.isPaused || !this.state.gameStarted) return;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 地面
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);

    if (this.isImageLoaded && this.state.gameStarted) {
      this.ctx.drawImage(
        this.playerImage,
        150,
        this.canvas.height - 200,
        100,
        100,
      );
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PomRunner();
});
