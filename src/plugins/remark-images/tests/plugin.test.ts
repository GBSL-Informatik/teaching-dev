import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);

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
        .use(plugin as any, { vFile: { history: [__filename] } } as any)
        .process(alignLeft(content));

    return result.value;
};

describe('#iamge', () => {
    it("does nothing if there's no image", async () => {
        const input = `# Heading

            Some content
        `;
        const result = await process(input);
        expect(result).toBe(alignLeft(input));
    });
    it('wraps image in figure', async () => {
        const input = `# Heading

            ![](https://example.com/image.png)
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <figure>
            ![](https://example.com/image.png)
          </figure>
          "
        `);
    });

    it('sets width with --width=', async () => {
        const input = `# Heading

          ![Caption --width=200px](https://example.com/image.png)
      `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Heading

        <figure options={{"width":"200px"}}>
          ![Caption](https://example.com/image.png)

          <figcaption>
            <span style={{flexGrow: 1}} />

            Caption

            <span style={{flexGrow: 1}} />
          </figcaption>
        </figure>
        "
      `);
    });
    it('sets width with --max-width=', async () => {
        const input = `# Heading

        ![Caption --max-width=200px](https://example.com/image.png)
    `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
      "# Heading

      <figure options={{"maxWidth":"200px"}}>
        ![Caption](https://example.com/image.png)

        <figcaption>
          <span style={{flexGrow: 1}} />

          Caption

          <span style={{flexGrow: 1}} />
        </figcaption>
      </figure>
      "
    `);
    });

    it('extracts caption', async () => {
        const input = `# Heading
            ![image](https://example.com/image.png)
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <figure>
            ![image](https://example.com/image.png)

            <figcaption>
              <span style={{flexGrow: 1}} />

              image

              <span style={{flexGrow: 1}} />
            </figcaption>
          </figure>
          "
        `);
    });

    it('extracts links in caption', async () => {
        const input = `# Heading
            ![image [foo.bar](https://foo.bar)](https://example.com/image.png)
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <figure>
            ![image [foo.bar](https://foo.bar)](https://example.com/image.png)

            <figcaption>
              <span style={{flexGrow: 1}} />

              image 

              [foo.bar](https://foo.bar)

              <span style={{flexGrow: 1}} />
            </figcaption>
          </figure>
          "
        `);
    });

    it('wraps local image with bib file to figure with sourceref', async () => {
        const input = `# Heading
            ![](assets/placeholder.svg)
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <figure>
            ![](assets/placeholder.svg)

            <figcaption>
              <span style={{flexGrow: 1}} />

              <SourceRef bib={{"author":"Flanoz","source":"https://commons.wikimedia.org/wiki/File:Placeholder_view_vector.svg","licence":"CC 0","licence_url":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","edited":false}} />
            </figcaption>
          </figure>
          "
        `);
    });

    it('wraps inline image to inlined figure', async () => {
        const input = `# Heading
            Hello ![](assets/placeholder.svg) my friend.
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
      "# Heading

      Hello <figure>![](assets/placeholder.svg)<figcaption><span style={{flexGrow: 1}} /><SourceRef bib={{"author":"Flanoz","source":"https://commons.wikimedia.org/wiki/File:Placeholder_view_vector.svg","licence":"CC 0","licence_url":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","edited":false}} /></figcaption></figure> my friend.
      "
    `);
    });
});
