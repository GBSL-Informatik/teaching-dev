import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import remarkMdx from 'remark-mdx';
import { VFile } from 'vfile';
import { describe, expect, it } from 'vitest';

const alignLeft = (content: string) => {
    return content
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n');
};
const process = async (content: string, pageId: string | null = 'd2f1b301-fbea-4289-8ab0-19c8a6c4ded0') => {
    const { default: plugin } = (await import('../plugin')) as any;
    const file = new VFile(alignLeft(content));
    file.data = { frontMatter: { page_id: pageId } };
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin).process(file);

    return result.value;
};

describe('#page', () => {
    it('adds a MdxPage', async () => {
        const input = `# Heading

            [hello](https://hello.world)
            `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<MdxPage pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />

          # Heading

          [hello](https://hello.world)
          "
        `);
    });
    it('does not add a MdxPage when page_id is missing in the frontMatter', async () => {
        const input = `# Heading

            [hello](https://hello.world)
            `;
        const result = await process(input, null);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          [hello](https://hello.world)
          "
        `);
    });
});
