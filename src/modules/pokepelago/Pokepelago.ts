import {
    Observable as KnockoutObservable,
} from 'knockout';
import { Feature } from '../DataStore/common/Feature';
import BeanType from '../enums/BeanType';
import KeyItemType from '../enums/KeyItemType';
import GameHelper from '../GameHelper';
import Rand from '../utilities/Rand';
import { BEANS_CHANCE, Region } from '../GameConstants';
import Multiplier from '../multiplier/Multiplier';
import PokepelagoIsland from './PokepelagoIsland';
import PokepelagoController from './PokepelagoController';
import Notifier from '../notifications/Notifier';
import NotificationOption from '../notifications/NotificationOption';
import BeanBottle from './BeanBottle';

export default class Pokepelago implements Feature {
    name = 'Pokepelago';
    saveKey = 'Pokepelago';

    public beans: Array<KnockoutObservable<number>>;
    public averageBeanPower: KnockoutObservable<number>;
    public bottle: KnockoutObservable<BeanBottle>;
    public islands: Array<PokepelagoIsland>;
    public counter = 0;

    public defaults = {};

    constructor(private multiplier: Multiplier) {
        this.beans = [...new Array(GameHelper.enumLength(BeanType) - 1)].map(() => ko.observable(0));
        this.averageBeanPower = ko.observable(0);
        this.islands = ['Abeens', 'Aplenny', 'Aphun', 'Evelup', 'Avue'].map(name => new PokepelagoIsland(name));
        this.bottle = ko.observable(new BeanBottle());
    }

    initialize() {}

    tick() {
        if (player.region != Region.alola) {
            return;
        }
        this.counter = 0;
        if (Rand.chance(BEANS_CHANCE)) {
            this.generateRandomBean();
        }
        this.bottle().tick();
    }

    gainBean(bean: BeanType, amount: number, force = false): Partial<Record<BeanType, number>> {
        if (BeanType.None == bean) {
            return { [bean]: 0 };
        }
        if (force) {
            GameHelper.incrementObservable(this.beans[bean], amount);
            GameHelper.incrementObservable(App.game.statistics.beansCollected[bean], amount);
            return { [bean]: amount };
        }
        const res: Partial<Record<BeanType, number>> = {};
        let amountLoop = amount;
        let beanLoop = bean;
        while (beanLoop > BeanType.None && amountLoop > 0) {
            if (this.beanMaxStack(beanLoop) > this.beans[beanLoop]()) {
                const validAmount = Math.max(0, Math.min(amountLoop, this.beanMaxStack(beanLoop) - this.beans[beanLoop]()));
                if (validAmount) {
                    GameHelper.incrementObservable(App.game.statistics.beansCollected[beanLoop], validAmount);
                    GameHelper.incrementObservable(this.beans[beanLoop], validAmount);
                }
                res[beanLoop] = validAmount;
                amountLoop = (amountLoop - validAmount) * 2;
                beanLoop--;
            }
        }
        return res;
    }

    loseBean(bean: BeanType, amount: number) {
        if (bean == BeanType.None || amount > this.beans[bean]()) {
            return;
        }
        GameHelper.incrementObservable(this.beans[bean], amount);
    }

    generateRandomBean() {
        const weights = this.getBeanWeights();
        const bean = Rand.fromWeightedArray(GameHelper.enumNumbers(BeanType).filter(b => b >= 0), weights);
        const beans = this.gainBean(bean, 1);
        Notifier.notify({
            type: NotificationOption.info,
            message: 'A bean has been dropped from the Beanstalk!',
            image: PokepelagoController.getBeanImage(Object.keys(beans).reduce((m, b) => Math.max(m, Number(b)), BeanType.None)),
        });
    }

    getBeanWeights(): Array<number> {
        const power = this.averageBeanPower() * 4 / 3;
        return [...new Array(GameHelper.enumLength(BeanType) - 1)].map((_, i) => i).map(id => id <= power ? Math.min(10000 + id ** 2 * 100, 2 ** power / 2 ** id) : 0);
    }

    beanMaxStack(bean: BeanType) {
        // Shouldn't happen
        if (bean == BeanType.None) {
            return 0;
        }
        return 5 * 2 ** (GameHelper.enumLength(BeanType) - 1 - bean);
    }

    canAccess(): boolean {
        return App.game.keyItems.hasKeyItem(KeyItemType.Bean_Pouch);
    }

    toJSON(): Record<string, any> {
        return {
            beans: this.beans.map(b => ko.unwrap(b)),
            averageBeanPower: ko.unwrap(this.averageBeanPower),
            islands: this.islands.map(i => i.toJSON()),
            bottle: this.bottle().toJSON(),
        };
    }

    fromJSON(json: Record<string, any>) {
        if (!json) {
            return;
        }
        json.beans.forEach((c: number, i: number) => this.beans[i](c));
        this.averageBeanPower(json.averageBeanPower ?? 0);
        json.islands?.forEach((data: Record<string, any>) => this.islands.find(i => i.name == data.name)?.fromJSON(data));
        this.bottle().fromJSON(json.bottle);

    }
}