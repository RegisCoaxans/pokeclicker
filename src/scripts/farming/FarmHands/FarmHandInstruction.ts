abstract class FarmHandInstructionUnit {
    public static key = 'default';
    static legalValues = [];

    matchLegalValue(value: string): string {
        return FarmHandInstructionUnit.legalValues.find(legal => legal.toLowerCase() == value.toLowerCase());
    };
}

abstract class FarmHandInstructionCondition extends FarmHandInstructionUnit {
    public values: Array<string>;
    constructor(values: Array<string>, instructionIndex: number, conditionIndex: number) {
        super();
        if (FarmHandInstructionCondition.legalValues.length && !values.length) {
            throw new Error(`L${instructionIndex + 1}:${conditionIndex + 1} <code>${FarmHandInstructionCondition.key}</code> requires a parameter`);
        }
        this.values = [];
        values.forEach(rawValue => {
            const value = this.matchLegalValue(rawValue);
            if (!value) {
                throw new Error(`L${instructionIndex + 1}:${conditionIndex + 1} <code>${rawValue}</code> isn't a legal value from <code>${FarmHandInstructionCondition.key}</code>`);
            }
            this.values.push(value);
        });
    }
    abstract test(plot: Plot): boolean;

    toJSON() {
        return `${FarmHandInstructionCondition.key}${this.values.length ? ` ${this.values.join(' ')}` : ''}`;
    }
}
abstract class FarmHandInstructionAction extends FarmHandInstructionUnit {
    public value: string;
    constructor(rawValue: string, instructionIndex: number, actionIndex: number) {
        super();
        if (FarmHandInstructionAction.legalValues.length && !rawValue) {
            throw new Error(`L${instructionIndex + 1}:${actionIndex + 1} <code>${FarmHandInstructionAction.key}</code> requires a parameter`);
        }
        const value = this.matchLegalValue(rawValue);
        if (!value) {
            throw new Error(`L${instructionIndex + 1}:${actionIndex + 1} <code>${rawValue}</code> isn't a legal value from ${FarmHandInstructionAction.key}`);
        }
        this.value = value;
    }
    abstract run(plot: Plot): boolean;

    toJSON() {
        return `${FarmHandInstructionAction.key}${this.value ? ` ${this.value}` : ''}`;
    }
}

// --- Conditions

class FarmHandInstructionConditionBerry extends FarmHandInstructionCondition {
    public static key = 'Berry';
    static legalValues = GameHelper.enumStrings(BerryType);

    test(plot: Plot): boolean {
        return this.values.includes(BerryType[plot.berry]);
    }
}

class FarmHandInstructionConditionMulch extends FarmHandInstructionCondition {
    public static key = 'Mulch';
    static legalValues = GameHelper.enumStrings(MulchType);

    test(plot: Plot): boolean {
        return this.values.includes(MulchType[plot.mulch]);
    }
}

class FarmHandInstructionConditionPlot extends FarmHandInstructionCondition {
    public static key = 'Plot';
    static legalValues = [...new Array(GameConstants.FARM_PLOT_HEIGHT * GameConstants.FARM_PLOT_WIDTH)].map((_, i) => `${i + 1}`);

    test(plot: Plot): boolean {
        return this.values.includes(`${plot.index}`);
    }
}

class FarmHandInstructionConditionPokemon extends FarmHandInstructionCondition {
    public static key = 'Pokemon';
    static legalValues = ['None', 'Regular', 'Shiny'];

    test(plot: Plot): boolean {
        return this.values.includes(plot.wanderer ? (plot.wanderer.shiny ? 'Shiny' : 'Regular') : 'None');
    }
}

class FarmHandInstructionConditionStage extends FarmHandInstructionCondition {
    public static key = 'Stage';
    static legalValues = GameHelper.enumStrings(PlotStage);

    test(plot: Plot): boolean {
        return this.values.includes(PlotStage[plot.stage()]);
    }
}

// --- Actions

class FarmHandInstructionActionHarvest extends FarmHandInstructionAction {
    public static key = 'Harvest';
    static legalValues = [];

    run(plot: Plot): boolean {
        return App.game.farming.harvest(plot.index);
    }
}

class FarmHandInstructionActionPlant extends FarmHandInstructionAction {
    public static key = 'Plant';
    static legalValues = ['Replant', ...GameHelper.enumStrings(BerryType)];

    run(plot: Plot): boolean {
        const berry = this.value == 'Replant' ? (plot.lastPlanted == BerryType.None ? BerryType.Cheri : plot.lastPlanted) : BerryType[this.value];
        return App.game.farming.plant(plot.index, BerryType[this.value]);
    }
}

class FarmHandInstructionActionWanderer extends FarmHandInstructionAction {
    public static key = 'Wanderer';
    static legalValues = [];

    run(plot: Plot): boolean {
        return App.game.farming.handleWanderer(plot);
    }
}

class FarmHandInstructionActionMulch extends FarmHandInstructionAction {
    public static key = 'Mulch';
    static legalValues = GameHelper.enumStrings(MulchType);

    run(plot: Plot): boolean {
        return App.game.farming.addMulch(plot.index, MulchType[this.value]);
    }
}

class FarmHandInstructionActionShovel extends FarmHandInstructionAction {
    public static key = 'Shovel';
    static legalValues = ['Berry', 'Mulch'];

    run(plot: Plot): boolean {
        if (this.value == 'Berry') {
            return App.game.farming.shovel(plot.index);
        } else {
            return App.game.farming.shovelMulch(plot.index);
        }
    }
}

// ---

class FarmHandInstruction {
    public conditions : KnockoutObservableArray<FarmHandInstructionCondition> = ko.observableArray([]);
    public actions : KnockoutObservableArray<FarmHandInstructionAction> = ko.observableArray([]);

    constructor(row: string, instructionIndex: number) {
        const rowSplit = row.split(FarmHandInstructions.CONDITIONAL_IDENTIFIER);
        if (rowSplit.length > 2) {
            throw new Error(`L${instructionIndex + 1} Only one identifier <code>${FarmHandInstructions.CONDITIONAL_IDENTIFIER}</code> allowed`);
        }
        if (rowSplit.length == 2) {
            rowSplit.shift().split(FarmHandInstructions.INSTRUCTION_SEPARATOR).forEach((condition, conditionIndex) => {
                const args = condition.trim().split(/\s+/);
                const type = args.shift();
                const blockType = FarmHandInstructions.BLOCK_CONDITION_LIST.find(b => b.key.toLowerCase() === type.toLowerCase());
                if (!blockType) {
                    throw new Error(`L${instructionIndex + 1}:${conditionIndex + 1} Unknown reference <code>${type}</code>`);
                }
                this.conditions.push(new blockType(args, instructionIndex, conditionIndex));
            });
        }
        rowSplit.shift().split(FarmHandInstructions.INSTRUCTION_SEPARATOR).forEach((action, actionIndex) => {
            const args = action.trim().split(/\s+/);
            const type = args.shift();
                const blockType = FarmHandInstructions.BLOCK_ACTION_LIST.find(b => b.key.toLowerCase() === type.toLowerCase());
                if (!blockType) {
                    throw new Error(`L${instructionIndex + 1}:${actionIndex + 1} Unknown reference <code>${type}</code>`);
                }
                this.actions.push(new blockType(args.shift(), instructionIndex, actionIndex));
        });
    }

    toJSON() {
        const conditions = this.conditions().length ? `${this.conditions().map(c => c.toJSON()).join(FarmHandInstructions.INSTRUCTION_SEPARATOR)}${FarmHandInstructions.CONDITIONAL_IDENTIFIER}` : '';
        return `${conditions}${this.actions().map(a => a.toJSON()).join(FarmHandInstructions.INSTRUCTION_SEPARATOR)}`;
    }
}

class FarmHandInstructions {
    public static ROW_SEPARATOR = ',';
    public static INSTRUCTION_SEPARATOR = '+';
    public static CONDITIONAL_IDENTIFIER = '?';
    public static BLOCK_CONDITION_LIST = [
        FarmHandInstructionConditionBerry,
        FarmHandInstructionConditionMulch,
        FarmHandInstructionConditionStage,
        FarmHandInstructionConditionPokemon,
        FarmHandInstructionConditionPlot,
    ];
    public static BLOCK_ACTION_LIST = [
        FarmHandInstructionActionHarvest,
        FarmHandInstructionActionPlant,
        FarmHandInstructionActionWanderer,
        FarmHandInstructionActionMulch,
        FarmHandInstructionActionShovel,
    ]
}