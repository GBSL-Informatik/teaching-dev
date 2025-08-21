import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { describe, expect, it } from 'vitest';
import { VFile } from 'vfile';
import { PluginOptions } from '../plugin';

const alignLeft = (content: string) => {
    return content
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n');
};
const process = async (
    content: string,
    pageId: string | null = 'd2f1b301-fbea-4289-8ab0-19c8a6c4ded0',
    options?: PluginOptions
) => {
    const { default: plugin } = (await import('../plugin')) as any;
    const file = new VFile(alignLeft(content));
    file.data = { frontMatter: { page_id: pageId } };
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin, options).process(file);

    return result.value;
};

describe('#comment', () => {
    it('does nothing when page_id is missing in the frontMatter', async () => {
        const input = `# Heading

            [hello](https://hello.world)

            \`\`\`py
            print('Some Code')
            \`\`\`
            `;
        const result = await process(input, null);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          [hello](https://hello.world)

          \`\`\`py
          print('Some Code')
          \`\`\`
          "
        `);
    });
    it('add comment annotations', async () => {
        const input = `# Heading

            [hello](https://hello.world)

            Some text in a paragraph.

            \`\`\`py
            print('Some Code')
            \`\`\`
            `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <MdxComment nr={1} commentNr={1} type="heading" pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />

          [hello](https://hello.world)

          <MdxComment nr={1} commentNr={2} type="paragraph" pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />

          Some text in a paragraph.

          <MdxComment nr={2} commentNr={3} type="paragraph" pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />

          \`\`\`py
          print('Some Code')
          \`\`\`

          <MdxComment nr={1} commentNr={4} type="code" pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />
          "
        `);
    });
    it('does not add comments to live codeblocks', async () => {
        const input = `
            \`\`\`py noComment
            print('Some Code')
            \`\`\`
            `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "\`\`\`py noComment
          print('Some Code')
          \`\`\`
          "
        `);
    });
    it('annotates lists', async () => {
        const input = `
            - hello
            - \`bello\`
            - cello
            `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "* hello
          <MdxComment nr={1} commentNr={1} type="listItem" pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />
          * \`bello\`
          <MdxComment nr={2} commentNr={2} type="listItem" pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />
          * cello
          <MdxComment nr={3} commentNr={3} type="listItem" pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />
          "
        `);
    });
    it('annotates figures when specified over commentableJsxFlowElements', async () => {
        const input = `
            <Figure>
                Whatever
            </Figure>
            `;
        const result = await process(input, undefined, { commentableJsxFlowElements: ['Figure'] });
        expect(result).toMatchInlineSnapshot(`
          "<Figure>
            Whatever
          </Figure>

          <MdxComment nr={1} commentNr={1} type="mdxJsxFlowElement" pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />
          "
        `);
    });
    it('ignores the summary in details', async () => {
        const input = `
            <details>
                <summary>
                Bla bli blu
                </summary>
                Some really interesting content.
            </details>
            `;
        const result = await process(input, undefined, { ignoreJsxFlowElements: ['summary'] });
        expect(result).toMatchInlineSnapshot(`
          "<details>
            <summary>
              Bla bli blu
            </summary>

            Some really interesting content.

            <MdxComment nr={1} commentNr={1} type="paragraph" pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />
          </details>
          "
        `);
    });

    it('ignores divs with classname .noComment', async () => {
        const input = `
        <div className="noComment">
            This should not be commented.
        </div>
        <div>
            This should be commented.
        </div>
        `;
        const result = await process(input, undefined, { ignoreFlowElementsWithClass: /noComment/ });
        expect(result).toMatchInlineSnapshot(`
          "<div className="noComment">
            This should not be commented.
          </div>

          <div>
            This should be commented.

            <MdxComment nr={1} commentNr={1} type="paragraph" pageId="d2f1b301-fbea-4289-8ab0-19c8a6c4ded0" />
          </div>
          "
        `);
    });
});
