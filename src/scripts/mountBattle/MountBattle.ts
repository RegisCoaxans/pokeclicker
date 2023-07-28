class MountBattle implements Feature {
    name = 'MountBattle';
    saveKey = 'mountBattle';

    defaults = {};

    constructor() {}

    initialize(): void {}

    update(delta: number): void {}

    canAccess(): boolean {
        return true;
    }

    public enter(): void {
        BattleFrontierBattle.enemyPokemon(null);
        App.game.gameState = GameConstants.GameState.mountBattle;
    }

    public start(stage: number): void {
        BattleFrontierRunner.start(!!stage);
    }

    public leave(): void {
        // Put the user back in the town
        App.game.gameState = GameConstants.GameState.town;
    }

    toJSON(): Record<string, any> {
        return {};
    }

    fromJSON(json: Record<string, any>): void {
        if (json == null) {
            return;
        }
    }
}
