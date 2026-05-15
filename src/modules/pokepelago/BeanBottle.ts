import BeanType from '../enums/BeanType';
import GameHelper from '../GameHelper';
import { SECOND, BEAN_MERGE_TIME } from '../GameConstants';

export default class BeanBottle {
    public bean = ko.observable(BeanType.None);
    public amount = ko.observable(0);
    public ticks = ko.observable(0);
    public collected = false;

    tick() {
        if (this.bean() != BeanType.None && !this.checkAground()) {
            GameHelper.incrementObservable(this.ticks, -SECOND);
        }
        return false;
    }

    checkAground() {
        return this.bean() !== BeanType.None && this.ticks() <= 0 && !this.collected;
    }

    collect(): number {
        this.collected = true;
        const mergedAmount = this.amount();
        App.game.pokePelago.gainBean(this.bean(), mergedAmount, true);
        return mergedAmount;
    }

    fill(bean: BeanType, amount: number) {
        this.bean(bean + 1);
        this.amount(Math.floor(amount / 2));
        this.ticks(BEAN_MERGE_TIME[bean]);
    }

    fromJSON(json: Record<string, any>) {
        this.bean(json?.bean ?? BeanType.None);
        this.ticks(json?.ticks ?? 0);
    }

    toJSON(): Record<string, any> {
        return { bean: ko.unwrap(this.bean), ticks: ko.unwrap(this.ticks) };
    }
}