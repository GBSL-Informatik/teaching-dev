import { describe, expect, it } from 'vitest';
import { metaUuids } from '../metaUuids';

const OLD = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const NEW = 'f9e8d7c6-b5a4-4321-9fed-cba987654321';

/** the name, uuid and meta string after replacing each uuid with `NEW` */
const replaced = (meta: string) =>
    metaUuids(meta).map(({ name, uuid, replace }) => ({ name, uuid, meta: replace(meta, NEW) }));

describe('metaUuids', () => {
    it('finds named and unnamed uuids', () => {
        expect(replaced(`live_py id=${OLD} ${NEW.replace('f9', 'a9')}`)).toEqual([
            { name: 'id', uuid: OLD, meta: `live_py id=${NEW} ${NEW.replace('f9', 'a9')}` },
            { name: 'uuid', uuid: NEW.replace('f9', 'a9'), meta: `live_py id=${OLD} ${NEW}` }
        ]);
    });

    it('finds quoted uuids', () => {
        expect(replaced(`live_py id="${OLD}"`)).toEqual([
            { name: 'id', uuid: OLD, meta: `live_py id="${NEW}"` }
        ]);
    });

    it('inserts a uuid into an id without a uuid', () => {
        expect(replaced('live_py id')).toEqual([{ name: 'id', uuid: undefined, meta: `live_py id=${NEW}` }]);
        expect(replaced('live_py id= title=a')).toEqual([
            { name: 'id', uuid: undefined, meta: `live_py id=${NEW} title=a` }
        ]);
        expect(replaced("id='my-id' live_py")).toEqual([
            { name: 'id', uuid: undefined, meta: `id='${NEW}' live_py` }
        ]);
        expect(replaced('live_py id=""')).toEqual([
            { name: 'id', uuid: undefined, meta: `live_py id="${NEW}"` }
        ]);
    });

    it('ignores attributes ending with id', () => {
        expect(replaced('live_py slid=3 valid')).toEqual([]);
    });
});
