class NPCController {
    public static selectedNPC: KnockoutObservable<NPC> = ko.observable();
    private static modalState: any;
    public static openDialog(npc: NPC) {
        this.selectedNPC(npc);
        $('#npc-modal').modal();
        npc.setTalkedTo();
        if (!this.modalState) {
            this.modalState = DisplayObservables.modalState['npc-modalObservable'].subscribe((value: BootstrapState) => {
                if (value === 'hidden') {
                    this.selectedNPC(null);
                }
            });
        }
    }

    public static mrHyperPokemon = (function() {
        let pokemon: PokemonNameType;
        const getRandomPokemon = () => {
            if (pokemon) {
                return pokemon;
            }
            let eligible = App.game.party.caughtPokemon.filter(p => p.pokerus == GameConstants.Pokerus.Contagious).map(p => p.name);
            if (!eligible.length) {
                eligible = App.game.party.caughtPokemon.filter(p => p.pokerus == GameConstants.Pokerus.Resistant).map(p => p.name);
            }
            return pokemon = Rand.fromArray(eligible);
        };
        return getRandomPokemon;
    })();
}

