/// <reference path="../../declarations/GameHelper.d.ts" />
/// <reference path="../../declarations/DataStore/common/Feature.d.ts" />

class ZMoves implements Feature {
    name = 'Z Moves';
    saveKey = 'zMoves';
    defaults = {
        types: Array<PokemonType>(GameConstants.ZMOVE_MAX_ENERGY),
        charges: Array<number>(GameHelper.enumLength(PokemonType) - 1).fill(GameConstants.ZMOVE_MAX_ENERGY),
    };
    public counter = 0;

    public _types: KnockoutObservableArray<PokemonType> = ko.observableArray([]);
    public charges: Array<KnockoutObservable<number>> = this.defaults.charges.map(v => ko.observable(v));
    public totalCost: KnockoutComputed<number> = ko.computed(() => {
        return this.types.length;
    });
    public refillValues: Array<KnockoutComputed<number>>;


    initialize(): void {
        this.refillValues = new Array(GameHelper.enumLength(PokemonType) - 1).fill(null).map((_, type) => {
            return ko.computed(() => Math.round(100 * Math.sqrt(App.game.party.caughtPokemon.filter(p => {
                const pdata = PokemonHelper.getPokemonById(p.id);
                return pdata.type1 === type || pdata.type2 === type;
            }).length)) / 100);
        });
    }

    getTypeMultiplier(type1 = PokemonType.None, type2 = PokemonType.None): number {
        if (type1 == PokemonType.None || !this.totalCost()) {
            return 1;
        }
        return 1 + Math.max(...this.types.map(t => TypeHelper.getAttackModifier(t, PokemonType.None, type1, type2))) / 10;
    }

    charge() {
        this.refillValues.forEach((valueObs, type) => {
            GameHelper.incrementObservable(this.charges[type], valueObs());
        });
    }

    pickTypeAgainst(pokemon: PokemonNameType) {
        if (!this.totalCost()) {
            return PokemonType.None;
        }
        const {type1, type2} = PokemonHelper.getPokemonByName(pokemon);
        let bestTypes = [];
        let bestMultiplier = -1;
        this.types.forEach(t => {
            const m = TypeHelper.getAttackModifier(t, PokemonType.None, type1, type2);
            if (m > bestMultiplier) {
                bestTypes = [t];
                bestMultiplier = m;
            } else if (m === bestMultiplier) {
                bestTypes.push(t);
            }
        });
        // Random so it always the first most efficient type
        // Seeded so it only changes between two encounters
        SeededRand.seed(App.game.statistics.totalPokemonDefeated());
        return SeededRand.shuffleArray(bestTypes)[0];
    }

    crystalImage(type: PokemonType) {
        if (type === PokemonType.None) {
            return '';
        }
        return ItemList[GameConstants.zCrystalItemType[type]].image;
    }

    crystalDescription(crystal: ZCrystalItem) {
        const type = crystal.type;
        return `${crystal.displayName}<br/>${crystal.description}${ItemHandler.hasItem(crystal.name) ? `<br/><br/>Energy: ${this.charges[type]()}${this.isActive(type) ? `<br/>Time Remaining: ${this.activeTime(type)}` : ''}` : ''}`;
    }

    isActive(type: PokemonType): boolean {
        return this.types.findIndex((t) => type == t) > -1;
    }

    activeTime(type: PokemonType): string {
        if (this.isActive(type)) {
            const cost = this.totalCost();
            return GameConstants.formatTime(Math.floor(this.charges[type]() / cost));
        }
        return GameConstants.formatTime(0);
    }

    deactivateAll() {
        this._types([]);
    }

    shortestActiveTime() {
        const cost = this.totalCost();
        const type = this.findActiveWithLowestCharge();
        if (type === PokemonType.None) {
            return '';
        }
        const time = this.charges[type]() / cost;
        return GameConstants.formatTime(Math.floor(time));
    }

    findActiveWithLowestCharge(): PokemonType {
        let type = PokemonType.None;
        let energy = Infinity;
        this.types.forEach(t => {
            if (this.charges[t]() < energy) {
                type = t;
                energy = this.charges[t]();
            }
        });
        return type;
    }

    canUse(type: PokemonType) {
        if (this.isActive(type)) {
            return true;
        }
        const cost = this.totalCost() + 1;
        return this.charges[type]() >= cost;
    }

    toggle(type: PokemonType) {
        if (this.isActive(type)) {
            this._types.remove(type);
        } else {
            this._types.push(type);
        }
    }

    fromJSON(json: any): void {
        if (!json) {
            return;
        }
        this._types(json.types);
        json.charges.forEach((v, i) => {
            this.charges[i](v);
        });
    }

    toJSON() {
        return {
            types: ko.unwrap(this._types),
            charges: this.charges.map(o => ko.unwrap(o)),
        };
    }

    canAccess(): boolean {
        // DO NOT MERGE THAT ! IT IS THIS WAY FOR TEST PURPOSE !
        return true; //App.game.keyItems.hasKeyItem(KeyItemType['Z-Power_Ring']);
    }

    update(delta: number): void {}  // This method intentionally left blank

    tick(): void {
        const cost = this.totalCost();
        this.types.forEach(t => {
            GameHelper.incrementObservable(this.charges[t], -cost);
            if (this.charges[t]() < cost) {
                this.toggle(t);
                Notifier.notify({
                    title: 'Z-Crystal',
                    message: `The ${GameConstants.zCrystalItemType[t]} ran out of energy and deactivated`,
                    type: NotificationConstants.NotificationOption.danger,
                });
            }
        });
        this.counter = 0;
    }

    get types() {
        return this._types();
    }
}
