import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { describe, expect, it } from 'vitest';
import { PluginOptions } from '../plugin';
import { VFile } from 'vfile';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);

const alignLeft = (content: string) => {
    return content
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n');
};

const process = async (
    content: string,
    config: PluginOptions = {
        components: [{ name: 'Foo', attributeName: 'code', codeAttributesName: 'codeAttributes' }],
        rawCodeComponents: [{ name: 'Raw', attributeName: 'code' }]
    }
) => {
    const { default: plugin } = await import('../plugin');
    const file = new VFile({ value: content, history: [__filename] });
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin, config).process(file);

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

    it('allows to process raw code components', async () => {
        const input = `# Code
        
        <Raw>
            <div>Some content</div>
            And more of whatever content you want to put in here.
        </Raw>

        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Code

          <Raw
            code="<div>Some content</div>
          And more of whatever content you want to put in here."
          >
            <div>Some content</div>
            And more of whatever content you want to put in here.
          </Raw>
          "
        `);
    });
});
