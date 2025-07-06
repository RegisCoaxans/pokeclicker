import { AchievementOption } from '../GameConstants';
import Requirement from './Requirement';
import DayCyclePart from '../dayCycle/DayCyclePart';

export default class DayCyclePartRequirement extends Requirement {
    constructor(public dayCycleParts: DayCyclePart[], option = AchievementOption.more) {
        super(1, option);
    }

    public getProgress(): number {
        return Number(this.dayCycleParts.includes(App.game.dayCycle.currentDayCyclePart()));
    }

    public hint(): string {
        return `Your local part of the day must be ${this.dayCycleParts.map((dayCyclePart) => DayCyclePart[dayCyclePart]).join(' or ')}`;
    }
}
