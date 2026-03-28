import 'phaser';
import { CollectionConfig, CollectionItem } from '../config/CollectionConfig';
import SoundGenerator from '../utils/SoundGenerator';

export default class CollectionScene extends Phaser.Scene {
    constructor() {
        super('CollectionScene');
    }

    init() {
        const collectionScreen = document.getElementById('collection-screen');
        if (collectionScreen) {
            collectionScreen.classList.remove('hidden');
            collectionScreen.style.setProperty('display', 'flex', 'important');
            collectionScreen.style.zIndex = '2000';
        }
    }

    create() {
        const collectionScreen = document.getElementById('collection-screen');
        const closeBtn = document.getElementById('close-collection-btn');
        const previewOverlay = document.getElementById('item-preview-overlay');

        if (!collectionScreen || !closeBtn || !previewOverlay) {
            console.error('CollectionScene: Required UI elements not found');
            return;
        }

        try {
            this.updateUI();
        } catch (error) {
            console.error('CollectionScene: Failed to update UI', error);
        }

        // 閉じるボタン（コレクション画面自体を閉じる）
        closeBtn.onclick = (e) => {
            e.preventDefault();
            collectionScreen.style.setProperty('display', 'none', 'important');
            collectionScreen.classList.add('hidden');
            this.scene.start('TitleScene');
        };

        // プレビューオーバーレイをクリックで閉じる
        previewOverlay.onclick = () => {
            this.hidePreview();
        };
    }

    private updateUI() {
        const grid = document.getElementById('collectionGrid');
        const totalCoinsUI = document.getElementById('collectionTotalCoins');
        if (!grid || !totalCoinsUI) return;

        const totalCoinsStr = localStorage.getItem('pomRunnerTotalCoins') || '0';
        const totalCoins = parseInt(totalCoinsStr, 10);
        totalCoinsUI.innerText = totalCoins.toLocaleString();

        let unlockedItems: string[] = [];
        try {
            const stored = localStorage.getItem('pomRunnerUnlockedItems');
            unlockedItems = stored ? JSON.parse(stored) : [];
        } catch (e) {
            unlockedItems = [];
        }

        grid.innerHTML = '';
        CollectionConfig.forEach(item => {
            const isUnlocked = unlockedItems.includes(item.id);
            const canAfford = totalCoins >= item.cost;

            const card = document.createElement('div');
            // 解放済みなら cursor-pointer を付与
            card.className = `bg-white p-1 rounded-xl shadow-sm border-2 transition-all flex flex-col items-center text-center ${isUnlocked ? 'border-[#FDE047] cursor-pointer hover:scale-105' : 'border-gray-100'}`;
            
            card.innerHTML = `
                <div class="relative mb-0.5 h-36 w-full flex items-center justify-center bg-[#FFFDEB] rounded-lg overflow-hidden pointer-events-none border border-[#FDE047]/10">
                    <img src="${item.image}" alt="${item.name}" class="w-4/5 h-4/5 object-contain ${isUnlocked ? '' : 'brightness-0 opacity-10'}">
                    ${!isUnlocked ? `<div class="absolute inset-0 flex items-center justify-center text-gray-300 text-xl font-black">?</div>` : ''}
                </div>
                <div class="flex-1 flex flex-col w-full">
                    <h3 class="text-[12px] font-black text-[#5E3A21] mb-0.5 line-clamp-1 leading-tight">${isUnlocked ? item.name : '？？？'}</h3>
                    ${!isUnlocked 
                        ? `<button class="buy-btn mt-auto w-full py-1 rounded-md text-[12px] font-black transition-all flex items-center justify-center gap-1 ${canAfford ? 'bg-[#FDE047] text-[#5E3A21] shadow-[0_2px_0_#D4B106] active:translate-y-0.5 active:shadow-none' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}" 
                            ${canAfford ? '' : 'disabled'}>
                            <img src="assets/image/sprites/coin.png" class="w-3 h-3 ${canAfford ? '' : 'grayscale'}">
                            ${item.cost}
                           </button>`
                        : `<div class="mt-auto w-full py-1 bg-[#FDE047]/20 rounded-lg text-[#D4B106] font-black text-[10px] italic border border-[#FDE047]/30">GET!</div>`
                    }
                </div>
            `;

            // 購入ボタンのイベント
            const buyBtn = card.querySelector('.buy-btn');
            if (buyBtn && canAfford && !isUnlocked) {
                (buyBtn as HTMLElement).onclick = (e) => {
                    e.stopPropagation(); // 親カードのプレビューイベントを阻止
                    this.purchaseItem(item);
                };
            }

            // 解放済みカードをクリックでプレビュー表示
            if (isUnlocked) {
                card.onclick = () => this.showPreview(item);
            }

            grid.appendChild(card);
        });
    }

    private showPreview(item: CollectionItem) {
        const overlay = document.getElementById('item-preview-overlay');
        const img = document.getElementById('previewImage') as HTMLImageElement;
        const name = document.getElementById('previewName');
        const desc = document.getElementById('previewDesc');

        if (!overlay || !img || !name || !desc) return;

        img.src = item.image;
        name.innerText = item.name;
        desc.innerText = item.description;

        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        // フェードインアニメーション
        setTimeout(() => {
            overlay.classList.add('opacity-100');
        }, 10);
    }

    private hidePreview() {
        const overlay = document.getElementById('item-preview-overlay');
        if (!overlay) return;

        overlay.classList.remove('opacity-100');
        // アニメーション完了後に hidden にする
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }, 300);
    }

    private purchaseItem(item: CollectionItem) {
        try {
            const totalCoinsStr = localStorage.getItem('pomRunnerTotalCoins') || '0';
            let totalCoins = parseInt(totalCoinsStr, 10);
            const stored = localStorage.getItem('pomRunnerUnlockedItems');
            let unlockedItems: string[] = stored ? JSON.parse(stored) : [];

            if (totalCoins >= item.cost && !unlockedItems.includes(item.id)) {
                totalCoins -= item.cost;
                localStorage.setItem('pomRunnerTotalCoins', totalCoins.toString());
                unlockedItems.push(item.id);
                localStorage.setItem('pomRunnerUnlockedItems', JSON.stringify(unlockedItems));

                SoundGenerator.playFever();
                this.updateUI();
            }
        } catch (e) {
            console.error('Purchase failed', e);
        }
    }
}
