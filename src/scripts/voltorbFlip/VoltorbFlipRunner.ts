/// <reference path="../../declarations/GameHelper.d.ts" />
/// <reference path="../../declarations/enums/Badges.d.ts" />

class VoltorbFlipRunner {
    public static timeLeft: KnockoutObservable<number> = ko.observable(GameConstants.VOLTORB_FLIP_TIME);
    public static timeLeftPercentage: KnockoutObservable<number> = ko.observable(100);
    public static running: KnockoutObservable<boolean> = ko.observable(false);
    public static enemyCount: KnockoutObservable<number> = ko.observable(0);
    public static totalStack: KnockoutObservable<number> = ko.observable(0);
    public static currentStack: KnockoutObservable<number> = ko.observable(0);

    public static enter() {
        VoltorbFlipBattle.enemyPokemon(null);
        App.game.gameState = GameConstants.GameState.voltorbFlip;
    }

    public static startGame() {
        this.timeLeft(GameConstants.VOLTORB_FLIP_TIME);
        this.timeLeftPercentage(100);
        VoltorbFlipBattle.generateNewEnemy();
        this.currentStack(0);
        this.totalStack(0);
        this.enemyCount(0);
        VoltorbFlipBattle.generateNewEnemy();
        this.running(true);
    }

    public static calculateFlipAttack(): number {
        return 1 + this.totalStack() + this.currentStack();
    }

    public static tick() {
        if (!this.running()) {
            return;
        }
        if (this.timeLeft() < 0) {
            return this.endGame();
        }
        this.timeLeft(this.timeLeft() - GameConstants.VOLTORB_FLIP_TICK);
        this.timeLeftPercentage(Math.floor(this.timeLeft() / (GameConstants.VOLTORB_FLIP_TIME) * 100));
    }

    public static endGame() {
        if (this.running()) {
            this.running(false);
            VoltorbFlipBattle.enemyPokemon(null);
            // Statistics : total games played ?
        }
    }

    public static timeLeftSeconds = ko.pureComputed(() => {
        return (Math.ceil(VoltorbFlipRunner.timeLeft() / 100) / 10).toFixed(1);
    });
}
