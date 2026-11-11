import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../../markdown';
import { fileTreeItems } from '../fileTree';

const treeDirective = (source: string) => parseMarkdown(source).doc.firstChild!;

describe('fileTreeItems', () => {
    it('reads the nested items', () => {
        const tree = treeDirective(':::tree\n- src\n  - `index.ts`\n  - lib\n    - a.ts\n:::\n');
        expect(fileTreeItems(tree)).toEqual([
            { name: 'src', children: ['index.ts', { name: 'lib', children: ['a.ts'] }] }
        ]);
    });

    it.each([
        ['formatted names', ':::tree\n- **src**\n:::\n'],
        ['task items', ':::tree\n- [ ] src\n:::\n'],
        ['content besides the list', ':::tree\nText\n\n- src\n:::\n'],
        ['several blocks in an item', ':::tree\n- src\n\n  Text\n:::\n']
    ])('rejects %s', (_, source) => {
        expect(fileTreeItems(treeDirective(source))).toBeNull();
    });
});
