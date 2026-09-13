import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import remarkMdx from 'remark-mdx';
import { describe, expect, it } from 'vitest';

const process = async (content: string, config: { prefix?: string | null; postfix?: string | null } = {}) => {
    const { default: plugin } = await import('../plugin');
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin, config).process(content);

    return result.value;
};

describe('#link annotation', () => {
    it("does nothing if there's no link", async () => {
        const input = `# Heading

Some content
`;
        const result = await process(input);
        expect(result).toBe(input);
    });
    it('can convert links', async () => {
        const input = `# Details element example
        Hello [example](https://example.org) world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        Hello [👉 example](https://example.org) world!
        "`);
    });

    it('does not append the prefix, if it is already there', async () => {
        const input = `# Details element example
        Hello [👉 example](https://example.org) world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        Hello [👉 example](https://example.org) world!
        "`);
    });

    it('can configure the prefix', async () => {
        const input = `# Details element example
        Hello [example](https://example.org) world!
        `;
        const result = await process(input, { prefix: '🔗' });
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        Hello [🔗 example](https://example.org) world!
        "`);
    });

    it('can set a postfix', async () => {
        const input = `# Details element example
        Hello [example](https://example.org) world!
        `;
        const result = await process(input, { prefix: null, postfix: '🔗' });
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        Hello [example 🔗](https://example.org) world!
        "`);
    });
});
