import { Currency, ConsumableType } from '../GameConstants';
import Item from './Item';
import { ShopOptions } from './types';

export default class Consumable extends Item {
    type: ConsumableType;
    filter: (pokemon: Record<any, any>) => boolean;

    constructor(
        type: ConsumableType,
        basePrice: number, currency: Currency = Currency.money, options?: ShopOptions,
        displayName?: string,
        description?: string,
        filter?: () => boolean,
    ) {
        super(ConsumableType[type], basePrice, currency, options, displayName, description, 'consumable');
        this.type = type;
        this.filter = filter;
    }
}
