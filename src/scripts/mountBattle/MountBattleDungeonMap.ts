class MountBattleDungeonMap extends DungeonMap {

    constructor(
    ) {
        // 10 floors of 5×5 rooms
        const size = new Array(10).fill(GameConstants.MIN_DUNGEON_SIZE);
        // No flash ?
        super(size, undefined, undefined);
    }

    public generateMap(): DungeonTile[][][] {
        const map: DungeonTile[][][] = [];
        let floorIndex: number;

        this.generateChestLoot = function(): {tier: LootTier, loot: Loot} {
            const simulatedClears = floorIndex * 55; // 0 at floor 1, 495 at floor 10;
            const dungeon = dungeonList['Mt. Battle Facility'];
            const loot = dungeon.getRandomLoot(dungeon.getRandomLootTier(simulatedClears));
            // Red Chest, Like BP. Plus we want to hide tier.
            return {tier: 'epic', loot};
        }

        this.floorSizes.forEach((size, index) => {
            // Fill mapList with required Tiles
            const mapList: DungeonTile[] = [];

            floorIndex = index;

            // Clear Floor
            mapList.push(new DungeonTile(GameConstants.DungeonTile.mtBattleNextFloor, null));

            // 5 Chests
            for (let i = 0; i < 5; i++) {
                mapList.push(new DungeonTile(GameConstants.DungeonTile.chest, this.generateChestLoot()));
            }

            // Trainers
            for (let i = 0; i < 10; i++) {
                mapList.push(new DungeonTile(GameConstants.DungeonTile.mtBattleTrainer, null));
            }

            // Fill with empty tiles (leave 1 space for entrance)
            for (let i: number = mapList.length; i < size * size - 1; i++) {
                mapList.push(new DungeonTile(GameConstants.DungeonTile.empty, null));
            }

            // Shuffle the tiles randomly
            this.shuffle(mapList);
            // Then place the entrance tile
            const entranceTile = new DungeonTile(GameConstants.DungeonTile.entrance, null);
            entranceTile.isVisible = true;
            entranceTile.isVisited = true;
            mapList.splice(mapList.length + 1 - Math.ceil(size / 2), 0, entranceTile);

            // Create a 2d array
            const floor: DungeonTile[][] = [];
            while (mapList.length) {
                floor.push(mapList.splice(0, size));
            }
            map.push(floor);
        });
        return map;
    }

}
