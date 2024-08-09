import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { describe, expect, it } from 'vitest';

const process = async (content: string) => {
    const { default: plugin } = await import('../plugin');
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin).process(content);

    return result.value;
};

describe('#kbd', () => {
    it("does nothing if there's no mdi", async () => {
        const input = `# Heading

Some content
`;
        const result = await process(input);
        expect(result).toBe(input);
    });
    it('can convert kbd', async () => {
        const input = `# Details element example
        Hello [[ctrl]] world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        Hello <kbd>ctrl</kbd> world!
        "`);
    });

    it('can convert multiple kbds', async () => {
        const input = `# Details element example
        Hello [[ctrl]] [[world]]!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          Hello <kbd>ctrl</kbd> <kbd>world</kbd>!
          "
        `);
    });

    it('can convert kbds in lists', async () => {
        const input = `# Details element example
        - [[ctrl]]
        - or [[cmd]]
        
        Hello [[F4]]!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          * <kbd>ctrl</kbd>
          * or <kbd>cmd</kbd>

          Hello <kbd>F4</kbd>!
          "
        `);
    });

    it('accepts closing ]] without converting to kbd', async () => {
        const input = `Hello ctrl]] world!`;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "Hello ctrl]] world!
        "`);
    });

    it('accepts opening [[ without converting to kbd', async () => {
        const input = `Hello [[ctrl world!`;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "Hello \\[\\[ctrl world!
        "`);
    });

    it('accepts unbalanced opening and closing brackets', async () => {
        const input = `Hello [[ctrl]] [[ world!`;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "Hello <kbd>ctrl</kbd> \\[\\[ world!
        "`);
    });

    it('accepts unbalanced opening and closing brackets', async () => {
        const input = `Hello [[ctrl]] ]] world!`;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "Hello <kbd>ctrl</kbd> ]] world!
        "`);
    });

    it('handels nested kbds', async () => {
        const input = `Hello [[ctrl + [[x]]]] world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "Hello <kbd>ctrl + <kbd>x</kbd></kbd> world!
        "`);
    });

    it('handels kbds in links', async () => {
        const input = `[[[ctrl]] + [[x]]](https://foobar.ch) world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "[<kbd>ctrl</kbd> + <kbd>x</kbd>](https://foobar.ch) world!
        "`);
    });
    it('handels links in kbds', async () => {
        const input = `[[ctrl + [x](https://foobar.ch)]] world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "<kbd>ctrl + [x](https://foobar.ch)</kbd> world!
        "`);
    });
});
