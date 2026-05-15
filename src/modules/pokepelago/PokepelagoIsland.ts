import BeanType from '../enums/BeanType';

export default class PokepelagoIsland {
    public exp = ko.observable(0);
    public activeBean = ko.observable(BeanType.None);
    public timeLeft = ko.observable(0);

    constructor(public name: string) {}

    toJSON() {
        return {
            name: this.name,
            exp: ko.unwrap(this.exp),
            activeBean: ko.unwrap(this.activeBean),
            timeLeft: ko.unwrap(this.timeLeft),
        };
    }

    fromJSON(json: Record<string, any>) {
        this.exp(json.exp ?? 0);
        this.activeBean(json.activeBean ?? 0);
        this.timeLeft(json.timeLeft ?? 0);
    }
}
