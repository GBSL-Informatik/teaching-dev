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
    const result = await remark()
        .use(remarkMdx)
        .use(remarkDirective)
        .use(plugin, { className: 'underline' } as any)
        .process(alignLeft(content));

    return result.value;
};

describe('#underline', () => {
    it("does nothing if there's no underline", async () => {
        const input = `# Heading

Some content
`;
        const result = await process(input);
        expect(result).toBe(input);
    });
    it('can convert underline', async () => {
        const input = `# Details element example
        Hello __ctrl__ world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          Hello <strong className="underline">ctrl</strong> world!
          "
        `);
    });

    it('can convert complex underline', async () => {
        const input = `# Details element example
        Hello __ctrl + [x](https://hello.world)__ world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          Hello <strong className="underline">ctrl + [x](https://hello.world)</strong> world!
          "
        `);
    });
});
