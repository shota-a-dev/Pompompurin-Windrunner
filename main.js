/**
 * Pom Runner - Main Game Script
 * Version: 0.1.0
 * シニアエンジニアによる基盤実装
 */

class PomRunner {
  constructor() {
    // 設定値
    this.config = {
      baseWidth: 1280, // ゲームの基準解像度（横）
      baseHeight: 720, // ゲームの基準解像度（縦）
      version: 'v0.1.0',
      playerImagePath: 'assets/image/player.png',
    };

    // 状態管理
    this.state = {
      isPaused: true,
      isGameOver: false,
      gameStarted: false,
    };

    // Canvas要素の設定
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // アセット
    this.playerImage = new Image();
    this.isImageLoaded = false;

    // 初期化実行
    this.init();
  }

  /**
   * 初期設定とイベントリスナーの登録
   */
  init() {
    // 画像のプリロード
    this.playerImage.src = this.config.playerImagePath;
    this.playerImage.onload = () => {
      this.isImageLoaded = true;
      console.log('Player image loaded successfully.');
    };
    this.playerImage.onerror = () => {
      console.error(
        'Failed to load player image at: ' + this.config.playerImagePath,
      );
    };

    // リサイズ対応
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // スタートボタンのイベント
    const startBtn = document.getElementById('start-button');
    startBtn.addEventListener('click', () => this.startGame());

    // メインループの開始（描画自体は状態を見て判断）
    this.gameLoop();
  }

  /**
   * ウィンドウサイズに合わせてCanvasをスケールさせる（アスペクト比維持）
   */
  handleResize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const targetRatio = this.config.baseWidth / this.config.baseHeight;

    if (windowRatio > targetRatio) {
      // ウィンドウの方が横長な場合、高さを基準に調整
      this.canvas.style.height = windowHeight + 'px';
      this.canvas.style.width = windowHeight * targetRatio + 'px';
    } else {
      // ウィンドウの方が縦長な場合、幅を基準に調整
      this.canvas.style.width = windowWidth + 'px';
      this.canvas.style.height = windowWidth / targetRatio + 'px';
    }

    // 内部解像度を固定
    this.canvas.width = this.config.baseWidth;
    this.canvas.height = this.config.baseHeight;
  }

  /**
   * フルスクリーン有効化とゲーム開始処理
   */
  async startGame() {
    if (!this.state.gameStarted) {
      try {
        // フルスクリーンリクエスト（ユーザーアクション内である必要あり）
        const container = document.getElementById('game-container');
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        }

        // 横画面への固定試行（一部のモバイルブラウザで対応）
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch((err) => {
            console.warn('Orientation lock failed: ', err);
          });
        }
      } catch (err) {
        console.warn('Fullscreen request failed: ', err);
      }

      // UIを非表示にする
      document.getElementById('ui-start-screen').style.display = 'none';
      this.state.gameStarted = true;
      this.state.isPaused = false;
    }
  }

  /**
   * メインのゲームループ（60FPS目標）
   */
  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * ロジック更新（位置計算、衝突判定等）
   */
  update() {
    if (this.state.isPaused || !this.state.gameStarted) return;

    // 現時点では更新処理なし（Step 2以降で実装）
  }

  /**
   * 描画処理
   */
  draw() {
    // 背景クリア
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 背景色（スカイブルー）
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 地面（仮）
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);

    // プレイヤー描画（画像読み込み済みの場合のみ）
    if (this.isImageLoaded && this.state.gameStarted) {
      // 仮の座標 (中央左寄りに配置)
      const playerX = 150;
      const playerY = this.canvas.height - 100 - 100; // 地面の上
      const playerSize = 100;

      this.ctx.drawImage(
        this.playerImage,
        playerX,
        playerY,
        playerSize,
        playerSize,
      );
    }
  }
}

// インスタンス化
window.addEventListener('DOMContentLoaded', () => {
  new PomRunner();
});
