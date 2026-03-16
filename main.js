/**
 * Pom Runner - Main Game Script (Fixed for Fullscreen)
 */

class PomRunner {
  constructor() {
    this.config = {
      // 基準となる高さのみ固定し、幅は画面に合わせて可変にする（黒帯対策）
      baseHeight: 720,
      version: 'v0.1.1',
      playerImagePath: 'assets/image/player.png',
    };

    this.state = {
      isPaused: true,
      gameStarted: false,
      screenWidth: 0,
      screenHeight: 0,
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

    this.updateViewportVariable();
    window.addEventListener('resize', () => {
      this.updateViewportVariable();
      this.handleResize();
    });

    this.handleResize();

    const startBtn = document.getElementById('start-button');
    // clickとtouchstart両方で反応を速める
    startBtn.addEventListener('click', (e) => this.startGame(e));

    this.gameLoop();
  }

  updateViewportVariable() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  /**
   * 黒帯を排除し、画面いっぱいにCanvasを広げるロジック
   */
  handleResize() {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    // CSS上の表示サイズを画面ぴったりにする
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';

    // 内部解像度の計算
    // 高さを固定し、幅をアスペクト比に応じて計算することで、
    // どんな画面サイズでもキャラの大きさが変わらず、横に見える範囲だけが広がるようにする
    const scale = displayHeight / this.config.baseHeight;
    this.canvas.height = this.config.baseHeight;
    this.canvas.width = displayWidth / scale;

    // 状態に保存
    this.state.screenWidth = this.canvas.width;
    this.state.screenHeight = this.canvas.height;
  }

  async startGame(e) {
    if (e) e.preventDefault();

    if (!this.state.gameStarted) {
      // フルスクリーン化の徹底
      const doc = document.documentElement;
      try {
        if (doc.requestFullscreen) {
          await doc.requestFullscreen();
        } else if (doc.webkitRequestFullscreen) {
          await doc.webkitRequestFullscreen();
        }

        // 画面向きの固定（Android Chrome向け）
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (err) {
        console.warn('Fullscreen error:', err);
      }

      // 少し遅延させてリサイズを再計算（バーが消えた後のサイズに合わせる）
      setTimeout(() => {
        this.handleResize();
        document.getElementById('ui-start-screen').style.display = 'none';
        this.state.gameStarted = true;
        this.state.isPaused = false;
      }, 300);
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

    // 背景（画面端まで描画）
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 地面（画面端まで描画）
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);

    if (this.isImageLoaded && this.state.gameStarted) {
      // キャラクターを地面の上に配置
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
