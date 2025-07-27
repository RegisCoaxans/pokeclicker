import { Saveable } from "../DataStore/common/Saveable";
import Multiplier from "../multiplier/Multiplier";
import RangerControlledPokemon from "./RangerControlledPokemon";

export default class RangerParty implements Saveable {
    saveKey = 'rangerParty';
    defaults = {};

    private _pokemon: KnockoutObservableArray<RangerControlledPokemon>;
    private _experience: KnockoutObservable<number>;
    private _level: KnockoutObservable<number>;

    constructor(multiplier: Multiplier) {
        this._pokemon = ko.observableArray([]);
        this._experience = ko.observable(0);
        this._level = ko.observable(1);

        multiplier.addBonus('clickAttack', () => 1, 'Capture Styler');
    }
    
    toJSON(): Record<string, any> {
        return { experience: this.experience, level: this.level, pokemon: this.pokemon.map(p => p.toJSON()) };
    }

    fromJSON(json: Record<string, any>): void {
        this._experience(json.experience ?? 0);
        this._level(json.level ?? 1);
        (json.pokemon ?? [] as Array<any>).forEach(p => {
            const pokemon = new RangerControlledPokemon(p.id);
            pokemon.fromJSON(p);
            this._pokemon.push(pokemon);
        });
    }

    get experience(): number {
        return this._experience();
    }

    get level(): number {
        return this._level();
    }

    get pokemon(): Array<RangerControlledPokemon> {
        return this._pokemon();
    }
}
