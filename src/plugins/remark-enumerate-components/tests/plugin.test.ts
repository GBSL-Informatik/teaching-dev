import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import remarkMdx from 'remark-mdx';
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

describe('#enumerate-answers', () => {
    it("does nothing if there's no media", async () => {
        const input = `# Heading

            [hello](https://hello.world)
            `;
        const result = await process(input);
        expect(result).toBe(alignLeft(input));
    });
    it('enumerates <Answer />', async () => {
        const input = `
          <Answer type="state" id="8110417c-43dc-4216-8d76-e9c2d8357acc"/>
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<Answer type="state" id="8110417c-43dc-4216-8d76-e9c2d8357acc" pagePosition={1} />
          "
        `);
    });

    it('enumerates multiple <Answer />s', async () => {
        const input = `
        <Answer type="state" id="8110417c-43dc-4216-8d76-e9c2d8357acc"/>
        <Answer type="state" id="8affbdfd-1811-4e5b-b586-167f198874e6"/>
      `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "<Answer type="state" id="8110417c-43dc-4216-8d76-e9c2d8357acc" pagePosition={1} />

        <Answer type="state" id="8affbdfd-1811-4e5b-b586-167f198874e6" pagePosition={2} />
        "
      `);
    });

    it('enumerates multiple <Answer />s', async () => {
        const input = `
      <Answer type="state" id="8110417c-43dc-4216-8d76-e9c2d8357acc"/>
      <Answer type="text" id="8affbdfd-1811-4e5b-b586-167f198874e6"/>
    `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
      "<Answer type="state" id="8110417c-43dc-4216-8d76-e9c2d8357acc" pagePosition={1} />

      <Answer type="text" id="8affbdfd-1811-4e5b-b586-167f198874e6" pagePosition={2} />
      "
    `);
    });

    it('enumerates inlined <Answer />s', async () => {
        const input = `
      ## <Answer type="state" inline id="8110417c-43dc-4216-8d76-e9c2d8357acc"/> a Title
      And some text
    `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "## <Answer type="state" inline id="8110417c-43dc-4216-8d76-e9c2d8357acc" pagePosition={1} /> a Title

        And some text
        "
      `);
    });
});
