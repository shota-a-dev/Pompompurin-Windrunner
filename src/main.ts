import 'phaser';
import BootScene from './scenes/BootScene';
import PreloadScene from './scenes/PreloadScene';
import TitleScene from './scenes/TitleScene';
import MainGameScene from './scenes/MainGameScene';
import UIScene from './scenes/UIScene';
import GameOverScene from './scenes/GameOverScene';
import CollectionScene from './scenes/CollectionScene';
import { GameConfig } from './config/GameConfig';

// 画面サイズをブラウザの比率に合わせて動的に計算（高さはGameConfig.REFERENCE_HEIGHTに固定）
const baseHeight = GameConfig.REFERENCE_HEIGHT;
const aspectRatio = window.innerWidth / window.innerHeight;
const baseWidth = baseHeight * aspectRatio;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: baseWidth,
  height: baseHeight,
  parent: 'game-container',
  backgroundColor: GameConfig.BG_COLOR,
  render: {
    pixelArt: true,
    roundPixels: true,
    antialias: false
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GameConfig.GRAVITY },
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, TitleScene, MainGameScene, UIScene, GameOverScene, CollectionScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
