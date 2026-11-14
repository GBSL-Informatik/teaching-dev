import { describe, expect, it } from 'vitest';
import { schema } from '../schema';

describe('clipboard rules of the schema', () => {
    it('parse the html of the node they are defined for', () => {
        schema.spec.nodes.forEach((name, spec) => {
            for (const rule of spec.parseDOM ?? []) {
                const parsedNode =
                    'tag' in rule ? rule.tag?.match(/data-cms-node="([^"]+)"/)?.[1] : undefined;
                if (parsedNode) {
                    expect(parsedNode, `the clipboard rule of ${name}`).toBe(name);
                }
            }
        });
    });
});
