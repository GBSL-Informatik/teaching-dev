import type { Node } from 'prosemirror-model';
import { booleanAttribute, findAttribute, stringAttribute, withAttribute } from '../jsxAttributes';
import type { JsxAttribute } from '../schema';
import { isChoiceAnswer, isQuiz, isTrueFalseAnswer } from './components';

interface OptionBase {
    name: string;
    label: string;
    /** shown as tooltip, e.g. what the attribute does */
    title: string;
}

/** a boolean attribute, written as flag, e.g. `randomizeOptions` */
export interface FlagOption extends OptionBase {
    kind: 'flag';
}

/** a string attribute with a few values, the default value is not written */
export interface SelectOption extends OptionBase {
    kind: 'select';
    values: { value: string; label: string }[];
    defaultValue: string;
}

/** a number attribute, e.g. `minPoints={-2}`, not written while empty */
export interface NumberOption extends OptionBase {
    kind: 'number';
}

export type AttributeOption = FlagOption | SelectOption | NumberOption;

/**
 * The attributes described in the documentation of the assessable components, see
 * tdev-website/docs/gallery/persistable-documents/answer/choice-answer
 * `title`, `multiple`, `correct` and `scoring` have their own controls.
 */
const KEEP_EXPANDED: SelectOption = {
    kind: 'select',
    name: 'keepExpanded',
    label: 'Nach dem Beantworten',
    title: 'Welche Antwortmöglichkeiten nach dem Beantworten angezeigt werden (keepExpanded)',
    values: [
        { value: 'all', label: 'alle Antworten zeigen' },
        { value: 'correct', label: 'nur richtige zeigen' },
        { value: 'selected', label: 'nur ausgewählte zeigen' },
        { value: 'none', label: 'keine Antworten zeigen' }
    ],
    defaultValue: 'all'
};

const ALLOW_SELECTION: FlagOption = {
    kind: 'flag',
    name: 'allowSelection',
    label: 'Text auswählbar',
    title: 'Der Fragetext kann ausgewählt und kopiert werden (allowSelection)'
};

const RANDOMIZE_OPTIONS: FlagOption = {
    kind: 'flag',
    name: 'randomizeOptions',
    label: 'Antworten mischen',
    title: 'Die Antwortmöglichkeiten in zufälliger Reihenfolge anzeigen (randomizeOptions)'
};

const CHOICE_ANSWER_OPTIONS: AttributeOption[] = [RANDOMIZE_OPTIONS, ALLOW_SELECTION, KEEP_EXPANDED];

// `<TrueFalseAnswer>` does not support `allowSelection`
const TRUE_FALSE_ANSWER_OPTIONS: AttributeOption[] = [KEEP_EXPANDED];

const QUIZ_OPTIONS: AttributeOption[] = [
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
        title: 'Fragen und Antworten beim Zurücksetzen erneut mischen (shuffleOnReset)'
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
        values: [
            { value: 'all', label: 'alle Fragen' },
            { value: 'incorrect', label: 'nur falsche Fragen' },
            { value: 'noReset', label: 'nicht möglich' }
        ],
        defaultValue: 'all'
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
    const flag: JsxAttribute | null = isSet ? { type: 'attribute', name, value: null } : null;
    return withAttribute(attributes, name, flag);
};

/** `null` when the value is not one of the values of the option, e.g. an expression */
export const selectValue = (attributes: JsxAttribute[], option: SelectOption): string | null => {
    if (!findAttribute(attributes, option.name)) {
        return option.defaultValue;
    }
    const value = stringAttribute(attributes, option.name);
    return option.values.some((candidate) => candidate.value === value) ? value! : null;
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

const NUMBER_PATTERN = /^\s*-?(\d+\.?\d*|\.\d+)\s*$/;

/** `undefined` when not written, `null` when not a number literal */
export const numberValue = (attributes: JsxAttribute[], name: string): number | undefined | null => {
    const attribute = findAttribute(attributes, name);
    if (!attribute) {
        return undefined;
    }
    const isNumber = attribute.type === 'expressionAttribute' && NUMBER_PATTERN.test(attribute.value);
    return isNumber ? Number(attribute.value) : null;
};

/** `undefined` removes the attribute */
export const withNumberValue = (
    attributes: JsxAttribute[],
    name: string,
    value: number | undefined
): JsxAttribute[] => {
    const updated: JsxAttribute | null =
        value === undefined ? null : { type: 'expressionAttribute', name, value: `${value}` };
    return withAttribute(attributes, name, updated);
};
