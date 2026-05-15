import BeanType from '../enums/BeanType';
import Notifier from '../notifications/Notifier';
import NotificationOption from '../notifications/NotificationOption';
import { camelCaseToString, pluralizeString } from '../GameConstants';
import BeanBottle from './BeanBottle';
import GameHelper from '../GameHelper';

export default class PokepelagoController {
    static selectedBean = ko.observable(BeanType.None);
    static bottleAmount = ko.observable(0);

    static select(bean: BeanType) {
        PokepelagoController.selectedBean(bean);
        PokepelagoController.bottleAmount(0);
    }

    static collectBottle() {
        if (App.game.pokePelago.bottle().checkAground()) {
            const amount: number = App.game.pokePelago.bottle().collect();
            const bean: BeanType = App.game.pokePelago.bottle().bean();
            Notifier.notify({
                type: NotificationOption.info,
                message: `You find ${amount} ${pluralizeString(camelCaseToString(`${BeanType[bean]} Bean`), amount)} in this bottle.`,
                image: PokepelagoController.getBeanImage(bean),
            });
            App.game.pokePelago.bottle(new BeanBottle());
        }
    }

    static fillBottle() {
        const bottle = App.game.pokePelago.bottle();
        if (bottle.bean() !== BeanType.None ||
            PokepelagoController.selectedBean() == BeanType.Rainbow ||
            PokepelagoController.selectedBean() == BeanType.None ||
            PokepelagoController.bottleAmount() <= 0
        ) {
            return;
        }
        bottle.fill(PokepelagoController.selectedBean(), PokepelagoController.bottleAmount());
        App.game.pokePelago.loseBean(PokepelagoController.selectedBean(), -PokepelagoController.bottleAmount());
        PokepelagoController.bottleAmount(0);
    }

    static getBeanImage(bean: BeanType): string {
        return `assets/images/pokepelago/${BeanType[bean]}.png`;
    }

    static getBottleBound() {
        return PokepelagoController.selectedBean() != BeanType.None ? Math.floor(App.game.pokePelago.beans[PokepelagoController.selectedBean()]() / 2) * 2 : 0;
    }

    static maxBeanList(): BeanType {
        let bean = GameHelper.enumLength(BeanType) - 2;
        while (bean > BeanType.None) {
            if (App.game.statistics.beansCollected[bean]()) {
                break;
            }
            bean--;
        }
        return Math.max(0, bean);
    }
}