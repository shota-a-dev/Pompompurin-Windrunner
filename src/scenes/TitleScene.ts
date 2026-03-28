import 'phaser';
import SoundGenerator from '../utils/SoundGenerator';
import { GameConfig } from '../config/GameConfig';

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

        // 設定メニュー（開発用）のトグルとリセット処理
        const settingsBtn = document.getElementById('settings-btn');
        const settingsMenu = document.getElementById('settings-menu');
        const settingsResetCollectionBtn = document.getElementById('settings-reset-collection-btn');

        if (settingsBtn && settingsMenu) {
            settingsBtn.onclick = (e) => {
                e.preventDefault();
                if (settingsMenu.classList.contains('hidden')) {
                    settingsMenu.classList.remove('hidden');
                    settingsMenu.style.display = 'block';
                } else {
                    settingsMenu.classList.add('hidden');
                    settingsMenu.style.display = 'none';
                }
            };
        }

        if (settingsResetCollectionBtn) {
            settingsResetCollectionBtn.onclick = (e) => {
                e.preventDefault();
                if (confirm('たからものの取得状況をリセットしてもよろしいですか？（テスト用機能）')) {
                    localStorage.removeItem('pomRunnerUnlockedItems');
                    localStorage.removeItem('pomRunnerTotalCoins');
                }
            };
        }

        // スタートボタンのイベント
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.onclick = async () => {
                const soundManager = this.sound as any;
                try {
                    if (soundManager.context && soundManager.context.state === 'suspended') {
                        await soundManager.context.resume();
                    }
                } catch (e) {
                    // ignore
                }
                // SoundGenerator の AudioContext も確実に resume する
                try { await SoundGenerator.ensureAudioStarted(); } catch (e) { /* ignore */ }
                // 現在のビューポート（回転後のサイズ）を使って再計算し、
                // ユーザーがページ読み込み後に回転してから「遊ぶ」を押した場合に備える。
                try {
                    const baseHeight = GameConfig.REFERENCE_HEIGHT;
                    const vv = (window as any).visualViewport;
                    const vw = (vv && vv.width) || window.innerWidth;
                    const vh = (vv && vv.height) || window.innerHeight || document.documentElement.clientHeight;
                    const baseWidth = Math.round(baseHeight * (vw / vh));
                    this.scale.resize(baseWidth, baseHeight);

                    const canvas = (this.game.canvas as HTMLCanvasElement | null);
                    if (canvas) {
                        canvas.style.width = '100%';
                        canvas.style.height = 'auto';
                        canvas.style.maxHeight = '100vh';
                        canvas.style.display = 'block';
                        canvas.style.margin = '0 auto';
                    }

                    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* ignore */ }
                } catch (e) {
                    // resize に失敗してもゲームは起動する
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
