import type { ExpandedOption } from '@tdev-models/documents/Assessable/AssessableMeta';
import type { Node } from 'prosemirror-model';
import {
    booleanAttribute,
    expressionAttribute,
    findAttribute,
    flagAttribute,
    stringAttribute,
    withAttribute
} from '../jsxAttributes';
import type { JsxAttribute } from '../schema';
import {
    type ChoiceAnswerProps,
    isChoiceAnswer,
    isQuiz,
    isTrueFalseAnswer,
    type QuizProps,
    type TrueFalseAnswerProps
} from './components';

interface OptionBase<Name extends string> {
    name: Name;
    label: string;
    /** shown as tooltip, e.g. what the attribute does */
    title: string;
}

/** a boolean attribute, written as flag, e.g. `randomizeOptions` */
export interface FlagOption<Name extends string = string> extends OptionBase<Name> {
    kind: 'flag';
}

/** a string attribute with a few values, the default value is not written */
export interface SelectOption<
    Name extends string = string,
    Value extends string = string
> extends OptionBase<Name> {
    kind: 'select';
    /** one label for each value: the typecheck fails when core adds, renames or removes a value */
    labels: Record<Value, string>;
    defaultValue: Value;
}

/** a number attribute, e.g. `minPoints={-2}`, not written while empty */
export interface NumberOption<Name extends string = string> extends OptionBase<Name> {
    kind: 'number';
}

export type AttributeOption<Name extends string = string> =
    FlagOption<Name> | SelectOption<Name> | NumberOption<Name>;

/** the typecheck fails when core renames or removes one of the props */
type OptionsOf<Props> = AttributeOption<keyof Props & string>[];

/**
 * The attributes described in the documentation of the assessable components, see
 * tdev-website/docs/gallery/persistable-documents/answer/choice-answer
 * `title`, `multiple`, `correct` and `scoring` have their own controls.
 */
const KEEP_EXPANDED: SelectOption<'keepExpanded', ExpandedOption> = {
    kind: 'select',
    name: 'keepExpanded',
    label: 'Nach dem Beantworten',
    title: 'Welche Antwortoptionen nach dem Beantworten angezeigt werden (keepExpanded)',
    labels: {
        all: 'alle Antwortoptionen zeigen',
        correct: 'nur richtige Antwortoptionen zeigen',
        selected: 'nur ausgewählte Antwortoptionen zeigen',
        none: 'keine Antwortoptionen zeigen'
    },
    defaultValue: 'all'
};

const ALLOW_SELECTION: FlagOption<'allowSelection'> = {
    kind: 'flag',
    name: 'allowSelection',
    label: 'Text auswählbar',
    title: 'Der Fragetext kann ausgewählt und kopiert werden (allowSelection)'
};

const RANDOMIZE_OPTIONS: FlagOption<'randomizeOptions'> = {
    kind: 'flag',
    name: 'randomizeOptions',
    label: 'Antwortoptionen mischen',
    title: 'Die Antwortoptionen in zufälliger Reihenfolge anzeigen (randomizeOptions)'
};

const CHOICE_ANSWER_OPTIONS: OptionsOf<ChoiceAnswerProps> = [
    RANDOMIZE_OPTIONS,
    ALLOW_SELECTION,
    KEEP_EXPANDED
];

// `<TrueFalseAnswer>` does not support `allowSelection`
const TRUE_FALSE_ANSWER_OPTIONS: OptionsOf<TrueFalseAnswerProps> = [KEEP_EXPANDED];

const QUIZ_OPTIONS: OptionsOf<QuizProps> = [
    {
        kind: 'flag',
        name: 'randomizeQuestions',
        label: 'Fragen mischen',
        title: 'Die Fragen in zufälliger Reihenfolge anzeigen (randomizeQuestions)'
    },
    RANDOMIZE_OPTIONS,
    {
        kind: 'flag',
        name: 'shuffleOnReset',
        label: 'Beim Zurücksetzen neu mischen',
        title: 'Fragen und Antwortoptionen beim Zurücksetzen erneut mischen (shuffleOnReset)'
    },
    {
        kind: 'flag',
        name: 'hideQuestionNumbers',
        label: 'Ohne Fragenummern',
        title: 'Den Fragen keinen Titel mit der Fragenummer hinzufügen (hideQuestionNumbers)'
    },
    ALLOW_SELECTION,
    KEEP_EXPANDED,
    {
        kind: 'select',
        name: 'resetMode',
        label: 'Zurücksetzen',
        title: 'Welche Fragen beim Zurücksetzen des Quiz zurückgesetzt werden (resetMode)',
        labels: {
            all: 'alle Fragen',
            incorrect: 'nur falsche Fragen',
            noReset: 'nicht möglich'
        } satisfies Record<QuizProps['resetMode'], string>,
        defaultValue: 'all' satisfies QuizProps['resetMode']
    },
    {
        kind: 'number',
        name: 'minPoints',
        label: 'Min. Punkte',
        title: 'Die minimale Punktzahl des Quiz, z.B. bei Minuspunkten (minPoints)'
    }
];

export const attributeOptions = (node: Node): AttributeOption[] => {
    if (isChoiceAnswer(node)) {
        return CHOICE_ANSWER_OPTIONS;
    }
    if (isTrueFalseAnswer(node)) {
        return TRUE_FALSE_ANSWER_OPTIONS;
    }
    return isQuiz(node) ? QUIZ_OPTIONS : [];
};

/** `null` when the value is not a literal, e.g. `allowSelection={isExam}`: it is edited in the tag */
export const flagValue = (attributes: JsxAttribute[], name: string): boolean | null => {
    const value = booleanAttribute(attributes, name);
    return value === undefined ? false : value;
};

/** a set flag is written without value, an unset flag is removed */
export const withFlag = (attributes: JsxAttribute[], name: string, isSet: boolean): JsxAttribute[] => {
    return withAttribute(attributes, name, isSet ? flagAttribute(name) : null);
};

/** `null` when the value is not one of the values of the option, e.g. an expression */
export const selectValue = (attributes: JsxAttribute[], option: SelectOption): string | null => {
    if (!findAttribute(attributes, option.name)) {
        return option.defaultValue;
    }
    const value = stringAttribute(attributes, option.name);
    return value !== undefined && Object.hasOwn(option.labels, value) ? value : null;
};

export const withSelectValue = (
    attributes: JsxAttribute[],
    option: SelectOption,
    value: string
): JsxAttribute[] => {
    const updated: JsxAttribute | null =
        value === option.defaultValue ? null : { type: 'attribute', name: option.name, value };
    return withAttribute(attributes, option.name, updated);
};

/** `undefined` removes the attribute */
export const withNumberValue = (
    attributes: JsxAttribute[],
    name: string,
    value: number | undefined
): JsxAttribute[] => {
    const updated: JsxAttribute | null = value === undefined ? null : expressionAttribute(name, `${value}`);
    return withAttribute(attributes, name, updated);
};
