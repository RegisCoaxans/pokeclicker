/// <reference path="../../declarations/GameHelper.d.ts" />
/// <reference path="../Battle.ts" />

class FlipTile {
    public flipped: KnockoutObservable<boolean> = ko.observable(false);

    constructor(public index: number, public value) {}

    public flip(): number {
        this.flipped(true);
        return this.value;
    }
}
