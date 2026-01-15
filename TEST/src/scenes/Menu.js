export class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;

        // Background
        this.add.rectangle(w/2, h/2, w, h, 0x365984);

        // Title
        this.add.text(w/2, 80, 'Parking Puzzle', { fontFamily: 'Arial', fontSize: 48, color: '#ffffff' }).setOrigin(0.5);

        // Load save if present
        const saveRaw = localStorage.getItem('game_save');
        let save = null;
        if (saveRaw) {
            try { save = JSON.parse(saveRaw); } catch(e) { save = null; }
        }

        const infoY = 150;
        if (save) {
            this.add.text(w/2, infoY, `Niveau sauvegardé: ${save.level}  Score: ${save.score}`, { fontSize: 20, color: '#ffffff' }).setOrigin(0.5);
        } else {
            this.add.text(w/2, infoY, 'Aucune sauvegarde trouvée', { fontSize: 20, color: '#ffffff' }).setOrigin(0.5);
        }

        // Buttons
        const makeButton = (y, label, cb) => {
            const bg = this.add.rectangle(w/2, y, 220, 48, 0xffffff).setOrigin(0.5).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
            const txt = this.add.text(w/2, y, label, { fontSize: 20, color: '#000000' }).setOrigin(0.5);
            bg.on('pointerdown', cb);
            bg.on('pointerover', () => bg.setFillStyle(0xeeeeee));
            bg.on('pointerout', () => bg.setFillStyle(0xffffff));
            return { bg, txt };
        };

        makeButton(240, 'Jouer (Nouveau)', () => {
            // clear save and start fresh
            localStorage.removeItem('game_save');
            this.scene.start('Game', { level: 1, score: 0, moves: 0 });
        });

        if (save) {
            makeButton(310, 'Continuer', () => {
                this.scene.start('Game', { level: save.level || 1, score: save.score || 0, moves: save.moves || 0 });
            });
        }

        makeButton(380, 'Réinitialiser sauvegarde', () => {
            localStorage.removeItem('game_save');
            this.scene.restart();
        });
    }
}
