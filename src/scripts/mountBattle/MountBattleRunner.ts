/// <reference path="../../declarations/GameHelper.d.ts" />

class MountBattleRunner {

    public static timeLeft: KnockoutObservable<number> = ko.observable(GameConstants.DUNGEON_TIME);
    public static timeLeftPercentage: KnockoutObservable<number> = ko.observable(100);

    public static fighting: KnockoutObservable<boolean> = ko.observable(false);
    public static map: DungeonMap;
    public static chestsOpened: KnockoutObservable<number> = ko.observable(0);
    public static currentTileType;
    public static encountersWon: KnockoutObservable<number> = ko.observable(0);
    public static dungeonFinished: KnockoutObservable<boolean> = ko.observable(false);
    public static stage: KnockoutObservable<number> = ko.observable(1);
    public static continuousInteractionInput = false;
    public static flash = DungeonFlash.tiers[0];
    public static generateChestLoot = () => {
        return {tier : null, loot : null};
    }

    public static start() {
        // Reset any trainers/pokemon if there was one previously
        /* MountBattleBattle.trainer(null);
        MountBattleBattle.trainerPokemonIndex(0);
        MountBattleBattle.enemyPokemon(null); */
        MountBattleRunner.timeLeft(GameConstants.DUNGEON_TIME);

        MountBattleRunner.timeLeftPercentage(100);
        
        MountBattleRunner.map = new DungeonMap(5, MountBattleRunner.generateChestLoot, MountBattleRunner.flash);

        MountBattleRunner.chestsOpened(0);
        MountBattleRunner.encountersWon(0);
        MountBattleRunner.currentTileType = ko.pureComputed(() => {
            return MountBattleRunner.map.currentTile().type;
        });
        MountBattleRunner.dungeonFinished(false);
        App.game.gameState = GameConstants.GameState.dungeon;
    }

    public static tick() {
        if (MountBattleRunner.timeLeft() <= 0) {
            // Run lost.
        }
        if (MountBattleRunner.map.playerMoved()) {
            MountBattleRunner.timeLeft(MountBattleRunner.timeLeft() - GameConstants.DUNGEON_TICK);
            MountBattleRunner.timeLeftPercentage(Math.floor(MountBattleRunner.timeLeft() / GameConstants.DUNGEON_TIME * 100));
            if (MountBattleRunner.continuousInteractionInput) {
                MountBattleRunner.handleInteraction(GameConstants.DungeonInteractionSource.HeldKeybind);
            }
        }
    }

    /**
     * Handles the interaction event in the dungeon view and from keybinds
     */
    public static handleInteraction(source: GameConstants.DungeonInteractionSource = GameConstants.DungeonInteractionSource.Click) {
        if (MountBattleRunner.fighting() && source === GameConstants.DungeonInteractionSource.Click) {
            // MountBattleBattle.clickAttack();
        } else if (MountBattleRunner.map.currentTile().type() === GameConstants.DungeonTile.entrance && source !== GameConstants.DungeonInteractionSource.HeldKeybind) {
            MountBattleRunner.leave();
        } else if (MountBattleRunner.map.currentTile().type() === GameConstants.DungeonTile.chest) {
            MountBattleRunner.openChest();
        }
    }

    public static openChest() {
        const tile = MountBattleRunner.map.currentTile();
        if (tile.type() !== GameConstants.DungeonTile.chest) {
            return;
        }

        GameHelper.incrementObservable(MountBattleRunner.chestsOpened);

        MountBattleRunner.map.currentTile().type(GameConstants.DungeonTile.empty);
        MountBattleRunner.map.currentTile().calculateCssClass();
    }

    public static nextFloor() {
        MountBattleRunner.map.moveToCoordinates(
            Math.floor(MountBattleRunner.map.floorSizes[MountBattleRunner.map.playerPosition().floor + 1] / 2),
            MountBattleRunner.map.floorSizes[MountBattleRunner.map.playerPosition().floor + 1] - 1,
            MountBattleRunner.map.playerPosition().floor + 1
        );
        MountBattleRunner.map.playerPosition.notifySubscribers();
        MountBattleRunner.timeLeft(MountBattleRunner.timeLeft() + GameConstants.DUNGEON_LADDER_BONUS);
        MountBattleRunner.map.playerMoved(false);
    }

    public static async leave(shouldConfirm = Settings.getSetting('confirmLeaveDungeon').observableValue()): Promise<void> {
        if (MountBattleRunner.map.currentTile().type() !== GameConstants.DungeonTile.entrance || MountBattleRunner.dungeonFinished() || !MountBattleRunner.map.playerMoved()) {
            return;
        }

        if (!shouldConfirm || await Notifier.confirm({
            title: 'Dungeon',
            message: 'Leave the Mt. Battle ?\n\nCurrent progress will be lost.',
            type: NotificationConstants.NotificationOption.warning,
            confirm: 'Leave',
            timeout: 1 * GameConstants.MINUTE,
        })) {
            MountBattleRunner.dungeonFinished(true);
            MountBattleRunner.fighting(false);
        }
    }

    private static dungeonLost() {
        if (!MountBattleRunner.dungeonFinished()) {
            MountBattleRunner.dungeonFinished(true);
            MountBattleRunner.fighting(false);
            MapHelper.moveToTown(MountBattleRunner.dungeon.name);
            Notifier.notify({
                message: 'You could not complete the dungeon in time.',
                type: NotificationConstants.NotificationOption.danger,
            });
        }
    }

    public static dungeonWon() {
        if (!MountBattleRunner.dungeonFinished()) {
            MountBattleRunner.dungeonFinished(true);
            if (!App.game.statistics.dungeonsCleared[GameConstants.getDungeonIndex(MountBattleRunner.dungeon.name)]()) {
                MountBattleRunner.dungeon.rewardFunction();
            }
            GameHelper.incrementObservable(App.game.statistics.dungeonsCleared[GameConstants.getDungeonIndex(MountBattleRunner.dungeon.name)]);
            MapHelper.moveToTown(MountBattleRunner.dungeon.name);
            Notifier.notify({
                message: 'You have successfully completed the dungeon.',
                type: NotificationConstants.NotificationOption.success,
                setting: NotificationConstants.NotificationSetting.Dungeons.dungeon_complete,
            });
        }
    }

    public static timeLeftSeconds = ko.pureComputed(() => {
        return (Math.ceil(MountBattleRunner.timeLeft() / 100) / 10).toFixed(1);
    })

    public static getFlash(dungeonName): DungeonFlash | undefined {
        const clears = App.game.statistics.dungeonsCleared[GameConstants.getDungeonIndex(dungeonName)]();

        const config = [
            { flash: DungeonFlash.tiers[0], clearsNeeded: 100 },
            { flash: DungeonFlash.tiers[1], clearsNeeded: 250 },
            { flash: DungeonFlash.tiers[2], clearsNeeded: 400 },
        ].reverse();

        // findIndex, so we can get next tier when light ball is implemented
        const index = config.findIndex((tier) => tier.clearsNeeded <= clears);
        return config[index]?.flash;
    }
}
