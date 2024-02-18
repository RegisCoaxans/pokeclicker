/// <reference path="../../declarations/GameHelper.d.ts" />
/// <reference path="../../declarations/enums/Badges.d.ts" />

class VoltorbFlipRunner {
    public static timeLeft: KnockoutObservable<number> = ko.observable(GameConstants.VOLTORB_FLIP_TIME);
    public static timeLeftPercentage: KnockoutObservable<number> = ko.observable(100);
    public static running: KnockoutObservable<boolean> = ko.observable(false);
    public static enemyCount: KnockoutObservable<number> = ko.observable(0);
    public static totalStack: KnockoutObservable<number> = ko.observable(1);
    public static currentStack: KnockoutObservable<number> = ko.observable(0);
    public static board: KnockoutObservable<FlipTile[][]> = ko.observable(null);

    public static enter() {
        VoltorbFlipBattle.enemyPokemon(null);
        App.game.gameState = GameConstants.GameState.voltorbFlip;
    }

    public static exit() {
        MapHelper.moveToTown(player.town().name);
    }

    public static calculateFlipAttack(): number {
        return this.totalStack() + this.currentStack();
    }

    public static startGame() {
        this.timeLeft(GameConstants.VOLTORB_FLIP_TIME);
        this.timeLeftPercentage(100);
        VoltorbFlipBattle.generateNewEnemy();
        this.currentStack(0);
        this.totalStack(1);
        this.enemyCount(0);
        VoltorbFlipRunner.board(VoltorbFlipRunner.generateBoard());
        this.running(true);
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
                    type: NotificationConstants.NotificationOption.success,
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
        this.timeLeftPercentage(Math.floor(this.timeLeft() / (GameConstants.VOLTORB_FLIP_TIME) * 100 * 5) / 5);
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

    public static getXYPos(index: number): Point {
        return new Point(index % 5, Math.floor(index / 5));
    }

    public static timeLeftSeconds = ko.pureComputed(() => {
        return (Math.ceil(VoltorbFlipRunner.timeLeft() / 100) / 10).toFixed(1);
    });
}
