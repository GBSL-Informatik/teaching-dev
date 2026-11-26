import { describe, expect, it } from 'vitest';
import type { JsxAttribute } from '../../schema';
import { isStatementTrue, withStatementTrue } from '../trueFalseAnswer';

const flag = (name: string): JsxAttribute => ({ type: 'attribute', name, value: null });
const expression = (name: string, value: string): JsxAttribute => ({
    type: 'expressionAttribute',
    name,
    value
});

describe('isStatementTrue', () => {
    it('reads the forms of the answer like the model', () => {
        expect(isStatementTrue([expression('correct', 'true')])).toBe(true);
        expect(isStatementTrue([expression('correct', 'false')])).toBe(false);
        expect(isStatementTrue([flag('isTrue')])).toBe(true);
        expect(isStatementTrue([flag('isFalse')])).toBe(false);
        expect(isStatementTrue([])).toBe(false);
    });

    it('rejects expressions', () => {
        expect(isStatementTrue([expression('correct', 'answer')])).toBeNull();
    });
});

describe('withStatementTrue', () => {
    it('replaces the other forms by correct', () => {
        const id: JsxAttribute = { type: 'attribute', name: 'id', value: '1' };
        expect(withStatementTrue([flag('isFalse'), id], true)).toEqual([id, expression('correct', 'true')]);
        expect(withStatementTrue([expression('correct', 'true'), id], false)).toEqual([
            expression('correct', 'false'),
            id
        ]);
    });
});
