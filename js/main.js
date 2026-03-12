/**
 * ポムポムプリン・ウィンドランナー - メインスクリプト
 */

const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;
const GROUND_HEIGHT = 60;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 画像アセットの準備
const images = {
  login: new Image(),
  gameover: new Image(),
  updateBest: new Image(),
  purinRun: new Image(), // ユーザー用意の走る画像
  purinJump: new Image(), // ユーザー用意のジャンプ画像
};
images.login.src = 'assets/image/purin_login.png';
images.gameover.src = 'assets/image/purin_gameover.png';
images.updateBest.src = 'assets/image/purin_update_best.png';
// ★以下2つの画像を assets/image/ にご用意ください★
images.purinRun.src = 'assets/image/purin_run.png';
images.purinJump.src = 'assets/image/purin_jump.png';

// 状態管理
let gameState = 'START';
let score = 0;
let highScore = localStorage.getItem('pompom_highscore') || 0;
let isNewRecord = false;
let frameCount = 0;
let animationId;
let scrollOffset = 0;

// エンティティ・エフェクト配列
let player;
let obstacles = [];
let stars = [];
let particles = [];
let scorePopups = [];

// オーディオ設定
let audioCtx, bgmTimer;
let isBgmStarted = false;

// BGM用の簡易メロディ（軽快なテンポ）
const melody = [
  { f: 523, d: 0.2 },
  { f: 659, d: 0.2 },
  { f: 783, d: 0.4 },
  { f: 659, d: 0.2 },
  { f: 523, d: 0.2 },
  { f: 587, d: 0.4 },
];
let noteIdx = 0,
  nextNoteTime = 0;

// ==========================================
// システム関数
// ==========================================

// 画面サイズに合わせたCanvasスケーリング
function resizeGame() {
  const wrapper = document.getElementById('game-wrapper');
  const container = document.getElementById('game-container');
  const winW = wrapper.clientWidth;
  const winH = wrapper.clientHeight;
  // 画面内に収まるようにスケール計算（横長比率を維持）
  const scale = Math.min(winW / GAME_WIDTH, winH / GAME_HEIGHT);
  container.style.transform = `scale(${scale})`;
}

// オーディオの初期化
function initAudio() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// 効果音の再生
function playTone(freq, type, dur, vol = 0.1, time = audioCtx.currentTime) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + dur);
}

// BGM再生
function startBGM() {
  if (gameState !== 'PLAYING') return;
  if (nextNoteTime < audioCtx.currentTime + 0.1) {
    const n = melody[noteIdx];
    playTone(n.f, 'triangle', n.d, 0.03, nextNoteTime);
    nextNoteTime += n.d;
    noteIdx = (noteIdx + 1) % melody.length;
  }
  bgmTimer = setTimeout(startBGM, 50);
}

// ==========================================
// クラス定義
// ==========================================

class Player {
  constructor() {
    this.width = 60;
    this.height = 60;
    this.x = 100;
    this.y = GAME_HEIGHT - GROUND_HEIGHT - this.height;
    this.vy = 0;
    this.gravity = 0.9;
    this.jumpStrength = -15;
    this.jumpCount = 0;
    this.maxJumps = 2;
  }

  jump() {
    if (this.jumpCount < this.maxJumps) {
      this.vy = this.jumpStrength;
      this.jumpCount++;
      // ジャンプ音
      playTone(440 + this.jumpCount * 200, 'sine', 0.1, 0.1);
    }
  }

  update() {
    this.vy += this.gravity;
    this.y += this.vy;

    const groundY = GAME_HEIGHT - GROUND_HEIGHT;
    if (this.y + this.height > groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.jumpCount = 0;
    }
  }

  draw(ctx) {
    // ジャンプ中かどうかで画像を切り替え
    const img =
      this.vy !== 0 || this.y < GAME_HEIGHT - GROUND_HEIGHT - this.height
        ? images.purinJump
        : images.purinRun;

    if (img.complete && img.naturalWidth !== 0) {
      // 画像が読み込まれていれば描画
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      // 画像がない場合の代替描画（プリン色）
      ctx.fillStyle = '#fde24f';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#4a2511';
      ctx.fillRect(this.x + 15, this.y - 10, 30, 10);
    }
  }
}

class Obstacle {
  constructor() {
    this.width = 40 + Math.random() * 20;
    this.height = 40 + Math.random() * 40;
    this.x = GAME_WIDTH;
    this.y = GAME_HEIGHT - GROUND_HEIGHT - this.height;
    this.speed = 7 + score / 200; // スコアに応じて加速
  }

  update() {
    this.x -= this.speed;
  }

  draw(ctx) {
    // 切り株や岩っぽいリッチな描画
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 8);
    ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.roundRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10, 5);
    ctx.fill();
  }
}

class Star {
  constructor() {
    this.radius = 18;
    this.x = GAME_WIDTH;
    this.y = GAME_HEIGHT - GROUND_HEIGHT - 60 - Math.random() * 150;
    this.speed = 7 + score / 200;
    this.angle = 0;
  }

  update() {
    this.x -= this.speed;
    this.angle += 0.05; // 回転アニメーション用
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;

    // 星型の描画
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(
        Math.cos(((18 + i * 72) * Math.PI) / 180) * this.radius,
        -Math.sin(((18 + i * 72) * Math.PI) / 180) * this.radius,
      );
      ctx.lineTo(
        Math.cos(((54 + i * 72) * Math.PI) / 180) * (this.radius * 0.4),
        -Math.sin(((54 + i * 72) * Math.PI) / 180) * (this.radius * 0.4),
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ==========================================
// パーティクル＆エフェクト
// ==========================================

function createParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1.0,
      color: Math.random() > 0.5 ? '#FFD700' : '#FFF',
    });
  }
}

function createScorePopup(x, y, text) {
  scorePopups.push({ x: x, y: y, text: text, life: 1.0, vy: -2 });
}

// ==========================================
// メインロジック
// ==========================================

function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width - 10 && // 判定を少し甘くする
    rect1.x + rect1.width > rect2.x + 10 &&
    rect1.y < rect2.y + rect2.height - 10 &&
    rect1.y + rect1.height > rect2.y + 10
  );
}

function isCollectingStar(player, star) {
  return (
    player.x < star.x + star.radius &&
    player.x + player.width > star.x - star.radius &&
    player.y < star.y + star.radius &&
    player.y + player.height > star.y - star.radius
  );
}

function initGame() {
  initAudio();
  player = new Player();
  obstacles = [];
  stars = [];
  particles = [];
  scorePopups = [];
  score = 0;
  frameCount = 0;
  scrollOffset = 0;
  isNewRecord = false;
  gameState = 'PLAYING';

  document.getElementById('scoreVal').innerText = score;
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('gameover-screen').style.opacity = 0;

  if (animationId) cancelAnimationFrame(animationId);

  nextNoteTime = audioCtx.currentTime;
  startBGM();

  gameLoop();
}

function triggerGameOver() {
  gameState = 'GAMEOVER';
  clearTimeout(bgmTimer);
  playTone(150, 'sawtooth', 0.8, 0.2); // ゲームオーバー音

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('pompom_highscore', highScore);
    isNewRecord = true;
  }

  document.getElementById('bestVal').innerText = highScore;
  document.getElementById('finalScore').innerText = score;

  const titleEl = document.getElementById('gameover-title');
  const imgEl = document.getElementById('gameover-img');

  if (isNewRecord) {
    titleEl.innerText = 'NEW BEST!';
    titleEl.classList.replace('text-red-500', 'text-yellow-500');
    imgEl.src = images.updateBest.src;
    playTone(1046, 'square', 0.2, 0.1);
    playTone(1318, 'square', 0.4, 0.1, audioCtx.currentTime + 0.2);
  } else {
    titleEl.innerText = 'ゲームオーバー';
    titleEl.classList.replace('text-yellow-500', 'text-red-500');
    imgEl.src = images.gameover.src;
  }

  const screen = document.getElementById('gameover-screen');
  screen.classList.remove('hidden');
  setTimeout(() => {
    screen.style.opacity = 1;
    screen.classList.add('pointer-events-auto');
  }, 50);
}

// ==========================================
// 背景描画（パララックススクロール）
// ==========================================

function drawBackground() {
  // 空（固定）
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // 遠景の雲（遅い）
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 3; i++) {
    const cx = (i * 300 - scrollOffset * 0.2) % (GAME_WIDTH + 300);
    const xPos = cx < -100 ? cx + GAME_WIDTH + 300 : cx;
    ctx.beginPath();
    ctx.arc(xPos, 80 + (i % 2) * 30, 40, 0, Math.PI * 2);
    ctx.arc(xPos + 40, 80 + (i % 2) * 30, 50, 0, Math.PI * 2);
    ctx.arc(xPos + 80, 80 + (i % 2) * 30, 40, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // 中景の山（中くらいの速度）
  ctx.fillStyle = '#90EE90';
  for (let i = 0; i < 4; i++) {
    const mx = (i * 400 - scrollOffset * 0.5) % (GAME_WIDTH + 400);
    const xPos = mx < -200 ? mx + GAME_WIDTH + 400 : mx;
    ctx.beginPath();
    ctx.moveTo(xPos, GAME_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(xPos + 200, 150 + (i % 2) * 50);
    ctx.lineTo(xPos + 400, GAME_HEIGHT - GROUND_HEIGHT);
    ctx.fill();
  }

  // 近景の地面（速い、実際の進行速度）
  ctx.fillStyle = '#8FBC8F'; // 草部分
  ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
  ctx.fillStyle = '#D2B48C'; // 土部分
  ctx.fillRect(
    0,
    GAME_HEIGHT - GROUND_HEIGHT + 15,
    GAME_WIDTH,
    GROUND_HEIGHT - 15,
  );

  // 地面の模様（流れる線）
  ctx.fillStyle = '#A0522D';
  for (let i = 0; i < 10; i++) {
    const gx = (i * 100 - scrollOffset) % (GAME_WIDTH + 100);
    const xPos = gx < -50 ? gx + GAME_WIDTH + 100 : gx;
    ctx.fillRect(xPos, GAME_HEIGHT - GROUND_HEIGHT + 25, 40, 5);
    ctx.fillRect(xPos + 30, GAME_HEIGHT - GROUND_HEIGHT + 45, 30, 5);
  }
}

// ==========================================
// メインループ
// ==========================================

function gameLoop() {
  if (gameState !== 'PLAYING') return;

  scrollOffset += 7 + score / 200; // ゲームスピードの進行

  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawBackground();

  // プレイヤー更新・描画
  player.update();
  player.draw(ctx);

  // 障害物
  if (frameCount % Math.max(60, 120 - Math.floor(score / 5)) === 0) {
    obstacles.push(new Obstacle());
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.update();
    obs.draw(ctx);

    if (isColliding(player, obs)) {
      triggerGameOver();
      return;
    }

    if (obs.x + obs.width < 0) obstacles.splice(i, 1);
  }

  // 星
  if (frameCount % 50 === 0 && Math.random() > 0.3) {
    stars.push(new Star());
  }
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    star.update();
    star.draw(ctx);

    if (isCollectingStar(player, star)) {
      score += 10;
      document.getElementById('scoreVal').innerText = score;
      createParticles(star.x, star.y);
      createScorePopup(star.x, star.y - 20, '+10');
      playTone(880, 'sine', 0.1, 0.05); // 取得音
      stars.splice(i, 1);
      continue;
    }

    if (star.x + star.radius < 0) stars.splice(i, 1);
  }

  // エフェクト描画
  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.05;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    if (p.life <= 0) particles.splice(i, 1);
  });
  ctx.globalAlpha = 1.0;

  scorePopups.forEach((pop, i) => {
    pop.y += pop.vy;
    pop.life -= 0.03;
    ctx.save();
    ctx.globalAlpha = Math.max(0, pop.life);
    ctx.font = "900 24px 'M PLUS Rounded 1c', sans-serif";
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#5E3A21';
    ctx.lineWidth = 4;
    ctx.strokeText(pop.text, pop.x, pop.y);
    ctx.fillStyle = '#FACC15';
    ctx.fillText(pop.text, pop.x, pop.y);
    ctx.restore();
    if (pop.life <= 0) scorePopups.splice(i, 1);
  });

  frameCount++;
  animationId = requestAnimationFrame(gameLoop);
}

// ==========================================
// イベント・初期化
// ==========================================

function handleJump(e) {
  if (e.type === 'touchstart') e.preventDefault();
  if (gameState === 'PLAYING') {
    player.jump();
  }
}

// 操作イベント（画面全体のどこを押してもジャンプ）
window.addEventListener('mousedown', handleJump);
window.addEventListener('touchstart', handleJump, { passive: false });

// ボタンイベント
document.getElementById('start-btn').onclick = (e) => {
  e.stopPropagation();
  initGame();
};
document.getElementById('retry-btn').onclick = (e) => {
  e.stopPropagation();
  initGame();
};

// 初期化処理
window.onload = () => {
  document.getElementById('bestVal').innerText = highScore;
  resizeGame();
  window.addEventListener('resize', resizeGame);

  // 背景だけプレビュー描画しておく
  drawBackground();
};
