import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { describe, expect, it } from 'vitest';

const alignLeft = (content: string) => {
    return content
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n');
};
const process = async (content: string) => {
    const { default: plugin } = (await import('../plugin')) as any;
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin).process(alignLeft(content));

    return result.value;
};

describe('#links', () => {
    it("does nothing if there's no pdf", async () => {
        const input = `# Heading

            [hello](https://hello.world)
            `;
        const result = await process(input);
        expect(result).toBe(alignLeft(input));
    });
    it('can convert pdf directive', async () => {
        const input = `# Details element example
        
        ::pdf[./assets/stairs.pdf]
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "import PdfViewer from '@tdev-components/PdfViewer';

          # Details element example

          <PdfViewer name="stairs.pdf" file={require('./assets/stairs.pdf').default} />
          "
        `);
    });
    it('can pass attributes', async () => {
        const input = `# Details element example
        
        ::pdf[./assets/stairs.pdf]{width=120 minWidth=100 noDownload}
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "import PdfViewer from '@tdev-components/PdfViewer';

          # Details element example

          <PdfViewer name="stairs.pdf" width={120} minWidth={100} noDownload file={require('./assets/stairs.pdf').default} />
          "
        `);
    });
});
