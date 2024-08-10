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
    const { default: plugin } = await import('../plugin');
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin).process(alignLeft(content));

    return result.value;
};

describe('#flex', () => {
    it("does nothing if there's no flex", async () => {
        const input = `# Heading

            Some content
        `;
        const result = await process(input);
        expect(result).toBe(alignLeft(input));
    });
    it('can convert details', async () => {
        const input = alignLeft(`# Details element example
            :::details[Hello World]
            Hello world!
            :::
            Byyye!
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <details>
            <summary>
              Hello World
            </summary>

            Hello world!
          </details>

          Byyye!
          "
        `);
    });
    it('uses default summary when not provided', async () => {
        const input = alignLeft(`# Details element example
          :::details
          Hello world!
          :::
          Byyye!
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <details>
          Hello world!
        </details>

        Byyye!
        "
      `);
    });
});
