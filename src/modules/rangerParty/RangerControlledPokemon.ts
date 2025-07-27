import { pokemonMap } from "../pokemons/PokemonList";
import { PokemonNameType } from "../pokemons/PokemonNameType";

export default class RangerControlledPokemon {
    defaults = {};

    private _energy: KnockoutObservable<number>;
    public readonly name: PokemonNameType;

    constructor(public id: number) {
        this._energy = ko.observable(0);
        this.name = pokemonMap[this.id].name;
    }

    gainEnergy() {
        this._energy(this._energy() + 1);
    }
    
    toJSON(): Record<string, any> {
        return { id: this.id, energy: this._energy() };
    }

    fromJSON(json: Record<string, any>): void {
        this._energy(json.energy ?? 0);
    }

    get energy(): number {
        return this._energy();
    }
}
