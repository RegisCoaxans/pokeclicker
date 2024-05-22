/// <reference path="../../declarations/GameHelper.d.ts" />

interface lineData {
    bombs: number,
    points: number,
}

class VoltorbFlipRunner {
    public static timeLeft: KnockoutObservable<number> = ko.observable(GameConstants.VOLTORB_FLIP_TIME);
    public static timeLeftPercentage: KnockoutObservable<number> = ko.observable(100);
    public static running: KnockoutObservable<boolean> = ko.observable(false);
    public static enemyCount: KnockoutObservable<number> = ko.observable(0);
    public static totalStack: KnockoutObservable<number> = ko.observable(1);
    public static currentStack: KnockoutObservable<number> = ko.observable(0);
    public static board: KnockoutObservable<FlipTile[][]> = ko.observable(null);
    public static battleEnvironment: GameConstants.Environment = 'PowerPlant';
    public static currentLevel: KnockoutObservable<number> = ko.observable(1);

    public static enter() {
        VoltorbFlipBattle.enemyPokemon(null);
        App.game.gameState = GameConstants.GameState.voltorbFlip;
    }

    public static exit() {
        MapHelper.moveToTown(player.town.name);
    }

    public static calculateFlipAttack(): number {
        return this.totalStack() + this.currentStack();
    }

    public static startGame() {
        this.timeLeft(GameConstants.VOLTORB_FLIP_TIME);
        this.timeLeftPercentage(100);
        VoltorbFlipBattle.generateNewEnemy();
        this.running(true);
        this.startLevel(1);
        this.totalStack(1);
        this.enemyCount(0);
    }

    public static startLevel(level: number) {
        this.currentStack(0);
        this.currentLevel(level);
        VoltorbFlipRunner.board(VoltorbFlipRunner.generateBoard(level));
        this.displayLevel();
    }

    public static displayLevel() {
        console.log('=====');
        this.board().forEach(r => {
            console.log(r.map(t => t.flipped() ? 'x' : t.value).join(' '));
        });
    }

    public static endGame() {
        if (this.running()) {
            this.running(false);
            VoltorbFlipBattle.enemyPokemon(null);
            VoltorbFlipRunner.board(null);
            if (this.timeLeft() < 0) {
                App.game.wallet.gainContestTokens(this.enemyCount(), true);
                Notifier.notify({
                    message: `Time is over! You received <img src="./assets/images/currency/contestToken.svg" height="24px"/> ${this.enemyCount()}.`,
                    strippedMessage: `Time is over! You received ${this.enemyCount()} Contest Tokens.`,
                    title: 'Voltorb Flip',
                    timeout: GameConstants.MINUTE,
                    type: NotificationConstants.NotificationOption.info,
                });
                // Statistics : total games played ?
            }
        }
    }

    public static tick() {
        if (!this.running()) {
            return;
        }
        if (this.timeLeft() == 0) {
            return this.endGame();
        }
        this.timeLeft(this.timeLeft() - GameConstants.VOLTORB_FLIP_TICK);
        this.timeLeftPercentage(Math.floor(this.timeLeft() / (GameConstants.VOLTORB_FLIP_TIME) * 100));
    }

    public static generateBoard(level: number): FlipTile[][] {
        let d1Board: any[] = [];
        const boardTiles = Rand.fromArray(VOLTORB_FLIP_LEVELS[Math.max(level - 1, VOLTORB_FLIP_LEVELS.length - 1)]);

        boardTiles.forEach((count, value) => {
            for (let index = 0; index < count; index++) {
                d1Board.push(value);
            }
        });
        d1Board = Rand.shuffleArray(d1Board).map((v, i) => new FlipTile(i, v));

        const d2Board = [];
        while(d1Board.length) {
            d2Board.push(d1Board.splice(0, 5));
        }
        return d2Board;
    }

    public static getRowData(row: number): lineData {
        const data = {bombs: 0, points: 0};
        VoltorbFlipRunner.board()[row].forEach(t => {
            if (!t.value) {
                data.bombs++;
            }
            data.points += t.value;
        });
        return data;
    }

    public static getColData(col: number): lineData {
        const data = {bombs: 0, points: 0};
        VoltorbFlipRunner.board().forEach(row => {
            const t = row[col];
            if (!t.value) {
                data.bombs++;
            }
            data.points += t.value;
        });
        return data;
    }

    public static getLevelMultiplier(level: number): number {
        if (level <= 8) {
            return 1;
        }
        const extra = level - 8;
        // Alternatively ×2 and ×3, starting with ×2 at level 9
        return 2 ** Math.ceil(extra / 2) * 3 ** Math.floor(extra / 2);
    }

    public static getXYPos(index: number): Point {
        return new Point(index % 5, Math.floor(index / 5));
    }

    public static timeLeftSeconds = ko.pureComputed(() => {
        return (Math.ceil(VoltorbFlipRunner.timeLeft() / 100) / 10).toFixed(1);
    });

    public static isBoardCleared() {
        return !this.board().flat().some(t => t.value > 1 && !t.flipped());
    }

    public static flipTile(tile: FlipTile) {
        if (tile.flipped()) {
            return;
        }
        const value = tile.flip();
        console.log(`Flipped ×${value}`);
        if (!value) {
            this.startLevel(this.currentLevel());
            Notifier.notify({
                message: `Level failed...`,
                title: 'Voltorb Flip',
                type: NotificationConstants.NotificationOption.danger,
            });
        } else {
            this.currentStack(Math.max(value * this.getLevelMultiplier(this.currentLevel()), this.currentStack() * value));
            if (this.isBoardCleared()) {
                GameHelper.incrementObservable(this.totalStack, this.currentStack());
                this.startLevel(this.currentLevel() + 1);
                Notifier.notify({
                    message: `Level ${this.currentLevel()} cleared !`,
                    title: 'Voltorb Flip',
                    type: NotificationConstants.NotificationOption.success,
                });
            }
        }
    }
}
// [VOLTORB, ×1, ×2, ×3]
const VOLTORB_FLIP_LEVELS = [
    [
        [6, 15, 3, 1],
        [6, 16, 0, 3],
        [6, 14, 5, 0],
        [6, 15, 2, 2],
        [6, 14, 4, 1],
    ],
    [
        [7, 14, 1, 3],
        [7, 12, 6, 0],
        [7, 13, 3, 2],
        [7, 14, 0, 4],
        [7, 12, 5, 1],
    ],
    [
        [8, 12, 2, 3],
        [8, 10, 7, 0],
        [8, 11, 4, 2],
        [8, 12, 1, 4],
        [8, 10, 6, 1],
    ],
    [
        [8, 11, 3, 3],
        [8, 12, 0, 5],
        [10, 7, 8, 0],
        [10, 8, 5, 2],
        [10, 9, 2, 4],
    ],
    [
        [10, 7, 7, 1],
        [10, 8, 4, 3],
        [10, 9, 1, 5],
        [10, 6, 9, 0],
        [10, 7, 6, 2],
    ],
    [
        [10, 8, 3, 4],
        [10, 9, 0, 6],
        [10, 6, 8, 1],
        [10, 7, 5, 3],
        [10, 8, 2, 5],
    ],
    [
        [10, 6, 7, 2],
        [10, 7, 4, 4],
        [13, 5, 1, 6],
        [13, 2, 9, 1],
        [10, 6, 6, 3],
    ],
    [
        [10, 8, 0, 7],
        [10, 5, 8, 2],
        [10, 6, 5, 4],
        [10, 7, 2, 6],
        [10, 5, 7, 3],
    ],
]
