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

    public static mrHyperPokemon = function() {
        SeededRand.seed(App.game.statistics.totalPokemonDefeated());
        SeededRand.next();
        SeededRand.next();
        SeededRand.next();
        let eligible = App.game.party.caughtPokemon.filter(p => p.pokerus == GameConstants.Pokerus.Contagious);
        if (!eligible.length) {
            eligible = App.game.party.caughtPokemon.filter(p => p.pokerus == GameConstants.Pokerus.Resistant);
        }
        return SeededRand.fromArray(eligible).name;
    };
}

