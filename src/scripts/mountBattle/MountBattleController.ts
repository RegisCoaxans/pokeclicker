class MountBattleController {
    public static defeatedTrainers: Array<number>;

    public static enter() {

    }

    public static start() {
        MountBattleController.defeatedTrainers = new Array(10).fill(0);

        const dungeon = dungeonList['Mt. Battle Facility'];
        DungeonRunner.dungeon = dungeon;
        DungeonRunner. regionalDifficulty = dungeon.regionalDifficulty;
        
        DungeonBattle.trainer(null);
        DungeonBattle.trainerPokemonIndex(0);
        DungeonBattle.enemyPokemon(null);
        DungeonRunner.timeBonus(FluteEffectRunner.getFluteMultiplier(GameConstants.FluteItemType.Time_Flute));
        DungeonRunner.timeLeft(GameConstants.DUNGEON_TIME * DungeonRunner.timeBonus());
        DungeonRunner.timeLeftPercentage(100);
        DungeonRunner.chestsOpened(0);
        DungeonRunner.encountersWon(0);

        
        DungeonRunner.map = new MountBattleDungeonMap();

        DungeonRunner.chestsOpenedPerFloor = new Array<number>(DungeonRunner.map.board().length).fill(0);
        DungeonRunner.currentTileType = ko.pureComputed(() => {
            return DungeonRunner.map.currentTile().type;
        });

        DungeonRunner.fightingLootEnemy = false;
        DungeonRunner.fightingBoss(false);
        DungeonRunner.defeatedBoss(null);
        DungeonRunner.dungeonFinished(false);
        App.game.gameState = GameConstants.GameState.dungeon;
    }
}
