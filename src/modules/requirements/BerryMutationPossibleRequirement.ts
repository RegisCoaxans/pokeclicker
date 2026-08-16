import { AchievementOption } from '../GameConstants';
import BerryType from '../enums/BerryType';
import Requirement from './Requirement';

export default class BerryMutationPossibleRequirement extends Requirement {
    constructor(public berry: BerryType) {
        super(1, AchievementOption.more);
    }

    public getProgress() {
        return Number(App.game.farming.isMutationPossible(this.berry));
    }

    public hint(): string {
        return `Your farm must be arranged so a ${BerryType[this.berry]} Berry mutation is possible.`;
    }
}
