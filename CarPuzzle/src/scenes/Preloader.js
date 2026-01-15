/*
* Game assets are taken from: https://groovymcgee.itch.io/car-game-pixel-art
*/
export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        //  Simple background for the loader (no external image required)
        const cfgW = this.sys.game.config.width;
        const cfgH = this.sys.game.config.height;
        this.add.rectangle(cfgW/2, cfgH/2, cfgW, cfgH, 0x365985);

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload() {
        //  Load the assets for the game
        // Assets are located inside the CarPuzzle folder relative to index.html
        this.load.setPath('./CarPuzzle/assets/');

        this.load.image('tile', 'overpass.png');
        this.load.image('exit_sign', 'street_light.png');

        this.load.image('red_car', 'red_car.png');
        this.load.image('blue_car', 'blue_car.png');
        this.load.image('yellow_car', 'yellow_car.png');
        this.load.image('striped_red_car', 'striped_red_car.png'); // Using striped red for purple
        this.load.image('police_car', 'police_car.png');

        this.load.image('grey_car', 'grey_car.png');
        this.load.image('overpass2', 'overpass2.png');

        this.load.image('traffic_light', 'traffic_light.png');
        this.load.image('concrete_bottom', 'concrete_bottom.png');
        this.load.image('concrete_top', 'concrete_top.png');
        this.load.image('concrete_middle', 'concrete_middle.png');
        this.load.image('fire_hydrant', 'fire_hydrant.png');
        this.load.image('grass_top', 'grass_top.png');
        this.load.image('grass_bottom', 'grass_bottom.png');
        this.load.image('grass_middle', 'grass_middle.png');

        this.load.image('overpass', 'overpass.png');

    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the Menu scene
        this.scene.start('Menu');
    }
}
