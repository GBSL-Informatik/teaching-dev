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

describe('#defbox', () => {
    it("does nothing if there's no defbox", async () => {
        const input = `# Heading

            Some content
        `;
        const result = await process(input);
        expect(result).toBe(alignLeft(input));
    });
    it('can convert defbox', async () => {
        const input = alignLeft(`# Details element example
            :::def[Hello World]
            Hello world!
            :::
            Byyye!
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <DefBox>
            <DefHeading>
              ### Hello World
            </DefHeading>

            <DefContent>
              Hello world!
            </DefContent>
          </DefBox>

          Byyye!
          "
        `);
    });
    it('can use custom header depth', async () => {
        const input = alignLeft(`# Details element example
          :::def[Hello World]{h=2}
          Hello world!
          :::
          Byyye!
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <DefBox>
          <DefHeading>
            ## Hello World
          </DefHeading>

          <DefContent>
            Hello world!
          </DefContent>
        </DefBox>

        Byyye!
        "
      `);
    });
    it('can convert defbox without title', async () => {
        const input = alignLeft(`# Details element example
            :::def
            Hello world!
            :::
            Byyye!
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <DefBox>
            <DefHeading>
              ### Definition
            </DefHeading>

            <DefContent>
              Hello world!
            </DefContent>
          </DefBox>

          Byyye!
          "
        `);
    });
});
