import 'phaser';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        // HTML UIの表示制御
        const startScreen = document.getElementById('start-screen');
        const uiLayer = document.getElementById('ui-layer');
        const gameOverScreen = document.getElementById('gameover-screen');
        const collectionScreen = document.getElementById('collection-screen');

        if (startScreen) startScreen.classList.remove('hidden');
        if (uiLayer) uiLayer.classList.add('hidden');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        if (collectionScreen) collectionScreen.classList.add('hidden');

        // ベストスコアの表示
        const bestScore = parseInt(localStorage.getItem('pomRunnerBestScore') || '0');
        const startBestScoreUI = document.getElementById('startBestScore');
        if (startBestScoreUI) startBestScoreUI.innerText = bestScore.toLocaleString();

        // スタートボタンのイベント
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.onclick = () => {
                const soundManager = this.sound as any;
                if (soundManager.context && soundManager.context.state === 'suspended') {
                    soundManager.context.resume();
                }
                if (startScreen) startScreen.classList.add('hidden');
                this.scene.start('MainGameScene');
            };
        }

        // コレクションボタンのイベント
        const collectionBtn = document.getElementById('collection-btn');
        if (collectionBtn) {
            collectionBtn.addEventListener('click', () => {
                console.log('Collection button clicked via addEventListener');
                if (startScreen) startScreen.classList.add('hidden');
                this.scene.start('CollectionScene');
            });
        }

        // リセットボタンのイベント
        const resetBtn = document.getElementById('reset-best-btn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm('自己ベストをリセットしてもよろしいですか？')) {
                    localStorage.removeItem('pomRunnerBestScore');
                    if (startBestScoreUI) startBestScoreUI.innerText = '0';
                }
            };
        }
    }
}
