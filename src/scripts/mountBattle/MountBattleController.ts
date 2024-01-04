///<reference path="../dungeons/DungeonTrainer.ts"/>
///<reference path="../gym/GymPokemon.ts"/>
///<reference path="../pokemons/PokemonFactory.ts"/>
///<reference path="../dungeons/DungeonRunner.ts"/>
///<reference path="../dungeons/DungeonBattle.ts"/>


class MountBattleController {
    public static encounteredTrainers: Array<number>;

    public static openModal() {
        $('#mtBattleModal').modal('show');
    }

    public static closeModal() {
        $('#mtBattleModal').modal('hide');
    }

    public static start() {
        MountBattleController.encounteredTrainers = new Array(GameConstants.MT_BATTLE_FLOORS).fill(0);

        const dungeon = dungeonList['Mt. Battle Trial'];
        DungeonRunner.dungeon = dungeon;
        DungeonRunner.regionalDifficulty = dungeon.regionalDifficulty;

        DungeonBattle.trainer(null);
        DungeonBattle.trainerPokemonIndex(0);
        DungeonBattle.enemyPokemon(null);
        DungeonRunner.timeBonus(FluteEffectRunner.getFluteMultiplier(GameConstants.FluteItemType.Time_Flute));
        DungeonRunner.timeLeft(GameConstants.DUNGEON_TIME * DungeonRunner.timeBonus());
        DungeonRunner.timeLeftPercentage(100);
        DungeonRunner.chestsOpened(0);
        DungeonRunner.encountersWon(0);
        DungeonRunner.fightingLootEnemy = false;
        DungeonRunner.fightingBoss(false);
        DungeonRunner.defeatedBoss(null);
        DungeonRunner.dungeonFinished(false);

        DungeonRunner.map = new MountBattleDungeonMap();

        DungeonRunner.chestsOpenedPerFloor = new Array<number>(DungeonRunner.map.board().length).fill(0);
        DungeonRunner.currentTileType = ko.pureComputed(() => {
            return DungeonRunner.map.currentTile().type;
        });

        App.game.gameState = GameConstants.GameState.dungeon;

        MountBattleController.closeModal();
    }

    public static generateTrainer(floor: number) {
        const trainer = new DungeonTrainer('Mt. Battle Trainer',
            new Array(3).fill(0)
                .map(_ => new GymPokemon(pokemonMap.randomRegion(player.highestRegion()).name, MountBattleController.generateHitpoints(floor), Math.min(100, MountBattleController.floorDifficulty(floor)))),
            { hideTrainer : true, ignoreChests: true, reward: () => MountBattleController.trainerDefeated(floor) });
        MountBattleController.encounteredTrainers[floor]++;
        DungeonBattle.trainer(trainer);
        DungeonBattle.generateTrainerPokemon();
        DungeonRunner.fighting(true);
    }

    public static trialDifficulty(): number {
        return App.game.statistics['mt.BattleTotalTrialsCompleted']() + 1;
    }

    public static trialBPReward(): number {
        const trialDifficulty = MountBattleController.trialDifficulty();
        return GameConstants.MT_BATTLE_FLOORS ** 2 * trialDifficulty;
    }

    public static floorDifficulty(floor: number): number {
        const trialDifficulty = MountBattleController.trialDifficulty();
        return 10 + Math.floor(trialDifficulty * 100 * floor / (GameConstants.MT_BATTLE_FLOORS - 1));
    }

    public static awardTrainerMoney(floor: number) {
        const money = PokemonFactory.routeMoney(MountBattleController.floorDifficulty(floor), GameConstants.Region.none);
        App.game.wallet.gainMoney(money, true);
    }

    public static generateHitpoints(floor: number): number {
        return PokemonFactory.routeHealth(MountBattleController.floorDifficulty(floor), GameConstants.Region.none);
    }

    public static trainerDefeated(floor: number) {
        MountBattleController.awardTrainerMoney(floor);
        GameHelper.incrementObservable(App.game.statistics['mt.BattleTotalTrainersDefeated']);
        
        if (MountBattleController.encounteredTrainers[floor] === GameConstants.MT_BATTLE_TRAINERS_PER_FLOOR) {
            // Floor cleared
            GameHelper.incrementObservable(App.game.statistics['mt.BattleTotalFloorsCleared']);
            // 1% of total on first floor, 19% on 10th floor
            const slice = ((floor + 1) ** 2 - floor ** 2) / GameConstants.MT_BATTLE_FLOORS ** 2;
            const battlePoints = MountBattleController.trialBPReward() * slice;
            App.game.wallet.gainBattlePoints(battlePoints, true);
            
            if (floor === GameConstants.MT_BATTLE_FLOORS - 1) {
                // Trial completed, pretend it was a boss
                DungeonRunner.fightingBoss(true);
                GameHelper.incrementObservable(App.game.statistics['mt.BattleTotalTrialsCompleted']);
            } else {
                // otherwise go to next
                DungeonRunner.nextFloor(GameConstants.MT_BATTLE_BONUS_TIME);
            }
        }
    }
}
