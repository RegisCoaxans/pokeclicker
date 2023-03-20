/// <reference path="../../declarations/GameHelper.d.ts" />

class BattleFrontierRunner {
    public static timeLeft: KnockoutObservable<number> = ko.observable(GameConstants.GYM_TIME);
    public static timeLeftPercentage: KnockoutObservable<number> = ko.observable(100);
    static stage: KnockoutObservable<number> = ko.observable(1); // Start at stage 1
    public static checkpoint: KnockoutObservable<number> = ko.observable(1); // Start at stage 1
    public static highest: KnockoutObservable<number> = ko.observable(1);
	public static waypointUsed: KnockoutObservable<number> = ko.observable(1);
    public static availableWaypoint: KnockoutObservable<number>;
    public static hasWaypoint: KnockoutObservable<boolean>;

    public static counter = 0;
	public static tickCount = 0;
    public static started = ko.observable(false);

    constructor() {}

    public static initialize() {
        BattleFrontierRunner.availableWaypoint = ko.computed(() => {
            return BattleFrontierRunner.computeWaypoint(App.game.statistics.battleFrontierHighestStageCompleted());
        })
        BattleFrontierRunner.hasWaypoint = ko.computed(() => {
            return BattleFrontierRunner.availableWaypoint() > 1;
        })
    }

    public static tick() {
        if (!BattleFrontierRunner.started()) {
            return;
        }
		BattleFrontierRunner.tickCount++;
        if (BattleFrontierRunner.timeLeft() < 0) {
            BattleFrontierRunner.battleLost();
        }
        BattleFrontierRunner.timeLeft(BattleFrontierRunner.timeLeft() - GameConstants.GYM_TICK * 5);
        BattleFrontierRunner.timeLeftPercentage(Math.floor(BattleFrontierRunner.timeLeft() / GameConstants.GYM_TIME * 100));
    }

    public static async start(mode : GameConstants.BattleFrontierStartMode = GameConstants.BattleFrontierStartMode.None) {
        if (mode !== GameConstants.BattleFrontierStartMode.Checkpoint && BattleFrontierRunner.hasCheckpoint()) {
            if (!await Notifier.confirm({
                title: 'Restart Battle Frontier?',
                message: 'Current progress will be lost and you will restart from a different stage.',
                type: NotificationConstants.NotificationOption.warning,
                confirm: 'OK',
            })) {
                return;
            }
        }

        BattleFrontierRunner.started(true);
		switch(mode) {
			case GameConstants.BattleFrontierStartMode.Checkpoint :
				BattleFrontierRunner.stage(BattleFrontierRunner.checkpoint());
				break;
			case GameConstants.BattleFrontierStartMode.None :
				BattleFrontierRunner.stage(1);
				BattleFrontierRunner.waypointUsed(1);
				break;
			case GameConstants.BattleFrontierStartMode.Waypoint :
				BattleFrontierRunner.stage(BattleFrontierRunner.availableWaypoint());
				BattleFrontierRunner.waypointUsed(BattleFrontierRunner.availableWaypoint());
				break;
		}
        BattleFrontierRunner.highest(App.game.statistics.battleFrontierHighestStageCompleted());
        BattleFrontierBattle.pokemonIndex(0);
        BattleFrontierBattle.generateNewEnemy();
        BattleFrontierRunner.timeLeft(GameConstants.GYM_TIME);
        BattleFrontierRunner.timeLeftPercentage(100);
        App.game.gameState = GameConstants.GameState.battleFrontier;
    }

    public static nextStage() {
        // Gain any rewards we should have earned for defeating this stage
        BattleFrontierMilestones.gainReward(BattleFrontierRunner.stage());
        if (App.game.statistics.battleFrontierHighestStageCompleted() < BattleFrontierRunner.stage()) {
            // Update our highest stage
            App.game.statistics.battleFrontierHighestStageCompleted(BattleFrontierRunner.stage());
        }
        // Move on to the next stage
        GameHelper.incrementObservable(BattleFrontierRunner.stage);
        GameHelper.incrementObservable(App.game.statistics.battleFrontierTotalStagesCompleted);
        BattleFrontierRunner.timeLeft(GameConstants.GYM_TIME);
        BattleFrontierRunner.timeLeftPercentage(100);

        BattleFrontierRunner.checkpoint(BattleFrontierRunner.stage());
    }

    public static end() {
        BattleFrontierBattle.enemyPokemon(null);
        BattleFrontierRunner.stage(1);
        BattleFrontierRunner.started(false);
    }

    public static battleLost() {
        // Current stage - 1 as the player didn't beat the current stage
        const stageBeaten = BattleFrontierRunner.stage() - 1;
        // Give Battle Points and Money based on how far the user got
        const battleMultiplier = Math.max(stageBeaten / 100, 1);
        let battlePointsEarned = BattleFrontierRunner.battlePointEarnings();
        let moneyEarned = BattleFrontierRunner.battlePointEarnings() * 100;

        // Award battle points and dollars and retrieve their computed values
        battlePointsEarned = App.game.wallet.gainBattlePoints(battlePointsEarned).amount;
        moneyEarned = App.game.wallet.gainMoney(moneyEarned, true).amount;

        Notifier.notify({
            title: 'Battle Frontier',
            message: `You managed to beat stage ${stageBeaten.toLocaleString('en-US')}.\nYou received <img src="./assets/images/currency/battlePoint.svg" height="24px"/> ${battlePointsEarned.toLocaleString('en-US')}.\nYou received <img src="./assets/images/currency/money.svg" height="24px"/> ${moneyEarned.toLocaleString('en-US')}.`,
            strippedMessage: `You managed to beat stage ${stageBeaten.toLocaleString('en-US')}.\nYou received ${battlePointsEarned.toLocaleString('en-US')} Battle Points.\nYou received ${moneyEarned.toLocaleString('en-US')} Pokédollars.`,
            type: NotificationConstants.NotificationOption.success,
            setting: NotificationConstants.NotificationSetting.General.battle_frontier,
            sound: NotificationConstants.NotificationSound.General.battle_frontier,
            timeout: 30 * GameConstants.MINUTE,
        });
        App.game.logbook.newLog(
            LogBookTypes.FRONTIER,
            createLogContent.gainBattleFrontierPoints({
                stage: stageBeaten.toLocaleString('en-US'),
                points: battlePointsEarned.toLocaleString('en-US'),
            })
        );

        BattleFrontierRunner.checkpoint(1);

        BattleFrontierRunner.end();
    }
    public static battleQuit() {
        Notifier.confirm({
            title: 'Battle Frontier',
            message: 'Are you sure you want to leave?\n\nYou can always return later and start off where you left.',
            type: NotificationConstants.NotificationOption.danger,
            confirm: 'Leave',
        }).then(confirmed => {
            if (confirmed) {
                // Don't give any points, user quit the challenge
                Notifier.notify({
                    title: 'Battle Frontier',
                    message: `Checkpoint set for stage ${BattleFrontierRunner.stage()}.`,
                    type: NotificationConstants.NotificationOption.info,
                    timeout: 1 * GameConstants.MINUTE,
                });

                BattleFrontierRunner.end();
            }
        });
    }
    
    public static computeEarnings(beatenStage : number) {
        const multiplier = Math.max(1, beatenStage / 100);
        return multiplier * beatenStage;
    }
	
	public static computeWaypoint(stage : number) {
		const waypoint = 0.9 * stage;
		if (waypoint < 1000) {
			return 1;
		}
		return Math.floor(waypoint) + 1;
	}

    public static timeLeftSeconds = ko.pureComputed(() => {
        return (Math.ceil(BattleFrontierRunner.timeLeft() / 100) / 10).toFixed(1);
    })

    public static pokemonLeftImages = ko.pureComputed(() => {
        let str = '';
        for (let i = 0; i < 3; i++) {
            str += `<img class="pokeball-smallest" src="assets/images/pokeball/Pokeball.svg"${BattleFrontierBattle.pokemonIndex() > i ? ' style="filter: saturate(0);"' : ''}>`;
        }
        return str;
    })

    public static hasCheckpoint = ko.computed(() => {
        return BattleFrontierRunner.checkpoint() > 1;
    })

    public static battlePointEarnings = ko.computed(() => {
        const beatenStage = BattleFrontierRunner.stage() - 1;
		const waypointStage = BattleFrontierRunner.waypointUsed() - 1;
        return Math.floor(BattleFrontierRunner.computeEarnings(beatenStage)) - Math.floor(BattleFrontierRunner.computeEarnings(waypointStage));
    })
}
