/// <reference path="../../declarations/GameHelper.d.ts" />
/// <reference path="../Battle.ts" />

class VoltorbFlipBattle extends Battle {

    // Looks like we don't need this, unless we want to put a random trainer name or similar
    static trainer: KnockoutObservable<number> = ko.observable(0);

    static counter = 0;

    // Override pokemon attack method so we handle attack differently
    public static pokemonAttack() {
        if (!VoltorbFlipRunner.running()) {
            return;
        }
        // Limit pokemon attack speed, Only allow 1 attack per 950ms
        const now = Date.now();
        if (this.lastPokemonAttack > now - 950) {
            return;
        }
        this.lastPokemonAttack = now;
        if (!this.enemyPokemon()?.isAlive()) {
            return;
        }
        this.enemyPokemon().damage(VoltorbFlipRunner.calculateFlipAttack());
        if (!this.enemyPokemon().isAlive()) {
            this.defeatPokemon();
        }
    }

    public static defeatPokemon() {
        // Statistics total rounds cleared ?
        // Statistics : max rounds cleared ?
        this.enemyPokemon().defeat(true);
        if (VoltorbFlipRunner.running()) {
            GameHelper.incrementObservable(VoltorbFlipRunner.enemyCount);
            this.generateNewEnemy();
        }
    }

    public static generateNewEnemy() {
        const enemy = pokemonMap['Voltorb'];
        const health = 10; // Formula TBD
        const level = 30; // TBD
        const shiny = PokemonFactory.generateShiny(GameConstants.SHINY_CHANCE_BATTLE);
        const gender = PokemonFactory.generateGender(enemy.gender.femaleRatio, enemy.gender.type);

        const enemyPokemon = new BattlePokemon(enemy.name, enemy.id, enemy.type[0], enemy.type[1], health, level, 0, enemy.exp, new Amount(0, GameConstants.Currency.contestToken), shiny, 3, gender, GameConstants.ShadowStatus.None, EncounterType.trainer);
        this.enemyPokemon(enemyPokemon);
    }
}
