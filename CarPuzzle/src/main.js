import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { Preloader } from './scenes/Preloader.js';
import { Menu } from './scenes/Menu.js';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#365985',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
        Boot,
        Preloader,
        Menu,
        Game
    ]
};

new Phaser.Game(config);