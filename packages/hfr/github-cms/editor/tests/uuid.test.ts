import { describe, expect, it } from 'vitest';
import { duplicatedUuids } from '../uuid';

const A = '0b6a1f9e-3c2d-4e5f-8a7b-1c2d3e4f5a6b';
const B = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

describe('duplicatedUuids', () => {
    it('returns nothing when each uuid occurs once', () => {
        expect(duplicatedUuids(`<Answer id="${A}" />\n<Answer id="${B}" />`)).toEqual([]);
    });

    it('counts the occurrences of each duplicated uuid', () => {
        const text = `page_id: ${A}\n\n<Answer id="${A}" />\n<Answer id="${B}" />\n<Answer id="${A}" />`;
        expect(duplicatedUuids(text)).toEqual([{ uuid: A, count: 3 }]);
    });

    it('ignores the case of the uuids', () => {
        expect(duplicatedUuids(`${A} ${A.toUpperCase()}`)).toEqual([{ uuid: A, count: 2 }]);
    });
});
