import type { Root } from 'mdast';
import type { MdxJsxFlowElement } from 'mdast-util-mdx';
import { format } from 'prettier';
import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import { describe, expect, it } from 'vitest';
import plugin from '../plugin';

const DIR_SOURCE = '@tdev-components/FileSystem/Dir';
const alignLeft = (content: string) => {
    const lines = content.split('\n');
    // Remove shared indentation while preserving the nesting of Markdown lists.
    const indent = Math.min(
        ...lines.filter((line) => line.trim()).map((line) => line.length - line.trimStart().length)
    );
    return lines.map((line) => line.slice(indent)).join('\n');
};

// Format generated JSX for readable snapshots; preserve raw output when testing other directives or code.
const formatMdx = (content: string) =>
    format(content, {
        parser: 'mdx',
        tabWidth: 4,
        printWidth: 110,
        singleQuote: true,
        trailingComma: 'none'
    });
const transform = async (content: string, pretty = true) => {
    const file = new VFile({ value: content, path: '/docs/tree.mdx' });
    const result = await remark()
        .use(remarkMdx)
        .use(remarkDirective)
        .use(remarkGfm)
        .use(plugin)
        .process(file);
    return pretty ? formatMdx(String(result.value)) : String(result.value);
};
const parseMdx = (content: string) => remark().use(remarkMdx).parse(content);
const dirImports = (root: Root) =>
    root.children
        .filter((node) => node.type === 'mdxjsEsm')
        .flatMap((node) => node.data?.estree?.body || [])
        .filter((node) => node.type === 'ImportDeclaration' && node.source.value === DIR_SOURCE);
const treeNodes = (root: Root) => {
    const nodes: MdxJsxFlowElement[] = [];
    visit(root, 'mdxJsxFlowElement', (node) => {
        if (
            node.attributes.some(
                (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'dir'
            )
        ) {
            nodes.push(node);
        }
    });
    return nodes;
};

// Extract the live gallery JSX and its import so the snapshot is a complete, valid MDX document.
const galleryTrees = (content: string) => {
    const root = parseMdx(content);
    const imports = root.children.filter(
        (node) => node.type === 'mdxjsEsm' && dirImports({ type: 'root', children: [node] }).length > 0
    );
    return formatMdx(
        remark()
            .use(remarkMdx)
            .stringify({ type: 'root', children: [...imports, ...treeNodes(root)] })
    );
};

describe('remark-file-trees', () => {
    it('uses a single named root with nested directories and files', async () => {
        const input = alignLeft(`
            :::tree
            - src
              - components
                - Button.tsx
              - index.ts
            :::
        `);
        expect(await transform(input)).toMatchInlineSnapshot(`
              "import Dir from '@tdev-components/FileSystem/Dir';

              <Dir dir={{ name: 'src', children: [{ name: 'components', children: ['Button.tsx'] }, 'index.ts'] }} open />
              "
            `);
    });

    it('uses a lone item as an empty root, even if its name has a file extension', async () => {
        const input = alignLeft(`
            :::tree
            - src
            :::

            :::tree
            - README.md
            :::
        `);
        expect(await transform(input)).toMatchInlineSnapshot(`
          "import Dir from '@tdev-components/FileSystem/Dir';

          <Dir dir={{ name: 'src', children: [] }} open />

          <Dir dir={{ name: 'README.md', children: [] }} open />
          "
        `);
    });

    it('wraps multiple top-level items in / and preserves every sibling order', async () => {
        const input = alignLeft(`
            :::tree
            - src
              - components
                - foo.docx
                - bar.js
              - utils
                - helper.ts
                - dir
                  - index.ts
            - public
              - index.html
              - favicon.ico
            - README.md
            :::
        `);
        expect(await transform(input)).toMatchInlineSnapshot(`
          "import Dir from '@tdev-components/FileSystem/Dir';

          <Dir
              dir={{
                  name: '/',
                  children: [
                      {
                          name: 'src',
                          children: [
                              { name: 'components', children: ['foo.docx', 'bar.js'] },
                              { name: 'utils', children: ['helper.ts', { name: 'dir', children: ['index.ts'] }] }
                          ]
                      },
                      { name: 'public', children: ['index.html', 'favicon.ico'] },
                      'README.md'
                  ]
              }}
              open
          />
          "
        `);
    });

    it('uses nested lists, rather than extensions or trailing slashes, to identify directories', async () => {
        const input = alignLeft(`
            :::tree
            - root
              - folder/
              - no-extension
              - archive.zip
                - README.md
            :::
        `);
        expect(await transform(input)).toMatchInlineSnapshot(`
          "import Dir from '@tdev-components/FileSystem/Dir';

          <Dir
              dir={{
                  name: 'root',
                  children: ['folder/', 'no-extension', { name: 'archive.zip', children: ['README.md'] }]
              }}
              open
          />
          "
        `);
    });

    it('supports ordered lists, inline code and escaped characters without changing names', async () => {
        const input = alignLeft(`
            :::tree
            1. \`project & notes\`
               1. \`a "quote".txt\`
               2. \\*literal\\*.md
               3. 日本語.txt
            :::
        `);
        expect(await transform(input)).toMatchInlineSnapshot(`
          "import Dir from '@tdev-components/FileSystem/Dir';

          <Dir dir={{ name: 'project & notes', children: ['a "quote".txt', '*literal*.md', '日本語.txt'] }} open />
          "
        `);
    });

    it('inserts one import for multiple directives, including trees nested in JSX', async () => {
        const input = alignLeft(`
            :::tree
            - src
            :::

            <div>

            :::tree
            - public
            :::

            </div>
        `);
        const output = await transform(input);
        const root = parseMdx(output);
        expect(dirImports(root)).toHaveLength(1);
        expect(treeNodes(root)).toHaveLength(2);
        expect(output).toMatchInlineSnapshot(`
          "import Dir from '@tdev-components/FileSystem/Dir';

          <Dir dir={{ name: 'src', children: [] }} open />

          <div>
              <Dir dir={{ name: 'public', children: [] }} open />
          </div>
          "
        `);
    });

    it('reuses an existing Dir import even when it follows the directive', async () => {
        const input = alignLeft(`
            :::tree
            - src
            :::

            import Dir from "${DIR_SOURCE}";
        `);
        const output = await transform(input);
        expect(dirImports(parseMdx(output))).toHaveLength(1);
        expect(output).toMatchInlineSnapshot(`
          "<Dir dir={{ name: 'src', children: [] }} open />

          import Dir from '@tdev-components/FileSystem/Dir';
          "
        `);
    });

    it('reuses an explicit named default import of Dir', async () => {
        const input = alignLeft(`
            import { default as Dir } from '${DIR_SOURCE}';

            :::tree
            - src
            :::
        `);
        const output = await transform(input);
        expect(dirImports(parseMdx(output))).toHaveLength(1);
        expect(output).toMatchInlineSnapshot(`
          "import { default as Dir } from '@tdev-components/FileSystem/Dir';

          <Dir dir={{ name: 'src', children: [] }} open />
          "
        `);
    });

    it('defaults open to true and converts explicit boolean values and the bare attribute', async () => {
        const input = alignLeft(`
            :::tree
            - src
            :::

            :::tree{open}
            - src
            :::

            :::tree{open="true"}
            - src
            :::

            :::tree{open="false"}
            - src
            :::
        `);
        expect(await transform(input)).toMatchInlineSnapshot(`
          "import Dir from '@tdev-components/FileSystem/Dir';

          <Dir dir={{ name: 'src', children: [] }} open />

          <Dir dir={{ name: 'src', children: [] }} open />

          <Dir dir={{ name: 'src', children: [] }} open />

          <Dir dir={{ name: 'src', children: [] }} open={false} />
          "
        `);
    });

    it('preserves CSS heights as strings, converts zero, and omits maxHeight when absent', async () => {
        const input = alignLeft(`
            :::tree
            - src
            :::

            :::tree{open="false" maxHeight="240px"}
            - src
            :::

            :::tree{open="false" maxHeight="20rem"}
            - src
            :::

            :::tree{open="false" maxHeight="50vh"}
            - src
            :::

            :::tree{open="false" maxHeight="100%"}
            - src
            :::

            :::tree{open="false" maxHeight="none"}
            - src
            :::

            :::tree{open="false" maxHeight="calc(100vh - 2rem)"}
            - src
            :::

            :::tree{open="false" maxHeight="var(--tree-height)"}
            - src
            :::

            :::tree{open="false" maxHeight="0"}
            - src
            :::
        `);
        const output = await transform(input);
        const nodes = treeNodes(parseMdx(output));
        expect(
            nodes[0].attributes.some(
                (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'maxHeight'
            )
        ).toBe(false);
        expect(
            nodes
                .slice(1)
                .every((node) =>
                    node.attributes.some(
                        (attribute) =>
                            attribute.type === 'mdxJsxAttribute' &&
                            attribute.name === 'maxHeight' &&
                            typeof attribute.value === 'string'
                    )
                )
        ).toBe(true);
        expect(output).toMatchInlineSnapshot(`
          "import Dir from '@tdev-components/FileSystem/Dir';

          <Dir dir={{ name: 'src', children: [] }} open />

          <Dir dir={{ name: 'src', children: [] }} open={false} maxHeight="240px" />

          <Dir dir={{ name: 'src', children: [] }} open={false} maxHeight="20rem" />

          <Dir dir={{ name: 'src', children: [] }} open={false} maxHeight="50vh" />

          <Dir dir={{ name: 'src', children: [] }} open={false} maxHeight="100%" />

          <Dir dir={{ name: 'src', children: [] }} open={false} maxHeight="none" />

          <Dir dir={{ name: 'src', children: [] }} open={false} maxHeight="calc(100vh - 2rem)" />

          <Dir dir={{ name: 'src', children: [] }} open={false} maxHeight="var(--tree-height)" />

          <Dir dir={{ name: 'src', children: [] }} open={false} maxHeight="0" />
          "
        `);
    });

    const invalidList = 'A tree directive must contain exactly one Markdown list.';
    const invalidItem = 'Tree items must contain a name and at most one nested list.';
    const invalidName = 'Tree names support only plain text and inline code.';
    const invalidOpen = 'The tree open attribute must be true or false.';
    const invalidHeight =
        'The tree maxHeight attribute must be a CSS height (e.g. 240px, 20rem, 50vh, none or 0).';
    it.each([
        [
            'empty directive',
            `
                :::tree
                :::
            `,
            invalidList
        ],
        [
            'non-list content',
            `
                :::tree
                Not a list
                :::
            `,
            invalidList
        ],
        [
            'extra content',
            `
                :::tree
                - src

                Extra paragraph
                :::
            `,
            invalidList
        ],
        [
            'multiple lists',
            `
                :::tree
                - src

                1. public
                :::
            `,
            invalidList
        ],
        [
            'directive label',
            `
                :::tree[Title]
                - src
                :::
            `,
            invalidList
        ],
        [
            'extra paragraph',
            `
                :::tree
                - src

                  Description
                :::
            `,
            invalidItem
        ],
        [
            'code block',
            `
                :::tree
                - src

                  \`\`\`js
                  code
                  \`\`\`
                :::
            `,
            invalidItem
        ],
        [
            'blockquote',
            `
                :::tree
                - src
                  > quote
                :::
            `,
            invalidItem
        ],
        [
            'task list',
            `
                :::tree
                - [ ] src
                :::
            `,
            invalidItem
        ],
        [
            'emphasis',
            `
                :::tree
                - **src**
                :::
            `,
            invalidName
        ],
        [
            'link',
            `
                :::tree
                - [src](./src)
                :::
            `,
            invalidName
        ],
        [
            'image',
            `
                :::tree
                - ![src](./src.png)
                :::
            `,
            invalidName
        ],
        [
            'JSX',
            `
                :::tree
                - <span>src</span>
                :::
            `,
            invalidName
        ],
        [
            'MDX expression',
            `
                :::tree
                - {name}
                :::
            `,
            invalidItem
        ],
        [
            'hard break',
            `
                :::tree
                - src\\
                  name
                :::
            `,
            invalidName
        ],
        [
            'empty name',
            `
                :::tree
                -
                :::
            `,
            invalidItem
        ],
        [
            'invalid open',
            `
                :::tree{open="yes"}
                - src
                :::
            `,
            invalidOpen
        ],
        [
            'numeric open',
            `
                :::tree{open="1"}
                - src
                :::
            `,
            invalidOpen
        ],
        [
            'unitless height',
            `
                :::tree{maxHeight="240"}
                - src
                :::
            `,
            invalidHeight
        ],
        [
            'empty height',
            `
                :::tree{maxHeight}
                - src
                :::
            `,
            invalidHeight
        ],
        [
            'boolean height',
            `
                :::tree{maxHeight="false"}
                - src
                :::
            `,
            invalidHeight
        ]
    ])('rejects %s with a source location', async (_name, input, reason) => {
        await expect(transform(alignLeft(input))).rejects.toMatchObject({
            source: 'remark-file-trees',
            file: '/docs/tree.mdx',
            reason,
            line: expect.any(Number)
        });
    });

    it('ignores unrecognized tree attributes', async () => {
        const input = alignLeft(`
            :::tree{.custom #example other="value"}
            - src
            :::
        `);
        expect(await transform(input)).toMatchInlineSnapshot(`
          "import Dir from '@tdev-components/FileSystem/Dir';

          <Dir dir={{ name: 'src', children: [] }} open />
          "
        `);
    });

    it('preserves unrelated Markdown, directives and code, without inserting an unused import', async () => {
        const input = alignLeft(`
            # Heading

            Paragraph with **bold** text.

            :::other
            - item
            :::

            ::tree[label]

            :tree[label]

            \`\`\`md
            :::tree
            - src
            :::
            \`\`\`
        `);
        const output = await transform(input, false);
        expect(dirImports(parseMdx(output))).toHaveLength(0);
        expect(output).toMatchInlineSnapshot(`
          "# Heading

          Paragraph with **bold** text.

          :::other
          * item
          :::

          ::tree[label]

          :tree[label]

          \`\`\`md
          :::tree
          - src
          :::
          \`\`\`
          "
        `);
    });

    it('preserves content surrounding a transformed tree and other container directives', async () => {
        const input = alignLeft(`
            # Heading

            Before.

            :::tree
            - src
            :::

            :::other
            After.
            :::
        `);
        expect(await transform(input, false)).toMatchInlineSnapshot(`
          "import Dir from '@tdev-components/FileSystem/Dir';

          # Heading

          Before.

          <Dir dir={{"name":"src","children":[]}} open />

          :::other
          After.
          :::
          "
        `);
    });
});
