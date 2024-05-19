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
        this.startLevel();
        this.totalStack(1);
        this.enemyCount(0);
    }

    public static startLevel() {
        // TODO: pass and set level number
        this.currentStack(0);
        VoltorbFlipRunner.board(VoltorbFlipRunner.generateBoard());
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
        if (this.timeLeft() < 0) {
            return this.endGame();
        }
        this.timeLeft(this.timeLeft() - GameConstants.VOLTORB_FLIP_TICK);
        this.timeLeftPercentage(Math.floor(this.timeLeft() / (GameConstants.VOLTORB_FLIP_TIME) * 100 * 2) / 2);
    }

    public static generateBoard(): FlipTile[][] {
        let d1Board: any[] = [];
        const boardTiles = [6, 15, 3, 1]; // TODO: randomly pick a distribution

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

    public static getXYPos(index: number): Point {
        return new Point(index % 5, Math.floor(index / 5));
    }

    public static timeLeftSeconds = ko.pureComputed(() => {
        return (Math.ceil(VoltorbFlipRunner.timeLeft() / 100) / 10).toFixed(1);
    });

    public static isBoardCleared() {
        return this.currentStack() === this.board().flat(1).reduce((s, t) => s * Math.max(1, t.value), 1);
    }

    public static flipTile(index: number) {
        const {x, y} = VoltorbFlipRunner.getXYPos(index);
        const value = VoltorbFlipRunner.board()[y][x].flip();
        if (!value) {
            this.startLevel();
            Notifier.notify({
                message: `Level failed !`,
                title: 'Voltorb Flip',
                type: NotificationConstants.NotificationOption.danger,
            });
        } else {
            this.currentStack(Math.max(value, this.currentStack() * value));
            if (this.isBoardCleared()) {
                GameHelper.incrementObservable(this.totalStack, this.currentStack());
                this.startLevel();
                Notifier.notify({
                    message: `Level cleared !`,
                    title: 'Voltorb Flip',
                    type: NotificationConstants.NotificationOption.success,
                });
            }
        }
    }
}
// [VOLTORB, ×2, ×3]
// ×1 are then computed
const LEVELS = [
    [
        [6, 3, 1],
        [6, 0, 3],
        [6, 5, 0],
        [6, 2, 2],
        [6, 4, 1],
    ],
    [
        [7, 1, 3],
        [],
        [],
        [],
        [],
    ],
    [
        [],
        [],
        [],
        [],
        [],
    ],
    [
        [],
        [],
        [],
        [],
        [],
    ],
    [
        [],
        [],
        [],
        [],
        [],
    ],
    [
        [],
        [],
        [],
        [],
        [],
    ],
    [
        [],
        [],
        [],
        [],
        [],
    ],
    [
        [],
        [],
        [],
        [],
        [],
    ],
]
