import 'phaser';
import BootScene from './scenes/BootScene';
import PreloadScene from './scenes/PreloadScene';
import TitleScene from './scenes/TitleScene';
import MainGameScene from './scenes/MainGameScene';
import UIScene from './scenes/UIScene';
import GameOverScene from './scenes/GameOverScene';
import { GameConfig } from './config/GameConfig';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // setTintを使えるようにAUTOに戻す
  width: GameConfig.WIDTH,
  height: GameConfig.HEIGHT,
  parent: 'game-container',
  backgroundColor: GameConfig.BG_COLOR,
  render: {
    pixelArt: true,
    roundPixels: true, // WebGLでも座標を整数に丸めることでブレを防止
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
  scene: [BootScene, PreloadScene, TitleScene, MainGameScene, UIScene, GameOverScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
