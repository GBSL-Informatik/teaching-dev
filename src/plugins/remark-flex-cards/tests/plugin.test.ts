import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { describe, expect, it } from 'vitest';

const process = async (content: string) => {
    const { default: plugin } = await import('../plugin');
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin).process(content);

    return result.value;
};

const alignLeft = (content: string) => {
    return content
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n');
};

describe('#flex', () => {
    it("does nothing if there's no flex", async () => {
        const input = `# Heading

Some content
`;
        const result = await process(input);
        expect(result).toBe(input);
    });
    it('can convert flex', async () => {
        const input = alignLeft(`# Details element example
            :::flex
            Hello world!
            ::br
            Hello moon!
            :::
            Byyye!
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <div className="flex">
            <div className="item">
              <div className="content">
                Hello world!
              </div>
            </div>

            <div className="item">
              <div className="content">
                Hello moon!
              </div>
            </div>
          </div>

          Byyye!
          "
        `);
    });
    it('can convert nested flex', async () => {
        const input = alignLeft(`# Details element example
            ::::flex
            Nesting Level 1
            ::br
            Content with a flex
            :::flex
            Boo!
            ::br
            Yaa!
            :::
            ::::
            Byyye!
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Details element example

          <div className="flex">
            <div className="item">
              <div className="content">
                Nesting Level 1
              </div>
            </div>

            <div className="item">
              <div className="content">
                Content with a flex

                <div className="flex">
                  <div className="item">
                    <div className="content">
                      Boo!
                    </div>
                  </div>

                  <div className="item">
                    <div className="content">
                      Yaa!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          Byyye!
          "
        `);
    });

    it('sets css properties', async () => {
        const input = alignLeft(`
          :::flex{.red alignItems='center'}
          center
          ::br
          item
          :::
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "<div className="flex red" style={{"alignItems":"center"}}>
          <div className="item">
            <div className="content">
              center
            </div>
          </div>

          <div className="item">
            <div className="content">
              item
            </div>
          </div>
        </div>
        "
      `);
    });

    it('sets css properties for content blocks', async () => {
        const input = alignLeft(`
          :::flex
          center
          ::br{.red alignItems='center'}
          item
          :::
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "<div className="flex">
          <div className="item">
            <div className="content">
              center
            </div>
          </div>

          <div className="item red" style={{"alignItems":"center"}}>
            <div className="content">
              item
            </div>
          </div>
        </div>
        "
      `);
    });

    it('can edit the properties of the first content blocks', async () => {
        const input = alignLeft(`
          :::flex
          ::br{.red alignItems='center'}
          center
          ::br
          item
          :::
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "<div className="flex">
          <div className="item red" style={{"alignItems":"center"}}>
            <div className="content">
              center
            </div>
          </div>

          <div className="item">
            <div className="content">
              item
            </div>
          </div>
        </div>
        "
      `);
    });

    it('sets css properties for items', async () => {
        const input = alignLeft(`
          :::flex{flexBasis='200px'}
          center
          ::br
          item
          :::
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "<div className="flex">
          <div className="item" style={{"flexBasis":"200px"}}>
            <div className="content">
              center
            </div>
          </div>

          <div className="item" style={{"flexBasis":"200px"}}>
            <div className="content">
              item
            </div>
          </div>
        </div>
        "
      `);
    });

    it('handles indents correctly', async () => {
        const input = alignLeft(`
          ::::flex
            Outer flex
            ::br
            :::flex
              inner flex
              ::br
              item
            :::
            ::br
            whatever
          ::::
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "<div className="flex">
          <div className="item">
            <div className="content">
              Outer flex
            </div>
          </div>

          <div className="item">
            <div className="content">
              <div className="flex">
                <div className="item">
                  <div className="content">
                    inner flex
                  </div>
                </div>

                <div className="item">
                  <div className="content">
                    item
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="item">
            <div className="content">
              whatever
            </div>
          </div>
        </div>
        "
      `);
    });
});

describe('#cards', () => {
    it("does nothing if there's no card", async () => {
        const input = `# Heading

Some content
`;
        const result = await process(input);
        expect(result).toBe(input);
    });
    it('can convert simple cards', async () => {
        const input = alignLeft(`# Details element example
          :::cards
          Hello world!
          ::br
          Hello moon!
          :::
          Byyye!
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <div className="flex-cards flex">
          <div className="item card">
            <div className="card__body">
              Hello world!
            </div>
          </div>

          <div className="item card">
            <div className="card__body">
              Hello moon!
            </div>
          </div>
        </div>

        Byyye!
        "
      `);
    });
    it('can convert simple nested cards', async () => {
        const input = alignLeft(`# Details element example
          ::::cards
          Nesting Level 1
          ::br
          Content with a cards section
          :::cards
          Boo!
          ::br
          Yaa!
          :::
          ::::
          Byyye!
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "# Details element example

        <div className="flex-cards flex">
          <div className="item card">
            <div className="card__body">
              Nesting Level 1
            </div>
          </div>

          <div className="item card">
            <div className="card__body">
              Content with a cards section

              <div className="flex-cards flex">
                <div className="item card">
                  <div className="card__body">
                    Boo!
                  </div>
                </div>

                <div className="item card">
                  <div className="card__body">
                    Yaa!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        Byyye!
        "
      `);
    });

    it('can convert sipmple cards with an image', async () => {
        const input = alignLeft(`
          :::cards
          ![Some Image](https://via.placeholder.com/150)
          Hello world!
          ::br
          Hello moon!
          :::
          Byyye!
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "<div className="flex-cards flex">
          <div className="item card">
            <div className="card__image">
              ![Some Image](https://via.placeholder.com/150)
            </div>

            <div className="card__body">

              Hello world!
            </div>
          </div>

          <div className="item card">
            <div className="card__body">
              Hello moon!
            </div>
          </div>
        </div>

        Byyye!
        "
      `);
    });

    it('can convert multiple cards with image', async () => {
        const input = alignLeft(`
        :::cards
        Hii
        ![Some Image](https://via.placeholder.com/150)
        Hello world!
        ::br
        Hello moon!
        ![Some Image](https://via.placeholder.com/150)
        :::
        Byyye!
    `);
        const result = await process(input);
        console.log(result);

        expect(result).toMatchInlineSnapshot(`
      "<div className="flex-cards flex">
        <div className="item card">
          <div className="card__body">
            Hii

          </div>

          <div className="card__image">
            ![Some Image](https://via.placeholder.com/150)
          </div>

          <div className="card__body">

            Hello world!
          </div>
        </div>

        <div className="item card">
          <div className="card__body">
            Hello moon!

          </div>

          <div className="card__image">
            ![Some Image](https://via.placeholder.com/150)
          </div>
        </div>
      </div>

      Byyye!
      "
    `);
    });

    it('can convert nested cards with an image', async () => {
        const input = alignLeft(`
          ::::cards
          ![Some Image](https://via.placeholder.com/150)
          :::cards
          Hello
          ::br
          Hello moon!
          :::
          ::::
          Byyye!
      `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "<div className="flex-cards flex">
          <div className="item card">
            <div className="card__image">
              ![Some Image](https://via.placeholder.com/150)
            </div>

            <div className="card__body">
              <div className="flex-cards flex">
                <div className="item card">
                  <div className="card__body">
                    Hello
                  </div>
                </div>

                <div className="item card">
                  <div className="card__body">
                    Hello moon!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        Byyye!
        "
      `);
    });
});
