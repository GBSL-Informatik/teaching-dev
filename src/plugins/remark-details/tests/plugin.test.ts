import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import remarkMdx from 'remark-mdx';
import { describe, expect, it } from 'vitest';
import { PluginOptions } from '../plugin';

const alignLeft = (content: string) => {
    return content
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n');
};
const process = async (content: string, config: PluginOptions = {}) => {
    const { default: plugin } = await import('../plugin');
    const result = await remark()
        .use(remarkMdx)
        .use(remarkDirective)
        .use(plugin, config)
        .process(alignLeft(content));

    return result.value;
};

describe('#details', () => {
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
    it('can set class names', async () => {
        const input = alignLeft(`# Details element example
          :::details[hello]
          Hello world!
          :::
          Byyye!
        `);
        const result = await process(input, { classNames: { details: 'details', summary: 'summary' } });
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <details className="details">
            <summary className="summary">
              hello
            </summary>

            Hello world!
          </details>

          Byyye!
          "
        `);
    });
    it('can customize default label name', async () => {
        const input = alignLeft(`# Details element example
          :::details
          Hello world!
          :::
          Byyye!
        `);
        const result = await process(input, { defaultLabel: { details: 'Foo' } });
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <details>
            <summary>
              Foo
            </summary>

            Hello world!
          </details>

          Byyye!
          "
        `);
    });
    it('can customize tag names', async () => {
        const input = alignLeft(`# Details element example
          :::details[hello]
          Hello world!
          :::
          Byyye!
        `);
        const result = await process(input, { tagNames: { details: 'Details', summary: 'Summary' } });
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <Details>
            <Summary>
              hello
            </Summary>

            Hello world!
          </Details>

          Byyye!
          "
        `);
    });
    it('can use custom keywords', async () => {
        const input = alignLeft(`# Details element example
            :::solution
            Hello world!
            :::
            Byyye!
        `);
        const result = await process(input, { directiveNames: ['solution'] });
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <details>
            Hello world!
          </details>

          Byyye!
          "
        `);
    });
    it('can use custom directive name', async () => {
        const input = alignLeft(`# Details element example
            :::solution[Lösung]
            Hello world!
            :::
            Byyye!
        `);
        const result = await process(input, { directiveNames: ['solution'] });
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <details>
            <summary>
              Lösung
            </summary>

            Hello world!
          </details>

          Byyye!
          "
        `);
    });
    it('can use custom directive name and default label', async () => {
        const input = alignLeft(`# Details element example
            :::solution
            Hello world!
            :::
            Byyye!
        `);
        const result = await process(input, {
            directiveNames: ['solution'],
            defaultLabel: { solution: 'Lösung' }
        });
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <details>
            <summary>
              Lösung
            </summary>

            Hello world!
          </details>

          Byyye!
          "
        `);
    });
    it('can use custom keywords with className config', async () => {
        const input = alignLeft(`# Details element example
            :::solution[Lösung]
            Hello world!
            :::
            Byyye!
        `);
        const result = await process(input, {
            directiveNames: ['solution'],
            classNames: { solution: 'solution' }
        });
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <details className="solution">
            <summary>
              Lösung
            </summary>

            Hello world!
          </details>

          Byyye!
          "
        `);
    });
});

describe('#details colors', () => {
    it('maps admonition types to alert classes', async () => {
        const input = alignLeft(`:::details[Danger]{.danger}
            Hello world!
            :::
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<details className="alert--danger">
            <summary>
              Danger
            </summary>

            Hello world!
          </details>
          "
        `);
    });
    it('maps color aliases to alert classes', async () => {
        const input = alignLeft(`:::details[Red]{.red}
            Hello world!
            :::
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<details className="alert--danger">
            <summary>
              Red
            </summary>

            Hello world!
          </details>
          "
        `);
    });
    it('keeps other classes next to the color', async () => {
        const input = alignLeft(`:::solution[Lösung]{.custom .tip}
            Hello world!
            :::
        `);
        const result = await process(input, {
            directiveNames: ['solution'],
            classNames: { solution: 'solution' }
        });
        expect(result).toMatchInlineSnapshot(`
          "<details className="solution custom alert--success">
            <summary>
              Lösung
            </summary>

            Hello world!
          </details>
          "
        `);
    });
    it('accepts custom colors from the config', async () => {
        const input = alignLeft(`:::details[Purple]{.purple}
            Hello world!
            :::
        `);
        const result = await process(input, { colors: { purple: 'primary' } });
        expect(result).toMatchInlineSnapshot(`
          "<details className="alert--primary">
            <summary>
              Purple
            </summary>

            Hello world!
          </details>
          "
        `);
    });
    it('lets custom colors override the defaults', async () => {
        const input = alignLeft(`:::details[Red]{.red}
            Hello world!
            :::
        `);
        const result = await process(input, { colors: { red: 'warning' } });
        expect(result).toMatchInlineSnapshot(`
          "<details className="alert--warning">
            <summary>
              Red
            </summary>

            Hello world!
          </details>
          "
        `);
    });
    it('ignores classes named like object properties', async () => {
        const input = alignLeft(`:::details[Constructor]{.constructor}
            Hello world!
            :::
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<details className="constructor">
            <summary>
              Constructor
            </summary>

            Hello world!
          </details>
          "
        `);
    });
    it('uses the blue alert for blue and the info alert for lightBlue', async () => {
        const input = alignLeft(`:::details[Blue]{.blue}
            Hello world!
            :::

            :::details[Light Blue]{.lightBlue}
            Hello world!
            :::
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<details className="alert--blue">
            <summary>
              Blue
            </summary>

            Hello world!
          </details>

          <details className="alert--info">
            <summary>
              Light Blue
            </summary>

            Hello world!
          </details>
          "
        `);
    });
});
