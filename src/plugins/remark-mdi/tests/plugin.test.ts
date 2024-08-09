import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { describe, expect, it } from 'vitest';

const process = async (content: string) => {
    const { default: plugin } = (await import('../plugin')) as any;
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin).process(content);

    return result.value;
};

describe('#mdi', () => {
    it("does nothing if there's no mdi", async () => {
        const input = `# Heading

Some content
`;
        const result = await process(input);
        expect(result).toBe(input);
    });
    it('can convert mdi', async () => {
        const input = `# Details element example
        Hello :mdi[robot] world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "import { mdiRobot } from '@mdi/js';

        import Icon from '@mdi/react';

        # Details element example

        Hello <Icon path={mdiRobot} size={1.5} className="mdi-icon" /> world!
        "`);
    });

    it('can convert mdi with props', async () => {
        const input = `# Details element example
        Hello :mdi[robot]{color=teal size=20em} world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "import { mdiRobot } from '@mdi/js';

        import Icon from '@mdi/react';

        # Details element example

        Hello <Icon path={mdiRobot} color="teal" size="20em" className="mdi-icon" /> world!
        "`);
    });

    it('does not reimport modules', async () => {
        const input = `import { mdiRobot } from '@mdi/js';\nimport Icon from '@mdi/react';

        # Details element example
        Hello :mdi[robot] world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
        "import { mdiRobot } from '@mdi/js';
        import Icon from '@mdi/react';
        
        # Details element example

        Hello <Icon path={mdiRobot} size={1.5} className="mdi-icon" /> world!
        "`);
    });

    it('handels numbers correct', async () => {
        const input = `
        # Details element example
        Hello :mdi[numeric-1-box] world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "import { mdiNumeric1Box } from '@mdi/js';

          import Icon from '@mdi/react';

          # Details element example

          Hello <Icon path={mdiNumeric1Box} size={1.5} className="mdi-icon" /> world!
          "
        `);
    });
    it('handels icons in link texts', async () => {
        const input = `
        # Details element example
        Hello [:mdi[robot] robo](https://srf.ch) world!
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "import { mdiRobot } from '@mdi/js';

          import Icon from '@mdi/react';

          # Details element example

          Hello [<Icon path={mdiRobot} size={1.5} className="mdi-icon" /> robo](https://srf.ch) world!
          "
        `);
    });
});
