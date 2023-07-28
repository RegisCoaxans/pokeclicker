class MountBattleMap extends DungeonMap {
    board: KnockoutObservable<DungeonTile[][][]>;
    playerPosition: KnockoutObservable<Point>;
    playerMoved: KnockoutObservable<boolean>;
    totalFights: KnockoutObservable<number>;
    totalChests: KnockoutObservable<number>;
    floorSizes: number[];

    public moveToCoordinates(x: number, y: number, floor = undefined) {
        if (this.moveToTile(new Point(x, y, floor ?? this.playerPosition().floor))) {
            this.playerMoved(true);
        }
    }

    public moveUp() {
        this.moveToCoordinates(this.playerPosition().x, this.playerPosition().y - 1);
    }

    public moveRight() {
        this.moveToCoordinates(this.playerPosition().x + 1, this.playerPosition().y);
    }

    public moveDown() {
        this.moveToCoordinates(this.playerPosition().x, this.playerPosition().y + 1);
    }

    public moveLeft() {
        this.moveToCoordinates(this.playerPosition().x - 1, this.playerPosition().y);
    }

    public moveToTile(point: Point): boolean {
        if (this.hasAccessToTile(point)) {
            this.currentTile().hasPlayer = false;
            this.playerPosition(point);
            this.flash?.apply(this.board(), this.playerPosition());

            this.currentTile().hasPlayer = true;
            this.currentTile().isVisible = true;
            this.currentTile().isVisited = true;
            if (this.currentTile().type() == GameConstants.DungeonTile.enemy) {
                DungeonBattle.generateNewEnemy();
            }
            return true;
        }
        return false;
    }

    public showChestTiles(): void {
        for (let i = 0; i < this.board()[this.playerPosition().floor].length; i++) {
            for (let j = 0; j < this.board()[this.playerPosition().floor][i].length; j++) {
                if (this.board()[this.playerPosition().floor][i][j].type() == GameConstants.DungeonTile.chest) {
                    this.board()[this.playerPosition().floor][i][j].isVisible = true;
                }
            }
        }
    }

    public showAllTiles(): void {
        for (let i = 0; i < this.board()[this.playerPosition().floor].length; i++) {
            for (let j = 0; j < this.board()[this.playerPosition().floor][i].length; j++) {
                this.board()[this.playerPosition().floor][i][j].isVisible = true;
            }
        }
    }

    public currentTile(): DungeonTile {
        return this.board()[this.playerPosition().floor][this.playerPosition().y][this.playerPosition().x];
    }

    public nearbyTiles(point: Point): DungeonTile[] {
        const tiles = [];
        tiles.push(this.board()[point.floor][point.y - 1]?.[point.x]);
        tiles.push(this.board()[point.floor][point.y + 1]?.[point.x]);
        tiles.push(this.board()[point.floor][point.y]?.[point.x - 1]);
        tiles.push(this.board()[point.floor][point.y]?.[point.x + 1]);
        return tiles.filter(t => t);
    }

    public hasAccessToTile(point: Point): boolean {
        // If player fighting/catching they cannot move right now
        if (DungeonRunner.fighting() || DungeonBattle.catching()) {
            return false;
        }

        // If tile out of bounds, it's invalid
        if (point.x < 0 || point.x >= this.floorSizes[point.floor] || point.y < 0 || point.y >= this.floorSizes[point.floor]) {
            return false;
        }

        if (this.board()[point.floor][point.y]?.[point.x].isVisited) {
            return true;
        }

        //If any of the adjacent Tiles is visited, it's a valid Tile.
        return this.nearbyTiles(point).some(t => t.isVisited);
    }

    public generateMap(): DungeonTile[][][] {
        const map: DungeonTile[][][] = [];

        this.floorSizes.forEach((size, index) => {
            // Fill mapList with required Tiles
            const mapList: DungeonTile[] = [];

            // Boss or ladder
            if (index == this.floorSizes.length - 1) {
                mapList.push(new DungeonTile(GameConstants.DungeonTile.boss, null));
            } else {
                mapList.push(new DungeonTile(GameConstants.DungeonTile.ladder, null));
            }

            // Chests (leave 1 space for enemy and 1 space for empty tile)
            for (let i = 0; i < size && mapList.length < size * size - 2; i++) {
                mapList.push(new DungeonTile(GameConstants.DungeonTile.chest, this.generateChestLoot()));
            }

            // Enemy Pokemon (leave 1 space for empty tile)
            for (let i = 0; i < size * 2 + 3 && mapList.length < size * size - 1; i++) {
                mapList.push(new DungeonTile(GameConstants.DungeonTile.enemy, null));
            }

            // Fill with empty tiles
            for (let i: number = mapList.length; i < size * size; i++) {
                mapList.push(new DungeonTile(GameConstants.DungeonTile.empty, null));
            }

            // Shuffle the tiles randomly
            this.shuffle(mapList);
            // Make sure the player tile is empty
            while (mapList[mapList.length - Math.floor(size / 2) - 1].type() != GameConstants.DungeonTile.empty) {
                this.shuffle(mapList);
            }

            // Create a 2d array
            const floor: DungeonTile[][] = [];
            while (mapList.length) {
                floor.push(mapList.splice(0, size));
            }
            map.push(floor);
        });
        return map;
    }

    /**
     * Shuffles array in place.
     * @param {Array} a items The array containing the items.
     */
    public shuffle(a): void {
        let j, x, i;
        for (i = a.length; i; i--) {
            j = Rand.floor(i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
    }
}
