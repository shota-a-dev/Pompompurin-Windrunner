/* Ver 1.0.0 */
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

// BGM用の簡易メロディ
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

function resizeGame() {
  const container = document.getElementById('game-container');
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const scale = Math.min(winW / GAME_WIDTH, winH / GAME_HEIGHT);
  container.style.transform = `scale(${scale})`;
}

function initAudio() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

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
    const img =
      this.vy !== 0 || this.y < GAME_HEIGHT - GROUND_HEIGHT - this.height
        ? images.purinJump
        : images.purinRun;
    if (img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = '#fde24f';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

class Obstacle {
  constructor() {
    this.width = 40 + Math.random() * 20;
    this.height = 40 + Math.random() * 40;
    this.x = GAME_WIDTH;
    this.y = GAME_HEIGHT - GROUND_HEIGHT - this.height;
    this.speed = 7 + score / 200;
  }
  update() {
    this.x -= this.speed;
  }
  draw(ctx) {
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 8);
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
    this.angle += 0.05;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#FFD700';
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
    ctx.restore();
  }
}

function createParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1.0,
      color: '#FFD700',
    });
  }
}

function createScorePopup(x, y, text) {
  scorePopups.push({ x, y, text, life: 1.0, vy: -2 });
}

// ==========================================
// メインロジック
// ==========================================

function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width - 10 &&
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
  playTone(150, 'sawtooth', 0.8, 0.2);

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
    imgEl.src = images.updateBest.src;
  } else {
    titleEl.innerText = 'ゲームオーバー';
    imgEl.src = images.gameover.src;
  }

  const screen = document.getElementById('gameover-screen');
  screen.classList.remove('hidden');
  setTimeout(() => {
    screen.style.opacity = 1;
    screen.classList.add('pointer-events-auto');
  }, 50);
}

function drawBackground() {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = '#8FBC8F';
  ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
}

function gameLoop() {
  if (gameState !== 'PLAYING') return;
  scrollOffset += 7 + score / 200;
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawBackground();
  player.update();
  player.draw(ctx);

  if (frameCount % 100 === 0) obstacles.push(new Obstacle());
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();
    obstacles[i].draw(ctx);
    if (isColliding(player, obstacles[i])) {
      triggerGameOver();
      return;
    }
    if (obstacles[i].x + obstacles[i].width < 0) obstacles.splice(i, 1);
  }

  if (frameCount % 50 === 0) stars.push(new Star());
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].update();
    stars[i].draw(ctx);
    if (isCollectingStar(player, stars[i])) {
      score += 10;
      document.getElementById('scoreVal').innerText = score;
      playTone(880, 'sine', 0.1, 0.05);
      stars.splice(i, 1);
    } else if (stars[i].x + stars[i].radius < 0) {
      stars.splice(i, 1);
    }
  }
  frameCount++;
  animationId = requestAnimationFrame(gameLoop);
}

function handleJump(e) {
  if (gameState === 'PLAYING') {
    player.jump();
    if (e.cancelable) e.preventDefault();
  }
}

window.addEventListener('mousedown', handleJump);
window.addEventListener('touchstart', handleJump, { passive: false });

document.getElementById('start-btn').onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  initGame();
};

document.getElementById('retry-btn').onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  initGame();
};

window.onload = () => {
  document.getElementById('bestVal').innerText = highScore;
  resizeGame();
  window.addEventListener('resize', resizeGame);
  drawBackground();
};
