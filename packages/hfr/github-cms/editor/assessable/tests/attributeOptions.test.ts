import { describe, expect, it } from 'vitest';
import { numberAttribute } from '../../jsxAttributes';
import type { JsxAttribute } from '../../schema';
import {
    flagValue,
    type SelectOption,
    selectValue,
    withFlag,
    withNumberValue,
    withSelectValue
} from '../attributeOptions';

const flag = (name: string): JsxAttribute => ({ type: 'attribute', name, value: null });
const expression = (name: string, value: string): JsxAttribute => ({
    type: 'expressionAttribute',
    name,
    value
});
const string = (name: string, value: string): JsxAttribute => ({ type: 'attribute', name, value });

describe('flags', () => {
    it('reads flags and boolean literals', () => {
        expect(flagValue([flag('allowSelection')], 'allowSelection')).toBe(true);
        expect(flagValue([expression('allowSelection', 'false')], 'allowSelection')).toBe(false);
        expect(flagValue([], 'allowSelection')).toBe(false);
        expect(flagValue([expression('allowSelection', 'isExam')], 'allowSelection')).toBeNull();
    });

    it('writes a set flag without value and removes an unset one', () => {
        expect(withFlag([expression('x', 'false')], 'x', true)).toEqual([flag('x')]);
        expect(withFlag([flag('x')], 'x', false)).toEqual([]);
    });
});

describe('select values', () => {
    const RESET_MODE: SelectOption = {
        kind: 'select',
        name: 'resetMode',
        label: '',
        title: '',
        values: [
            { value: 'all', label: '' },
            { value: 'noReset', label: '' }
        ],
        defaultValue: 'all'
    };

    it('reads the default value when not written, and rejects unknown values', () => {
        expect(selectValue([], RESET_MODE)).toBe('all');
        expect(selectValue([string('resetMode', 'noReset')], RESET_MODE)).toBe('noReset');
        expect(selectValue([string('resetMode', 'other')], RESET_MODE)).toBeNull();
        expect(selectValue([expression('resetMode', 'mode')], RESET_MODE)).toBeNull();
    });

    it('does not write the default value', () => {
        expect(withSelectValue([], RESET_MODE, 'noReset')).toEqual([string('resetMode', 'noReset')]);
        expect(withSelectValue([string('resetMode', 'noReset')], RESET_MODE, 'all')).toEqual([]);
    });
});

describe('number values', () => {
    it('reads number literals', () => {
        expect(numberAttribute([expression('minPoints', '-2')], 'minPoints')).toBe(-2);
        expect(numberAttribute([], 'minPoints')).toBeUndefined();
        expect(numberAttribute([expression('minPoints', 'min')], 'minPoints')).toBeNull();
        expect(numberAttribute([string('minPoints', '2')], 'minPoints')).toBeNull();
    });

    it('writes numbers as expressions and removes empty values', () => {
        expect(withNumberValue([], 'minPoints', 0.5)).toEqual([expression('minPoints', '0.5')]);
        expect(withNumberValue([expression('minPoints', '1')], 'minPoints', undefined)).toEqual([]);
    });
});
