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

describe('#deflist', () => {
    it("does nothing if there's no deflist", async () => {
        const input = `# Heading

Some content
`;
        const result = await process(input);
        expect(result).toBe(input);
    });
    it('can convert simple text deflist', async () => {
        const input = `# Details element example
        Hello World
        : The simplest example
        World
        : Our planet
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <dl>
            <dt>Hello World</dt>

            <dd>The simplest example</dd>

            <dt>World</dt>

            <dd>Our planet</dd>
          </dl>
          "
        `);
    });
    it('can convert simple deflist with multiple dd', async () => {
        const input = `# Details element example
      Hello World
      : The simplest example
      : with double dd
      World
      : Our planet
      `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <dl>
          <dt>Hello World</dt>

          <dd>The simplest example</dd>

          <dd>with double dd</dd>

          <dt>World</dt>

          <dd>Our planet</dd>
        </dl>
        "
      `);
    });

    it('can convert simple deflist links in dl', async () => {
        const input = `# Details element example
      Hello [World](https://world.com)
      : The simplest example
      World
      : Our planet
      `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <dl>
          <dt>Hello [World](https://world.com)</dt>

          <dd>The simplest example</dd>

          <dt>World</dt>

          <dd>Our planet</dd>
        </dl>
        "
      `);
    });
    it('can convert simple deflist links in dd', async () => {
        const input = `# Details element example
      Hello World
      : The simplest [example](https://example.com)
      World
      : Our planet
      `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <dl>
          <dt>Hello World</dt>

          <dd>The simplest [example](https://example.com)</dd>

          <dt>World</dt>

          <dd>Our planet</dd>
        </dl>
        "
      `);
    });
    it('can convert deflist starting dt with a link', async () => {
        const input = `# Details element example
      [Hello](https://example.com) my [World](https://example.com)
      : [The](https://example.com) simplest
      World
      : Our planet
      `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <dl>
          <dt>[Hello](https://example.com) my [World](https://example.com)</dt>

          <dd>[The](https://example.com) simplest</dd>

          <dt>World</dt>

          <dd>Our planet</dd>
        </dl>
        "
      `);
    });

    it('ignores text directives', async () => {
        const input = `# Details element example
      [Hello](https://example.com) my [World](https://example.com)
      : [The](https://example.com) simplest
      :directive[Foo] Bar
      `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <dl>
          <dt>[Hello](https://example.com) my [World](https://example.com)</dt>

          <dd>[The](https://example.com) simplest</dd>
        </dl>

        :directive[Foo] Bar
        "
      `);
    });

    it('can have html elements within dd', async () => {
        const input = `# Details element example
      [Hello](https://example.com) my [World](https://example.com)
      : <span>hello
            bla
      </span> world`;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <dl>
          <dt>[Hello](https://example.com) my [World](https://example.com)</dt>

          <dd><span>hello
          bla
          </span> world</dd>
        </dl>
        "
      `);
    });

    it('can split inlined deflists', async () => {
        const input = `# Details element example
      Einige Vorteile:
      Definition Eins
      : Bli Bla Blu
      : und so weiter

`;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        Einige Vorteile:

        <dl>
          <dt>Definition Eins</dt>

          <dd>Bli Bla Blu</dd>

          <dd>und so weiter</dd>
        </dl>
        "
      `);
    });

    it('can handle false-positives', async () => {
        const input = `# Details element example
      : Bli Bla Blu
      : und so weiter
      `;

        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <dl>
          <dt>: Bli Bla Blu</dt>

          <dd>und so weiter</dd>
        </dl>
        "
      `);
    });

    it('can handle false-positives', async () => {
        const input = `# Details element example
      Lirum Larum

      And so on


      : Bli Bla Blu
      : und so weiter

      whatever between

      Lorem Ipsum
      : And a correct def
      Dolor Sit
      : And another correct def
      `;

        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        Lirum Larum

        And so on

        <dl>
          <dt>: Bli Bla Blu</dt>

          <dd>und so weiter</dd>
        </dl>

        whatever between

        <dl>
          <dt>Lorem Ipsum</dt>

          <dd>And a correct def</dd>

          <dt>Dolor Sit</dt>

          <dd>And another correct def</dd>
        </dl>
        "
      `);
    });

    it('converts complex deflist', async () => {
        const input = `# Details element example
      :mdi[icon]
      : An [MDI](https://mdi.com) icon with markup \`:mdi[icon]\`
      : :mdi[icon]
      : whatever it is, it is good
      <span>hello</span>
      : <span>world</span>
      : super fancy def with html

      a short break

      :::block
      deflist
      : in block
      :::
      `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <dl>
          <dt>:mdi[icon]</dt>

          <dd>An [MDI](https://mdi.com) icon with markup \`:mdi[icon]\`</dd>

          <dd>:mdi[icon]</dd>

          <dd>whatever it is, it is good</dd>

          <dt><span>hello</span></dt>

          <dd><span>world</span></dd>

          <dd>super fancy def with html</dd>
        </dl>

        a short break

        :::block
        <dl>
          <dt>deflist</dt>

          <dd>in block</dd>
        </dl>
        :::
        "
      `);
    });

    it('does not transform inline :', async () => {
        const input = `# Details element example
      - a: simple
      - b: list
      - c: with
      - d: colons
      `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        * a: simple
        * b: list
        * c: with
        * d: colons
        "
      `);
    });

    it('does not : after an inline element', async () => {
        const input = `# Details element example
    - \`a\`: bla
    - \`b\`: list
    `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
      "# Details element example

      * \`a\`: bla
      * \`b\`: list
      "
    `);
    });

    it('adds :::dd content to the current deflist', async () => {
        const input = `# Details with block content
      Start

      Code
      : Hello World
      :::dd
      \`\`\`py
      print('Hello World')
      \`\`\`
      :::
      `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details with block content

          Start

          <dl>
            <dt>Code</dt>

            <dd>Hello World</dd>

            <dd>
              \`\`\`py
              print('Hello World')
              \`\`\`
            </dd>
          </dl>
          "
        `);
    });
    it('handles :::dd as the first child of deflist', async () => {
        const input = `# Details with block content
          Start

          Code
          :::dd
          \`\`\`py
          print('Hello World')
          \`\`\`
          :::
          `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details with block content

        Start

        <dl>
          <dt>Code</dt>

          <dd>
            \`\`\`py
            print('Hello World')
            \`\`\`
          </dd>
        </dl>
        "
      `);
    });
    it('handles multiple consecutive :::dd as the first child of deflist', async () => {
        const input = `# Details with block content
            Start

            Code
            :::dd
            \`\`\`py
            print('Hello World')
            \`\`\`
            :::
            :::dd
            \`\`\`py
            print('Hello Second')
            \`\`\`
            :::
            `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details with block content

          Start

          <dl>
            <dt>Code</dt>

            <dd>
              \`\`\`py
              print('Hello World')
              \`\`\`
            </dd>

            <dd>
              \`\`\`py
              print('Hello Second')
              \`\`\`
            </dd>
          </dl>
          "
        `);
    });
    it('handles multiple consecutive :::dd definitions', async () => {
        const input = `# Details with block content
            Start

            Code
            :::dd
            \`\`\`py
            print('Hello World')
            \`\`\`
            :::
            : and more
            Other
            : whatever
            :::dd
            \`\`\`py
            print('Hello Second')
            \`\`\`
            :::
            `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details with block content

          Start

          <dl>
            <dt>Code</dt>

            <dd>
              \`\`\`py
              print('Hello World')
              \`\`\`
            </dd>

            <dd>and more</dd>

            <dt>Other</dt>

            <dd>whatever</dd>

            <dd>
              \`\`\`py
              print('Hello Second')
              \`\`\`
            </dd>
          </dl>
          "
        `);
    });
    it('handles multiple deflists beside each other', async () => {
        const input = `# Details with block content
          Start

          Code
          : hello

          :::dd
          whatever
          :::
          `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details with block content

          Start

          <dl>
            <dt>Code</dt>

            <dd>hello</dd>

            <dd>
              whatever
            </dd>
          </dl>
          "
        `);
    });
});
