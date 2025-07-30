import { visit } from 'unist-util-visit';
import type { MdxJsxTextElement } from 'mdast-util-mdx';
import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';
import { CaptionVisitor } from '../plugin';
import { VFile } from 'vfile';
import { Parent } from 'mdast';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);

const alignLeft = (content: string) => {
    return content
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n');
};

const processSrc = async (content: string, captionVisitors: CaptionVisitor[] = [], srcAttr?: string) => {
    const { default: plugin } = await import('../plugin');
    const file = new VFile({ value: alignLeft(content), history: [__filename] });

    const result = await remark()
        .use(remarkMdx)
        .use(remarkDirective)
        .use(plugin, { captionVisitors: captionVisitors, srcAttr: srcAttr })
        .process(file);

    return result.value;
};

describe('#image', () => {
    it("does nothing if there's no image", async () => {
        const input = `# Heading

            Some content
        `;
        const result = await processSrc(input);
        expect(result).toBe(alignLeft(input));
    });
    it('wraps image in figure', async () => {
        const input = `# Heading

            ![](https://example.com/image.png)
        `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <span className="figure">
            ![](https://example.com/image.png)
          </span>
          "
        `);
    });

    it('wraps consecutive images in separate figure', async () => {
        const input = `# Heading

          ![](https://example.com/image.png)
          ![](https://example.com/image.png)
      `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <span className="figure">
            ![](https://example.com/image.png)
          </span>

          <span className="figure">
            ![](https://example.com/image.png)
          </span>
          "
        `);
    });

    it('sets width with --width=', async () => {
        const input = `# Heading

          ![Caption --width=200px](https://example.com/image.png)
      `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
        "# Heading

        <span className="figure" options={{"width":"200px"}}>
          ![Caption](https://example.com/image.png)

          <span className="caption"><span style={{"flexGrow":1}} />Caption<span style={{"flexGrow":1}} /></span>
        </span>
        "
      `);
    });

    it('uses img-title when present', async () => {
        const input = `# Heading

          ![Foo Bar](https://example.com/image.png "Caption --width=200px")
      `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
        "# Heading

        <span className="figure" options={{"width":"200px"}}>
          ![Foo Bar](https://example.com/image.png)

          <span className="caption"><span style={{"flexGrow":1}} />Caption<span style={{"flexGrow":1}} /></span>
        </span>
        "
      `);
    });
    it('sets width with --max-width=', async () => {
        const input = `# Heading

        ![Caption --max-width=200px](https://example.com/image.png)
    `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
      "# Heading

      <span className="figure" options={{"maxWidth":"200px"}}>
        ![Caption](https://example.com/image.png)

        <span className="caption"><span style={{"flexGrow":1}} />Caption<span style={{"flexGrow":1}} /></span>
      </span>
      "
    `);
    });

    it('extracts caption', async () => {
        const input = `# Heading
            ![image](https://example.com/image.png)
        `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <span className="figure">
            ![image](https://example.com/image.png)

            <span className="caption"><span style={{"flexGrow":1}} />image<span style={{"flexGrow":1}} /></span>
          </span>
          "
        `);
    });

    it('extracts links in caption', async () => {
        const input = `# Heading
            ![image [foo.bar](https://foo.bar)](https://example.com/image.png)
        `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <span className="figure">
            ![image foo.bar](https://example.com/image.png)

            <span className="caption"><span style={{"flexGrow":1}} />image [foo.bar](https://foo.bar)<span style={{"flexGrow":1}} /></span>
          </span>
          "
        `);
    });

    it('provides src attr for local image', async () => {
        const input = `# Heading
            ![](assets/image.svg)
        `;
        const result = await processSrc(input, undefined, 'src');
        const expectedSrc = path.resolve(__filename, '../assets/image.svg').replace(process.cwd(), '');
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <span className="figure" src="${expectedSrc}">
            ![](assets/image.svg)
          </span>
          "
        `);
    });

    it('wraps local image with bib file to figure with sourceref', async () => {
        const input = `# Heading
            ![](assets/placeholder.svg)
        `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <span className="figure">
            ![](assets/placeholder.svg)

            <span className="caption inline"><span style={{"flexGrow":1}} /><SourceRef bib={{"author":"Flanoz","source":"https://commons.wikimedia.org/wiki/File:Placeholder_view_vector.svg","licence":"CC 0","licence_url":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","edited":false}} /></span>
          </span>
          "
        `);
    });

    it('unwraps inline image to figures', async () => {
        const input = `# Heading
              Hello ![](assets/placeholder.svg) my friend.
          `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
            "# Heading

            Hello

            <span className="figure">
              ![](assets/placeholder.svg)

              <span className="caption inline"><span style={{"flexGrow":1}} /><SourceRef bib={{"author":"Flanoz","source":"https://commons.wikimedia.org/wiki/File:Placeholder_view_vector.svg","licence":"CC 0","licence_url":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","edited":false}} /></span>
            </span>

            my friend.
            "
          `);
    });
    it('prevents unwrapping inline image when @inline is present', async () => {
        const input = `# Heading
            Hello ![@inline --width=50px](assets/placeholder.svg) my friend.
        `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          Hello ![](assets/placeholder.svg) my friend.
          "
        `);
    });
    it('wraps inlined with post content', async () => {
        const input = `# Heading

            ![](https://example.com/image.png) hello 
        `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <span className="figure">
            ![](https://example.com/image.png)
          </span>

          hello
          "
        `);
    });
    it('wraps inlined with pre and post content', async () => {
        const input = `# Heading

            hello ![](https://example.com/image.png) bello 
        `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          hello

          <span className="figure">
            ![](https://example.com/image.png)
          </span>

          bello
          "
        `);
    });
    it('wraps multiple inlined with post content', async () => {
        const input = `# Heading

            cello ![](https://example.com/image.png) hello ![](https://example.com/image.png) bello
        `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          cello

          <span className="figure">
            ![](https://example.com/image.png)
          </span>

          hello

          <span className="figure">
            ![](https://example.com/image.png)
          </span>

          bello
          "
        `);
    });

    it('processes caption as markdown', async () => {
        const input = `
      ![a **bold** caption](assets/placeholder.svg)
      `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
        "<span className="figure">
          ![a bold caption](assets/placeholder.svg)

          <span className="caption"><span style={{"flexGrow":1}} />a **bold** caption<span style={{"flexGrow":1}} /><SourceRef bib={{"author":"Flanoz","source":"https://commons.wikimedia.org/wiki/File:Placeholder_view_vector.svg","licence":"CC 0","licence_url":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","edited":false}} /></span>
        </span>
        "
      `);
    });
    it('processes caption as markdown and supports links', async () => {
        const input = `
      ![a [link](https://link.com) caption](assets/placeholder.svg)
      `;
        const result = await processSrc(input);
        expect(result).toMatchInlineSnapshot(`
        "<span className="figure">
          ![a link caption](assets/placeholder.svg)

          <span className="caption"><span style={{"flexGrow":1}} />a [link](https://link.com) caption<span style={{"flexGrow":1}} /><SourceRef bib={{"author":"Flanoz","source":"https://commons.wikimedia.org/wiki/File:Placeholder_view_vector.svg","licence":"CC 0","licence_url":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","edited":false}} /></span>
        </span>
        "
      `);
    });
    it('processes caption and applies additional visitors', async () => {
        const visitor = (ast: Parent, source: string, config: { tagName?: string; className?: string }) => {
            visit(ast, 'strong', (node, idx, parent) => {
                if (!parent || node.position === undefined || idx === undefined) {
                    return;
                }
                const startOg = node.position.start.offset || 0;
                const endOg = node.position.end.offset;

                const strToOperateOn = source.substring(startOg, endOg);
                const wasUnderscored = strToOperateOn.startsWith('__') && strToOperateOn.endsWith('__');
                if (wasUnderscored) {
                    parent.children.splice(idx, 1, {
                        type: 'mdxJsxTextElement',
                        name: config.tagName || 'strong',
                        attributes: config.className
                            ? [{ type: 'mdxJsxAttribute', name: 'className', value: config.className }]
                            : [],
                        children: node.children
                    } as MdxJsxTextElement);
                }
            });
        };
        const captionVisitor: CaptionVisitor = (ast, source) => {
            visitor(ast, source, {
                className: 'boxed'
            });
        };
        const input = `
      ![a [__link__](https://link.com) caption](assets/placeholder.svg)
      `;
        const result = await processSrc(input, [captionVisitor]);
        expect(result).toMatchInlineSnapshot(`
          "<span className="figure">
            ![a link caption](assets/placeholder.svg)

            <span className="caption"><span style={{"flexGrow":1}} />a [<strong className="boxed">link</strong>](https://link.com) caption<span style={{"flexGrow":1}} /><SourceRef bib={{"author":"Flanoz","source":"https://commons.wikimedia.org/wiki/File:Placeholder_view_vector.svg","licence":"CC 0","licence_url":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","edited":false}} /></span>
          </span>
          "
        `);
    });
});
