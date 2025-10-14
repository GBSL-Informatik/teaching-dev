import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { describe, expect, it } from 'vitest';
import { PluginOptions } from '../plugin';

const process = async (
    content: string,
    config: PluginOptions = {
        components: [{ name: 'Foo', attributeName: 'code', codeAttributesName: 'codeAttributes' }]
    }
) => {
    const { default: plugin } = await import('../plugin');
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin, config).process(content);

    return result.value;
};

describe('#code-as-attribute plugin', () => {
    it("does nothing if there's no code", async () => {
        const input = `# Heading

Some content
`;
        const result = await process(input);
        expect(result).toBe(input);
    });
    it('can transform code to attributes', async () => {
        const input = `# Details element example
        
        <Foo>
        \`\`\`
        print('hello world')
        print('foobar!')
        \`\`\`
        </Foo>
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <Foo
            code="print('hello world')
          print('foobar!')"
          />
          "
        `);
    });
    it('can transform code to attributes and append code meta', async () => {
        const input = `# Details element example
        
        <Foo>
        \`\`\`py title="Example code"
        print('hello world')
        print('foobar!')
        \`\`\`
        </Foo>
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <Foo
            codeAttributes={{"meta":"title=\\"Example code\\"","lang":"py"}}
            code="print('hello world')
          print('foobar!')"
          />
          "
        `);
    });
    it('can transform inlineCode to attributes', async () => {
        const input = `# Details element example
        
        Hello <Foo>\`bar\`</Foo> bazz.
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          Hello <Foo code="bar" /> bazz.
          "
        `);
    });

    it('escapes newlines from inlineCode to attributes', async () => {
        const input = `# Details element example
        
        Hello <Foo>\`bar\nbazz\`</Foo> bazz.
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          Hello <Foo code="bar\\nbazz" /> bazz.
          "
        `);
    });

    it('allows to process multiple code blocks', async () => {
        const input = `# Code
        
        <Foo>
        \`\`\`py
        print('hello world')
        print('foobar!')
        \`\`\`
        \`\`\`ts id="123" path="./foo/bar.ts"
        print('hello world')
        print('foobazz!')
        \`\`\`
        </Foo>

        `;
        const result = await process(input, {
            components: [
                {
                    name: 'Foo',
                    attributeName: 'blocks',
                    codeAttributesName: 'codeAttributes',
                    processMultiple: true
                }
            ]
        });
        expect(result).toMatchInlineSnapshot(`
          "# Code

          <Foo blocks={[{"code":"print('hello world')\\nprint('foobar!')","lang":"py"},{"code":"print('hello world')\\nprint('foobazz!')","meta":"id=\\"123\\" path=\\"./foo/bar.ts\\"","lang":"ts"}]} />
          "
        `);
    });
});
