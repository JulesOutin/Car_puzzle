export class Game extends Phaser.Scene {
    constructor() {
        super('Game');

        this.gridSize = 6; // 6x6 grid
        this.tileSize = 50; // Size of each grid cell
        this.cars = [];
        this.obstacles = [];
        this.selectedVehicle = null;
        this.level = 1;
        this.grid = [];
        this.isDebug = false;
        this.score = 0;
        this.moves = 0;
        this.maxLevel = 6;
    }

    init(data) {
        // Accept initial data when starting this scene (from Menu)
        if (data) {
            this.level = data.level || this.level;
            this.score = data.score || this.score;
            this.moves = data.moves || this.moves;
        }

        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        const boardSize = this.gridSize * this.tileSize;

        this.boardOffsetX = Math.floor((gameWidth - boardSize) / 2);
        this.boardOffsetY = Math.floor((gameHeight - boardSize) / 2);
    }

    create() {
        this.cameras.main.setBackgroundColor(0x365984);
        this.initGrid();
        this.createEnvironment();
        this.createLevel(this.level);

        // UI: score, level and moves
        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, { fontSize: '20px', color: '#ffffff' }).setDepth(1000);
        this.levelText = this.add.text(16, 40, `Level: ${this.level}`, { fontSize: '20px', color: '#ffffff' }).setDepth(1000);
        this.movesText = this.add.text(16, 64, `Moves: ${this.moves}`, { fontSize: '20px', color: '#ffffff' }).setDepth(1000);

        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);

        if (this.isDebug) {
            this.createVisualGrid();
        }
    }

    createParkingArea() {
        const boardSize = this.gridSize * this.tileSize;
        const padding = 30;

        const parkingArea = this.add.graphics();
        parkingArea.fillStyle(0x333333, 1);

        parkingArea.fillRoundedRect(
            this.boardOffsetX - padding,
            this.boardOffsetY - padding,
            boardSize + padding * 2,
            boardSize + padding * 2,
            8
        );

        parkingArea.lineStyle(4, 0x212020, 1);
        parkingArea.strokeRoundedRect(this.boardOffsetX - padding,
            this.boardOffsetY - padding,
            boardSize + padding * 2,
            boardSize + padding * 2,
            8
        );
    }

    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            const row = [];
            for (let x = 0; x < this.gridSize; x++) {
                row.push(null); // null means an empty cell
            }
            this.grid.push(row);
        }
    }

    createVisualGrid() {
        // Draw the grid lines for debugging
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xffffff, 0.3);

        // Draw horizontal lines
        for (let y = 0; y <= this.gridSize; y++) {
            graphics.moveTo(this.boardOffsetX, this.boardOffsetY + y * this.tileSize);
            graphics.lineTo(this.boardOffsetX + this.gridSize * this.tileSize, this.boardOffsetY + y * this.tileSize);
        }

        // Draw vertical lines
        for (let x = 0; x <= this.gridSize; x++) {
            graphics.moveTo(this.boardOffsetX + x * this.tileSize, this.boardOffsetY);
            graphics.lineTo(this.boardOffsetX + x * this.tileSize, this.boardOffsetY + this.gridSize * this.tileSize);
        }

        graphics.strokePath();

        // Add grid coordinates for debugging
        if (this.isDebug) {
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    // Place text in center of the grid cell for better visibility
                    this.add.text(
                        this.boardOffsetX + (x + 0.5) * this.tileSize,
                        this.boardOffsetY + (y + 0.5) * this.tileSize,
                        `${x},${y}`,
                        { fontSize: '12px', color: '#ffffff', alpha: 0.5 }
                    ).setOrigin(0.5);

                    // Draw cell boundaries more clearly
                    const rect = this.add.rectangle(
                        this.boardOffsetX + (x + 0.5) * this.tileSize,
                        this.boardOffsetY + (y + 0.5) * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                    rect.setStrokeStyle(1, 0xffffff, 0.2);
                }
            }
        }
    }

    createEnvironment() {
        this.createParkingArea();

        const overpassContainer = this.add.container(0, 65);
        for (let i = 0; i < 10; i++) {
            const overpass = this.add.image(0, 0, 'overpass');
            overpass.setScale(4);
            overpass.x = i * overpass.displayWidth;

            overpassContainer.add([overpass]);
        }

        const container = this.add.container(
            635,
            this.boardOffsetY - 70
        );

        const grass_top = this.add.image(0, 0, 'grass_top');
        grass_top.setScale(4);

        const midOffset = 4;
        const grass_middle1 = this.add.image(0, grass_top.y + grass_top.displayHeight, 'grass_middle');
        grass_middle1.setScale(4);

        const grass_middle2 = this.add.image(0, grass_middle1.y + grass_middle1.displayHeight - midOffset, 'grass_middle');
        grass_middle2.setScale(4);

        const grass_middle3 = this.add.image(0, grass_middle2.y + grass_middle2.displayHeight - midOffset, 'grass_middle');
        grass_middle3.setScale(4);

        const grass_bottom = this.add.image(0, grass_middle3.y + grass_middle3.displayHeight - midOffset, 'grass_bottom');
        grass_bottom.setScale(4);

        // Removed interactive obstacles (fire hydrant + particle effects)
        container.add([grass_top, grass_middle1, grass_middle2, grass_middle3, grass_bottom]);
        container.setRotation(Phaser.Math.DegToRad(90));
    }

    createObstacleAtCell(x, y) {
        // single-cell obstacle (uses fire_hydrant asset)
        if (x < 0 || y < 0 || x >= this.gridSize || y >= this.gridSize) return null;
        if (this.grid[y][x]) return null; // already occupied

        const pixelX = this.boardOffsetX + (x + 0.5) * this.tileSize;
        const pixelY = this.boardOffsetY + (y + 0.5) * this.tileSize;

        const obs = this.add.image(pixelX, pixelY, 'fire_hydrant');
        obs.setOrigin(0.5);
        obs.setScale(2);
        obs.setDepth(50);

        // mark grid as occupied by obstacle
        this.grid[y][x] = { obstacle: true, sprite: obs };
        this.obstacles.push(obs);
        return obs;
    }

    // Fill the remaining empty cells with the maximum number of cars possible.
    populateMaxCars() {
        const images = ['red_car', 'blue_car', 'yellow_car', 'striped_red_car', 'police_car', 'grey_car'];

        // helper to check fit
        const fitsAt = (x, y, dir, size) => {
            if (x < 0 || y < 0) return false;
            if (dir === 'horizontal') {
                if (x + size > this.gridSize) return false;
                for (let ix = x; ix < x + size; ix++) if (this.grid[y][ix]) return false;
            } else {
                if (y + size > this.gridSize) return false;
                for (let iy = y; iy < y + size; iy++) if (this.grid[iy][x]) return false;
            }
            return true;
        };

        const randImage = () => images[Math.floor(Math.random() * images.length)];

        // First ensure we have a target car somewhere; try row 2 preferred
        let hasTarget = this.cars.some(c => c.isTarget);
        if (!hasTarget) {
            for (let x = 0; x <= this.gridSize - 2; x++) {
                if (fitsAt(x, 2, 'horizontal', 2)) {
                    const cd = { x: x, y: 2, size: 2, direction: 'horizontal', image: randImage(), isTarget: true };
                    const placed = this.placeCarSafely(cd);
                    if (placed) this.createCar(placed);
                    hasTarget = true;
                    break;
                }
            }
        }

        // Greedy fill: prefer size 2 cars (max count), try horizontal then vertical
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x]) continue;

                // try horizontal size 2
                if (fitsAt(x, y, 'horizontal', 2)) {
                    const cd = { x, y, size: 2, direction: 'horizontal', image: randImage() };
                    const placed = this.placeCarSafely(cd);
                    if (placed) this.createCar(placed);
                    continue;
                }

                // try vertical size 2
                if (fitsAt(x, y, 'vertical', 2)) {
                    const cd = { x, y, size: 2, direction: 'vertical', image: randImage() };
                    const placed = this.placeCarSafely(cd);
                    if (placed) this.createCar(placed);
                    continue;
                }

                // try size 3 horizontal
                if (fitsAt(x, y, 'horizontal', 3)) {
                    const cd = { x, y, size: 3, direction: 'horizontal', image: randImage() };
                    const placed = this.placeCarSafely(cd);
                    if (placed) this.createCar(placed);
                    continue;
                }

                // try size 3 vertical
                if (fitsAt(x, y, 'vertical', 3)) {
                    const cd = { x, y, size: 3, direction: 'vertical', image: randImage() };
                    const placed = this.placeCarSafely(cd);
                    if (placed) this.createCar(placed);
                    continue;
                }
            }
        }
    }

    createLevel(level) {
        // Clear existing cars
        this.cars.forEach(car => car.destroy());
        this.cars = [];

        this.initGrid();

        // Define level data (car positions, orientations, and sizes)
        let levelData;

        switch (level) {
            case 1:
                levelData = this.getLevelOne();
                break;
            case 2:
                levelData = this.getLevelTwo();
                break;
            case 3:
                levelData = this.getLevelThree();
                break;
            case 4:
                levelData = this.getLevelFour();
                break;
            case 5:
                levelData = this.getLevelFive();
                break;
            case 6:
                levelData = this.getLevelSix();
                break;
            default:
                levelData = this.getLevelOne(); // Default to level 1
                break;
        }

        levelData.forEach(carData => {
            // Validate and try to place car; if placement collides, try to find a nearby free spot
            const placed = this.placeCarSafely(carData);
            if (placed) this.createCar(placed);
        });

        // After placing predefined cars, populate the rest of the board with the maximum number of cars
        this.populateMaxCars();

        // Update UI
        if (this.levelText) this.levelText.setText(`Level: ${this.level}`);
        if (this.movesText) this.movesText.setText(`Moves: ${this.moves}`);
    }

    placeCarSafely(carData) {
        // Check bounds first
        const fitsAt = (x, y, dir, size) => {
            if (x < 0 || y < 0) return false;
            if (dir === 'horizontal') {
                if (x + size > this.gridSize) return false;
                for (let ix = x; ix < x + size; ix++) {
                    if (this.grid[y][ix]) return false;
                }
            } else {
                if (y + size > this.gridSize) return false;
                for (let iy = y; iy < y + size; iy++) {
                    if (this.grid[iy][x]) return false;
                }
            }
            return true;
        };

        // Try original position first
        if (fitsAt(carData.x, carData.y, carData.direction, carData.size)) {
            return carData;
        }

        // Search for any fitting position on the board (scan rows then columns)
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (fitsAt(x, y, carData.direction, carData.size)) {
                    const clone = Object.assign({}, carData);
                    clone.x = x;
                    clone.y = y;
                    console.warn(`Placed car ${carData.image} from (${carData.x},${carData.y}) to (${x},${y}) to avoid collision`);
                    return clone;
                }
            }
        }

        // If we couldn't place the car, add an obstacle on any free cell (to block that spot)
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (!this.grid[y][x]) {
                    console.warn(`Could not place car ${carData.image}; placing obstacle at (${x},${y})`);
                    this.createObstacleAtCell(x, y);
                    return null;
                }
            }
        }

        // Board is completely full and no obstacle can be placed
        console.error(`Could not place car ${carData.image} of size ${carData.size} on the board; board full`);
        return null;
    }

    getLevelOne() {
        /* Define level 1 car configuration
        * Format: {x, y, size, direction, image}
        * x, y: grid coordinates (0-based)
        * size: number of cells the car occupies (2 or 3)
        * direction: 'horizontal' or 'vertical'
        * image: sprite key
        */
        return [
            { x: 0, y: 2, size: 2, direction: 'horizontal', image: 'red_car', isTarget: true },
            { x: 2, y: 0, size: 2, direction: 'vertical', image: 'blue_car' },
            { x: 2, y: 2, size: 2, direction: 'horizontal', image: 'striped_red_car' },
            { x: 3, y: 3, size: 2, direction: 'vertical', image: 'yellow_car' },
            { x: 4, y: 0, size: 2, direction: 'vertical', image: 'police_car' },
            { x: 4, y: 4, size: 2, direction: 'horizontal', image: 'red_car' },
            // additional cars
            { x: 1, y: 4, size: 2, direction: 'horizontal', image: 'grey_car' },
            { x: 5, y: 2, size: 2, direction: 'vertical', image: 'blue_car' },
            { x: 3, y: 1, size: 2, direction: 'horizontal', image: 'yellow_car' }
        ];
    }

    getLevelTwo() {
        return [
            { x: 1, y: 1, size: 2, direction: 'horizontal', image: 'blue_car' },
            { x: 0, y: 3, size: 3, direction: 'vertical', image: 'yellow_car' },
            { x: 2, y: 2, size: 2, direction: 'horizontal', image: 'striped_red_car' },
            { x: 4, y: 0, size: 2, direction: 'vertical', image: 'police_car' },
            { x: 0, y: 2, size: 2, direction: 'horizontal', image: 'red_car', isTarget: true },
            // additional cars
            { x: 3, y: 4, size: 2, direction: 'horizontal', image: 'red_car' },
            { x: 5, y: 1, size: 2, direction: 'vertical', image: 'police_car' }
        ];
    }

    getLevelThree() {
        return [
            // Target near the left so exit to the right requires clearing path
            { x: 0, y: 2, size: 2, direction: 'horizontal', image: 'blue_car', isTarget: true },
            { x: 3, y: 0, size: 3, direction: 'vertical', image: 'police_car' },
            { x: 1, y: 0, size: 2, direction: 'vertical', image: 'red_car' },
            { x: 2, y: 4, size: 2, direction: 'horizontal', image: 'striped_red_car' },
            { x: 4, y: 3, size: 2, direction: 'horizontal', image: 'yellow_car' },
            { x: 0, y: 4, size: 2, direction: 'horizontal', image: 'red_car' },
            // more cars for challenge
            { x: 4, y: 0, size: 2, direction: 'vertical', image: 'grey_car' },
            { x: 5, y: 3, size: 2, direction: 'vertical', image: 'police_car' },
            { x: 2, y: 1, size: 2, direction: 'horizontal', image: 'yellow_car' }
        ];
    }

    getLevelFour() {
        return [
            { x: 0, y: 2, size: 2, direction: 'horizontal', image: 'red_car', isTarget: true },
            { x: 2, y: 0, size: 3, direction: 'vertical', image: 'police_car' },
            { x: 1, y: 3, size: 2, direction: 'horizontal', image: 'blue_car' },
            { x: 4, y: 1, size: 2, direction: 'vertical', image: 'yellow_car' },
            { x: 3, y: 4, size: 2, direction: 'horizontal', image: 'grey_car' }
        ];
    }

    getLevelFive() {
        return [
            { x: 1, y: 2, size: 2, direction: 'horizontal', image: 'striped_red_car', isTarget: true },
            { x: 0, y: 0, size: 3, direction: 'vertical', image: 'police_car' },
            { x: 3, y: 0, size: 2, direction: 'vertical', image: 'blue_car' },
            { x: 4, y: 3, size: 2, direction: 'horizontal', image: 'red_car' },
            { x: 5, y: 1, size: 2, direction: 'vertical', image: 'grey_car' }
        ];
    }

    getLevelSix() {
        return [
            { x: 0, y: 1, size: 2, direction: 'vertical', image: 'yellow_car' },
            { x: 2, y: 1, size: 2, direction: 'horizontal', image: 'red_car', isTarget: true },
            { x: 4, y: 0, size: 3, direction: 'vertical', image: 'police_car' },
            { x: 0, y: 4, size: 2, direction: 'horizontal', image: 'blue_car' },
            { x: 3, y: 3, size: 2, direction: 'horizontal', image: 'striped_red_car' }
        ];
    }

    createCar(carData) {
        let pixelX, pixelY;

        if (carData.direction === 'horizontal') {
            // For horizontal cars, center X is halfway through its occupied cells
            pixelX = this.boardOffsetX + (carData.x + carData.size / 2) * this.tileSize;
            // Y position is the center of the row
            pixelY = this.boardOffsetY + (carData.y + 0.5) * this.tileSize;
        } else { // vertical
            // For vertical cars, center Y is halfway through its occupied cells
            pixelY = this.boardOffsetY + (carData.y + carData.size / 2) * this.tileSize;
            // X position is the center of the column
            pixelX = this.boardOffsetX + (carData.x + 0.5) * this.tileSize;
        }

        const car = this.add.image(pixelX, pixelY, carData.image);
        car.setInteractive();
        // Use a stable base scale so pointer effects don't accumulate
        const baseScale = 3;
        car.baseScale = baseScale;
        car.setScale(baseScale);
        car._scaleTween = null;

        // Set car rotation based on direction
        if (carData.direction === 'horizontal') {
            car.setRotation(Math.PI / 2); // 90 degrees (car faces right)
        } else {
            car.setRotation(0); // 0 degrees (car faces up)
        }

        car.gridX = carData.x;
        car.gridY = carData.y;
        car.size = carData.size;
        car.direction = carData.direction;
        car.isTarget = carData.isTarget || false;
        car.setOrigin(0.5, 0.5);

        this.cars.push(car);

        this.updateGridOccupancy(car);

        if (this.isDebug) {
            console.log(`Created car at grid (${car.gridX}, ${car.gridY}), size: ${car.size}, direction: ${car.direction}, pixel pos: (${pixelX}, ${pixelY})`);

            // Visual debug helper - show car center and occupied cells
            const centerMarker = this.add.circle(pixelX, pixelY, 3, 0xff0000);
            centerMarker.setDepth(100);

            // Highlight occupied cells
            if (car.direction === 'horizontal') {
                for (let x = car.gridX; x < car.gridX + car.size; x++) {
                    const cellHighlight = this.add.rectangle(
                        this.boardOffsetX + (x + 0.5) * this.tileSize,
                        this.boardOffsetY + (car.gridY + 0.5) * this.tileSize,
                        this.tileSize * 0.9,
                        this.tileSize * 0.9,
                        0xff0000,
                        0.1
                    );
                    cellHighlight.setDepth(10);
                }
            } else {
                for (let y = car.gridY; y < car.gridY + car.size; y++) {
                    const cellHighlight = this.add.rectangle(
                        this.boardOffsetX + (car.gridX + 0.5) * this.tileSize,
                        this.boardOffsetY + (y + 0.5) * this.tileSize,
                        this.tileSize * 0.9,
                        this.tileSize * 0.9,
                        0xff0000,
                        0.1
                    );
                    cellHighlight.setDepth(10);
                }
            }
        }
    }

    updateGridOccupancy(car, clear = false) {
        if (car.direction === 'horizontal') {
            for (let x = car.gridX; x < car.gridX + car.size; x++) {
                this.grid[car.gridY][x] = clear ? null : car;
            }
        } else { // vertical
            for (let y = car.gridY; y < car.gridY + car.size; y++) {
                this.grid[y][car.gridX] = clear ? null : car;
            }
        }
    }

    onPointerDown(pointer) {
        let clickedCar = null;

        if (!clickedCar) {
            clickedCar = this.findClickedCarInGrid(pointer);
        }

        if (this.isDebug) {
            console.log("Clicked car:", clickedCar ?
                `${clickedCar.texture.key} at (${clickedCar.gridX},${clickedCar.gridY})` :
                "null");
        }

        if (clickedCar) {
            this.selectedVehicle = clickedCar;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;

            // Prevent stacking tweens: stop any existing scale tween and reset
            if (clickedCar._scaleTween) {
                clickedCar._scaleTween.stop();
                clickedCar._scaleTween = null;
                clickedCar.setScale(clickedCar.baseScale);
            }

            clickedCar._scaleTween = this.tweens.add({
                targets: clickedCar,
                scaleX: clickedCar.baseScale * 1.05,
                scaleY: clickedCar.baseScale * 1.05,
                duration: 100,
                yoyo: true,
                ease: 'Sine.Out',
                onComplete: () => {
                    if (clickedCar && clickedCar.setScale) clickedCar.setScale(clickedCar.baseScale);
                    clickedCar._scaleTween = null;
                }
            });
        }
    }

    findClickedCarInGrid(pointer) {
        // Convert pointer position to grid coordinates
        const gridX = Math.floor((pointer.x - this.boardOffsetX) / this.tileSize);
        const gridY = Math.floor((pointer.y - this.boardOffsetY) / this.tileSize);

        // Check if coordinates are within grid
        if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
            return this.grid[gridY][gridX];
        }

        return null;
    }

    onPointerMove(pointer) {
        if (!this.selectedVehicle) return;

        const dragX = pointer.x - this.dragStartX;
        const dragY = pointer.y - this.dragStartY;
        // Compute how many cells the drag corresponds to (integer)
        if (this.selectedVehicle.direction === 'horizontal') {
            const cells = Math.trunc(dragX / this.tileSize);
            if (cells !== 0) {
                this.tryMoveSelectedCar(cells, 0);
                // allow accumulating further drag after moving
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        } else { // vertical
            const cells = Math.trunc(dragY / this.tileSize);
            if (cells !== 0) {
                this.tryMoveSelectedCar(0, cells);
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        }
    }

    onPointerUp(pointer) {
        if (!this.selectedVehicle) return;

        this.checkCarShouldExit(this.selectedVehicle);

        this.selectedVehicle = null;
    }

    tryMoveSelectedCar(deltaX, deltaY) {
        const car = this.selectedVehicle;
        if (!car) return;

        // We allow multi-cell moves: move step by step until blocked or requested distance reached
        let moved = 0;

        if (deltaX !== 0) {
            const step = Math.sign(deltaX);
            for (let i = 0; i < Math.abs(deltaX); i++) {
                const nx = car.gridX + step;
                if (!this.isValidMove(car, nx, car.gridY)) break;
                // apply single step
                this.updateGridOccupancy(car, true);
                car.gridX = nx;
                this.updateGridOccupancy(car);
                moved += step;
            }
            car.lastMoveDirection = { x: Math.sign(moved) || 0, y: 0 };
        } else if (deltaY !== 0) {
            const step = Math.sign(deltaY);
            for (let i = 0; i < Math.abs(deltaY); i++) {
                const ny = car.gridY + step;
                if (!this.isValidMove(car, car.gridX, ny)) break;
                this.updateGridOccupancy(car, true);
                car.gridY = ny;
                this.updateGridOccupancy(car);
                moved += step;
            }
            car.lastMoveDirection = { x: 0, y: Math.sign(moved) || 0 };
        }

        if (moved !== 0) {
            // Compute final pixel position
            let newPixelX, newPixelY;
            if (car.direction === 'horizontal') {
                newPixelX = this.boardOffsetX + (car.gridX + car.size / 2) * this.tileSize;
                newPixelY = this.boardOffsetY + (car.gridY + 0.5) * this.tileSize;
            } else {
                newPixelX = this.boardOffsetX + (car.gridX + 0.5) * this.tileSize;
                newPixelY = this.boardOffsetY + (car.gridY + car.size / 2) * this.tileSize;
            }

            this.tweens.add({
                targets: car,
                x: newPixelX,
                y: newPixelY,
                duration: 120 + Math.abs(moved) * 40,
                ease: 'Power2'
            });

            // Count the move as number of cells moved (absolute)
            this.moves += Math.abs(moved);
            this.score = Math.max(0, this.score - Math.abs(moved));
            if (this.movesText) this.movesText.setText(`Moves: ${this.moves}`);
            if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);

            if (this.isDebug) this.debugLogGridState();
        }
    }

    isValidMove(car, newGridX, newGridY) {
        // Check if new position is within bounds
        if (newGridX < 0 || newGridY < 0) return false;

        if (car.direction === 'horizontal') {
            // Check if rightmost position is within bounds
            if (newGridX + car.size > this.gridSize) return false;

            // Check if cells are occupied
            for (let x = newGridX; x < newGridX + car.size; x++) {
                if (this.grid[newGridY][x] && this.grid[newGridY][x] !== car) {
                    return false;
                }
            }
        } else { // vertical
            // Check if bottom position is within bounds
            if (newGridY + car.size > this.gridSize) return false;

            // Check if cells are occupied
            for (let y = newGridY; y < newGridY + car.size; y++) {
                if (this.grid[y][newGridX] && this.grid[y][newGridX] !== car) {
                    return false;
                }
            }
        }

        return true;
    }

    checkCarShouldExit(car) {
        // Only handle exit if we have a last move direction
        if (!car.lastMoveDirection) return;

        const { x: deltaX, y: deltaY } = car.lastMoveDirection;

        // Check if car can exit based on its position and last move direction
        if (car.direction === 'horizontal') {
            // Check if moving right and at/near right edge
            if (deltaX > 0 && car.gridX + car.size === this.gridSize) {
                this.handleCarExit(car, { x: 1, y: 0 });
                return true;
            }
            // Check if moving left and at/near left edge
            else if (deltaX < 0 && car.gridX === 0) {
                this.handleCarExit(car, { x: -1, y: 0 });
                return true;
            }
        } else { // vertical
            // Check if moving down and at/near bottom edge
            if (deltaY > 0 && car.gridY + car.size === this.gridSize) {
                this.handleCarExit(car, { x: 0, y: 1 });
                return true;
            }
            // Check if moving up and at/near top edge
            else if (deltaY < 0 && car.gridY === 0) {
                this.handleCarExit(car, { x: 0, y: -1 });
                return true;
            }
        }

        // Special case for target car exiting through designated exit
        if (car.isTarget && this.isCarAtExit(car)) {
            this.handleCarExit(car, { x: 1, y: 0 }); // Target car always exits to the right
            return true;
        }

        return false;
    }

    isCarAtExit(car) {
        // Special exit condition for target car (usually middle-right exit)
        if (car.isTarget && car.direction === 'horizontal') {
            return car.gridX + car.size === this.gridSize && car.gridY === 2; // Exit at position (6,2)
        }
        return false;
    }

    handleCarExit(car, exitDirection = { x: 0, y: 0 }) {
        this.updateGridOccupancy(car, true);

        let exitX = car.x;
        let exitY = car.y;

        if (exitDirection.x !== 0) {
            exitX += exitDirection.x * this.tileSize * 3; // Move 3 tiles beyond edge
        }
        if (exitDirection.y !== 0) {
            exitY += exitDirection.y * this.tileSize * 3; // Move 3 tiles beyond edge
        }

        this.tweens.add({
            targets: car,
            x: exitX,
            y: exitY,
            alpha: 0,
            duration: 500,
            ease: 'Sine.Out',
            onComplete: () => {
                this.cars = this.cars.filter(c => c !== car);
                // Reward points when a car exits
                if (car.isTarget) {
                    this.score += 100 * this.level;
                } else {
                    this.score += 20;
                }
                if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);

                // Save progress whenever score changes
                try { this.saveProgress(); } catch (e) { /* ignore storage errors */ }

                car.destroy();

                this.checkLevelComplete();
            }
        });
    }

    checkLevelComplete() {
        if (this.cars.length === 0) {
            this.showLevelCompleteMessage();
        }
    }
    showLevelCompleteMessage() {
        const overlay = this.add.rectangle(this.sys.game.config.width / 2, this.sys.game.config.height / 2, this.sys.game.config.width, this.sys.game.config.height, 0x000000, 0.5);
        overlay.setOrigin(0.5);

        const isLast = this.level >= this.maxLevel;

        const text = isLast ? 'Game Complete!' : `Level ${this.level} Complete!`;
        const sub = isLast ? `Final Score: ${this.score}` : `Score: ${this.score}`;

        const levelMessage = this.add.container(this.sys.game.config.width / 2, this.sys.game.config.height / 2);
        levelMessage.setDepth(2001);
        overlay.setDepth(2000);

        const message = this.add.text(0, -40, text, {
            fontFamily: 'Arial',
            fontSize: 48,
            color: '#ffffff'
        }).setOrigin(0.5);

        const subMessage = this.add.text(0, -4, sub, {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Buttons: use rectangles as clickable backgrounds + text on top
        const buttonsY = 40;
        const btnW = 140;
        const btnH = 40;

        const makeButton = (x, label, onClick) => {
            const bg = this.add.rectangle(x, buttonsY, btnW, btnH, 0xffffff).setStrokeStyle(2, 0x000000).setOrigin(0.5).setInteractive({ useHandCursor: true });
            const txt = this.add.text(x, buttonsY, label, { fontFamily: 'Arial', fontSize: 18, color: '#000000' }).setOrigin(0.5);
            bg.on('pointerdown', onClick);
            // hover effects
            bg.on('pointerover', () => bg.setFillStyle(0xeeeeee));
            bg.on('pointerout', () => bg.setFillStyle(0xffffff));
            return [bg, txt];
        };

        const [replayBg, replayTxt] = makeButton(-160, 'Rejouer', () => {
            overlay.destroy();
            levelMessage.destroy();
            this.moves = 0;
            if (this.movesText) this.movesText.setText(`Moves: ${this.moves}`);
            this.createLevel(this.level);
        });

        const [nextBg, nextTxt] = makeButton(0, isLast ? 'Menu' : 'Niveau suivant', () => {
            overlay.destroy();
            levelMessage.destroy();
            if (!isLast) {
                this.level = Math.min(this.maxLevel, this.level + 1);
                this.moves = 0;
                if (this.movesText) this.movesText.setText(`Moves: ${this.moves}`);
                // save progress before starting next level
                try { this.saveProgress(); } catch (e) { }
                this.createLevel(this.level);
            } else {
                this.restartGame();
            }
        });

        const [menuBg, menuTxt] = makeButton(160, 'Menu', () => {
            overlay.destroy();
            levelMessage.destroy();
            // Save progress and go to menu
            try { this.saveProgress(); } catch (e) { }
            this.scene.start('Menu');
        });

        levelMessage.add([message, subMessage, replayBg, replayTxt, nextBg, nextTxt, menuBg, menuTxt]);

        this.tweens.add({
            targets: levelMessage,
            scale: { from: 0.5, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.Out'
        });
    }

    saveProgress() {
        try {
            const save = { level: this.level, score: this.score, moves: this.moves };
            localStorage.setItem('game_save', JSON.stringify(save));
        } catch (e) { /* ignore */ }
    }

    clearProgress() {
        try { localStorage.removeItem('game_save'); } catch (e) { }
    }
}