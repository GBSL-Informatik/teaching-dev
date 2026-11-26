import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../markdown';
import type { JsxAttribute } from '../../schema';
import { correctOptions, optionList, withCorrectOption } from '../choiceAnswer';

const correct = (value: string): JsxAttribute[] => [{ type: 'expressionAttribute', name: 'correct', value }];

describe('correctOptions', () => {
    it('reads a list of numbers', () => {
        expect(correctOptions(correct('[2]'))).toEqual([2]);
        expect(correctOptions(correct('[1, 4,5]'))).toEqual([1, 4, 5]);
        expect(correctOptions(correct('[]'))).toEqual([]);
        expect(correctOptions([])).toEqual([]);
    });

    it('rejects other expressions', () => {
        expect(correctOptions(correct('solution'))).toBeNull();
        expect(correctOptions(correct('[1, x]'))).toBeNull();
        expect(correctOptions([{ type: 'attribute', name: 'correct', value: '1' }])).toBeNull();
    });
});

describe('withCorrectOption', () => {
    it('adds the option in ascending order and removes it', () => {
        const added = withCorrectOption([1, 4], correct('[1, 4]'), 2, true);
        expect(added).toEqual(correct('[1, 2, 4]'));
        expect(withCorrectOption([1, 2, 4], added, 1, false)).toEqual(correct('[2, 4]'));
    });

    it('adds the attribute when missing', () => {
        expect(withCorrectOption([], [], 3, true)).toEqual(correct('[3]'));
    });
});

describe('optionList', () => {
    it('finds the first list of the question', () => {
        const { doc } = parseMarkdown(
            '<ChoiceAnswer correct={[1]}>\n    Frage\n\n    1. A\n    2. B\n\n    - Kein Teil der Optionen\n</ChoiceAnswer>\n'
        );
        const options = optionList(doc.firstChild!);
        expect(options?.list.type.name).toBe('ordered_list');
        expect(options?.list.childCount).toBe(2);
    });
});
