import { describe, expect, it } from 'vitest';
import { QUICK_ACTION_PATTERN } from '../quickActionPattern';

const queryOf = (textBefore: string) => QUICK_ACTION_PATTERN.exec(textBefore)?.[1] ?? null;

describe('the typed text opening the quick actions', () => {
    it('opens them with `/` at the start or after whitespace', () => {
        expect(queryOf('/tip')).toBe('tip');
        expect(queryOf('Some text />')).toBe('>');
        expect(queryOf('a/b')).toBeNull();
    });

    it('does not open them with the `/` of a self-closing jsx tag', () => {
        expect(queryOf('<Foo /')).toBeNull();
        expect(queryOf('Text <Foo bar="baz" />')).toBeNull();
    });

    it('opens them after a closed jsx tag or a lone `<`', () => {
        expect(queryOf('<Foo> /tip')).toBe('tip');
        expect(queryOf('<Foo /> /tip')).toBe('tip');
        expect(queryOf('a < b /tip')).toBe('tip');
    });
});
