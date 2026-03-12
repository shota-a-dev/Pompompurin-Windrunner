// Canvasとコンテキストの取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 画像アセットの準備
const images = {
  login: new Image(),
  gameover: new Image(),
  updateBest: new Image(),
};
images.login.src = 'assets/image/purin_login.png';
images.gameover.src = 'assets/image/purin_gameover.png';
images.updateBest.src = 'assets/image/purin_update_best.png';

// ゲームの状態管理
let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER'
let score = 0;
let highScore = localStorage.getItem('pompom_highscore') || 0;
let isNewRecord = false;
let frameCount = 0;
let animationId;

// ゲーム内エンティティ
let player;
let obstacles = [];
let stars = [];

// ==========================================
// クラス定義
// ==========================================

// プレイヤークラス
class Player {
  constructor() {
    this.width = 50;
    this.height = 50;
    this.x = 100; // 固定のX座標
    this.y = canvas.height - 50 - this.height; // 地面の高さ(50)を考慮
    this.vy = 0;
    this.gravity = 0.8;
    this.jumpStrength = -14;
    this.jumpCount = 0;
    this.maxJumps = 2; // 2段ジャンプまで
  }

  jump() {
    if (this.jumpCount < this.maxJumps) {
      this.vy = this.jumpStrength;
      this.jumpCount++;
    }
  }

  update() {
    // 重力の適用
    this.vy += this.gravity;
    this.y += this.vy;

    // 地面との衝突判定
    const groundY = canvas.height - 50;
    if (this.y + this.height > groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.jumpCount = 0; // 地面に着いたらジャンプ回数をリセット
    }
  }

  draw(ctx) {
    // キャラクターの代替描画（ポムポムプリン風の配色）
    ctx.fillStyle = '#fde24f'; // プリンの黄色
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // ベレー帽の代替描画
    ctx.fillStyle = '#4a2511'; // こげ茶色
    ctx.fillRect(this.x + 10, this.y - 8, 30, 8);
  }
}

// 障害物クラス
class Obstacle {
  constructor() {
    this.width = 40;
    this.height = 40 + Math.random() * 30; // ランダムな高さ
    this.x = canvas.width;
    this.y = canvas.height - 50 - this.height;
    this.speed = 6 + frameCount / 1000; // 時間経過で少しずつ加速
  }

  update() {
    this.x -= this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = '#8B4513'; // 茶色の障害物
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// 星（アイテム）クラス
class Star {
  constructor() {
    this.radius = 15;
    this.x = canvas.width;
    // 地面より少し上のランダムな高さに配置
    this.y = canvas.height - 100 - Math.random() * 150;
    this.speed = 6 + frameCount / 1000;
  }

  update() {
    this.x -= this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = '#FFD700'; // ゴールド
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ==========================================
// メインロジック
// ==========================================

// 衝突判定関数 (矩形同士)
function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// 星取得判定関数 (プレイヤー矩形と星の円を簡易的に矩形として判定)
function isCollectingStar(player, star) {
  return (
    player.x < star.x + star.radius &&
    player.x + player.width > star.x - star.radius &&
    player.y < star.y + star.radius &&
    player.y + player.height > star.y - star.radius
  );
}

// ゲーム初期化
function initGame() {
  player = new Player();
  obstacles = [];
  stars = [];
  score = 0;
  frameCount = 0;
  isNewRecord = false;
  gameState = 'PLAYING';

  if (animationId) cancelAnimationFrame(animationId);
  gameLoop();
}

// ゲームオーバー処理
function triggerGameOver() {
  gameState = 'GAMEOVER';
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('pompom_highscore', highScore);
    isNewRecord = true;
  }
  drawGameOverScreen();
}

// ==========================================
// 描画処理
// ==========================================

// スタート画面の描画
function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景画像の描画（読み込まれていれば）
  if (images.login.complete && images.login.naturalWidth !== 0) {
    ctx.drawImage(images.login, 0, 0, canvas.width, canvas.height);
  } else {
    // 画像がない場合の代替背景
    ctx.fillStyle = '#FFF8DC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 「はじめる」ボタンの描画
  ctx.fillStyle = '#FF7F50';
  ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 50, 200, 50);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('はじめる', canvas.width / 2, canvas.height / 2 + 75);
}

// ゲームオーバー画面の描画
function drawGameOverScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bgImage = isNewRecord ? images.updateBest : images.gameover;

  if (bgImage.complete && bgImage.naturalWidth !== 0) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#FFF8DC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      isNewRecord ? 'NEW BEST!' : 'GAME OVER',
      canvas.width / 2,
      canvas.height / 2 - 50,
    );
  }

  // スコア表示
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText(
    `High Score: ${highScore}`,
    canvas.width / 2,
    canvas.height / 2 + 60,
  );

  // リトライ案内
  ctx.font = '18px Arial';
  ctx.fillText(
    '画面をタップ/クリックでタイトルに戻る',
    canvas.width / 2,
    canvas.height - 30,
  );
}

// プレイ中のメインループ
function gameLoop() {
  if (gameState !== 'PLAYING') return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 地面の描画
  ctx.fillStyle = '#8FBC8F';
  ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

  // プレイヤーの更新と描画
  player.update();
  player.draw(ctx);

  // 障害物の生成・更新・描画
  if (frameCount % 90 === 0) {
    obstacles.push(new Obstacle());
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.update();
    obs.draw(ctx);

    // 衝突判定
    if (isColliding(player, obs)) {
      triggerGameOver();
      return; // ループを抜ける
    }

    // 画面外に出た障害物を削除
    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // 星の生成・更新・描画
  if (frameCount % 60 === 0 && Math.random() > 0.4) {
    stars.push(new Star());
  }
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    star.update();
    star.draw(ctx);

    // 取得判定
    if (isCollectingStar(player, star)) {
      score += 10;
      stars.splice(i, 1);
      continue;
    }

    // 画面外に出た星を削除
    if (star.x + star.radius < 0) {
      stars.splice(i, 1);
    }
  }

  // スコアの描画
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`Score: ${score}`, canvas.width - 20, 40);

  frameCount++;
  animationId = requestAnimationFrame(gameLoop);
}

// ==========================================
// イベントリスナー
// ==========================================

function handleInput(e) {
  // タッチイベント時のデフォルト動作（スクロールなど）を防止
  if (e.type === 'touchstart') {
    e.preventDefault();
  }

  if (gameState === 'START') {
    // クリック/タップ座標の取得とボタン領域判定
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (clientX === undefined) return;

    // CSSによるリサイズを考慮したキャンバス内座標の計算
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // はじめるボタンの領域 (x: 300, y: 275, width: 200, height: 50)
    const btnX = canvas.width / 2 - 100;
    const btnY = canvas.height / 2 + 50;

    if (x >= btnX && x <= btnX + 200 && y >= btnY && y <= btnY + 50) {
      initGame();
    }
  } else if (gameState === 'PLAYING') {
    player.jump();
  } else if (gameState === 'GAMEOVER') {
    gameState = 'START';
    drawStartScreen();
  }
}

// PC（クリック）とスマホ（タップ）両対応
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput, { passive: false });

// ==========================================
// 初期描画の実行
// ==========================================

// 画像がロードされたらスタート画面を再描画する
images.login.onload = () => {
  if (gameState === 'START') {
    drawStartScreen();
  }
};

// キャッシュ等ですでにロード済みの場合に備えて初回呼び出し
drawStartScreen();
