/* eslint-disable arrow-body-style */
import { Computed } from 'knockout';
import DayCycleMoment from './DayCycleMoment';
import DayCyclePart from './DayCyclePart';
import { DayCycleStartHours } from '../GameConstants';
import GameHelper from '../GameHelper';
import { Feature } from '../DataStore/common/Feature';
import QuestLineState from '../quests/QuestLineState';

export default class DayCycle implements Feature {
    name = 'DayCycle';
    saveKey = 'dayCycle';

    defaults: Record<string, any> = {};

    public currentDayCyclePart: Computed<DayCyclePart> = ko.pureComputed(() => {
        const currentHour = GameHelper.currentTime().getHours();

        return Number(Object.entries(DayCycleStartHours).reverse().find(([, startHour]) => startHour <= currentHour)?.[0] ?? Object.keys(DayCycleStartHours).slice(-1));
    });

    public image: Computed<string> = ko.pureComputed(() => `assets/images/dayCycle/${DayCyclePart[this.currentDayCyclePart()]}.png`);

    public color: Computed<string> = ko.pureComputed(() => this.dayCycleMoments[this.currentDayCyclePart()].color);

    public tooltip: Computed<string> = ko.pureComputed(() => this.dayCycleMoments[this.currentDayCyclePart()].tooltip);

    public dayCycleMoments: Record<DayCyclePart, DayCycleMoment> = {
        [DayCyclePart.Dawn]:
            new DayCycleMoment(DayCyclePart.Dawn, '#25b6a0', 'Dawn'),
        [DayCyclePart.Day]:
            new DayCycleMoment(DayCyclePart.Day, '#f4a470', 'Day'),
        [DayCyclePart.Dusk]:
            new DayCycleMoment(DayCyclePart.Dusk, '#93558a', 'Dusk'),
        [DayCyclePart.Night]:
            new DayCycleMoment(DayCyclePart.Night, '#4a6252', 'Night'),
    };

    initialize(): void {}

    // The Day Cycle exists at any time, but it can be altered once this is true
    canAccess(): boolean {
        return App.game.quests.getQuestLine('Emissary of Light').state == QuestLineState.ended;
    }

    update(): void {}

    tick(): void {}

    toJSON() {
        return {};
    }

    fromJSON() {

    }
}
