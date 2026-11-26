import { describe, expect, it } from 'vitest';
import type { JsxAttribute } from '../../schema';
import { hintColor, hintConditions, withHintConditions } from '../hint';

const when = (value: string): JsxAttribute[] => [{ type: 'attribute', name: 'when', value }];
const whenList = (value: string): JsxAttribute[] => [{ type: 'expressionAttribute', name: 'when', value }];

describe('hintConditions', () => {
    it('reads a string or a list of strings', () => {
        expect(hintConditions(when('correct'))).toEqual(['correct']);
        expect(hintConditions(whenList(`['incorrect', "partially_correct"]`))).toEqual([
            'incorrect',
            'partially_correct'
        ]);
    });

    it('rejects functions and unknown conditions', () => {
        expect(hintConditions(whenList('(doc) => ({ show: true })'))).toBeNull();
        expect(hintConditions(whenList(`['correct', 'corect']`))).toBeNull();
        expect(hintConditions(when('always'))).toBeNull();
    });
});

describe('withHintConditions', () => {
    it('writes a single condition as string and several as ordered list', () => {
        expect(withHintConditions(whenList(`['correct', 'incorrect']`), ['correct'])).toEqual(
            when('correct')
        );
        expect(withHintConditions(when('assessed'), ['assessed', 'correct'])).toEqual(
            whenList(`['correct', 'assessed']`)
        );
    });
});

describe('hintColor', () => {
    it('uses the color attribute, else the first condition', () => {
        expect(hintColor(whenList(`['incorrect', 'correct']`))).toBe('danger');
        expect(hintColor([...when('correct'), { type: 'attribute', name: 'color', value: 'warning' }])).toBe(
            'warning'
        );
        expect(hintColor(whenList('() => null'))).toBe('info');
    });
});
