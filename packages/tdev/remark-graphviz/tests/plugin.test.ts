import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';
import { VFile } from 'vfile';
import path from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const alignLeft = (content: string) => {
    return content
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n');
};
const process = async (content: string, fileName?: string, config?: { dotFileRootDir: string }) => {
    const { default: plugin } = (await import('../remark-plugin')) as any;
    const file = new VFile({
        value: alignLeft(content),
        history: [fileName ? path.join(__dirname, fileName) : __filename]
    });

    const result = await remark()
        .use(remarkMdx)
        .use(plugin, config || {})
        .process(file);

    return result.value;
};

describe('#graphviz', () => {
    afterEach(async () => {
        const dotDir = path.join(__dirname, 'images');
        await fs.rm(dotDir, { recursive: true, force: true });
    });
    afterAll(async () => {
        const dotDir = path.join(__dirname, 'images');
        await fs.rm(dotDir, { recursive: true, force: true });
        const imgDir = path.join(__dirname, 'img');
        await fs.rm(imgDir, { recursive: true, force: true });
    });
    it("does nothing if there's no defbox", async () => {
        const input = `# Heading

            Some content
        `;
        const result = await process(input);
        expect(result).toBe(alignLeft(input));
    });
    it('can convert dot codeblocks', async () => {
        const input = alignLeft(`# Dot
          \`\`\`dot
          digraph G {
              a -> b;
          }
          \`\`\`
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Dot

          ![](./images/.dot/plugin-test-ts/dot-001.svg)
          "
        `);
    });
    it('respects filename domain', async () => {
        const input = alignLeft(`# Dot
          \`\`\`dot
          digraph G {
              a -> b;
          }
          \`\`\`
        `);
        const result = await process(input, 'foobar.md');
        expect(result).toMatchInlineSnapshot(`
          "# Dot

          ![](./images/.dot/foobar-md/dot-001.svg)
          "
        `);
    });
    it('uses meta as alt', async () => {
        const input = alignLeft(`# Dot
          \`\`\`dot A Digraph --width=200
          digraph G {
              a -> b;
          }
          \`\`\`
        `);
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Dot

          ![](./images/.dot/plugin-test-ts/dot-001.svg "A Digraph --width=200")
          "
        `);
    });
    it('creates svg file in .dot-folder', async () => {
        const input = alignLeft(`# Dot
          \`\`\`dot A Digraph --width=200
          digraph G {
              a -> b;
          }
          \`\`\`
        `);
        const result = await process(input, 'graphviz.md');
        await expect(
            fs.stat(path.join(__dirname, 'images/.dot/graphviz-md/dot-001.svg'))
        ).resolves.toBeDefined();
        expect(result).toMatchInlineSnapshot(`
          "# Dot

          ![](./images/.dot/graphviz-md/dot-001.svg "A Digraph --width=200")
          "
        `);
    });
    it('can customize output .dot-folder', async () => {
        const input = alignLeft(`# Dot
          \`\`\`dot A Digraph --width=200
          digraph G {
              a -> b;
          }
          \`\`\`
        `);
        const result = await process(input, 'graphviz.md', { dotFileRootDir: 'img/.dot' });
        await expect(
            fs.stat(path.join(__dirname, 'img/.dot/graphviz-md/dot-001.svg'))
        ).resolves.toBeDefined();
        expect(result).toMatchInlineSnapshot(`
          "# Dot

          ![](./img/.dot/graphviz-md/dot-001.svg "A Digraph --width=200")
          "
        `);
    });
    it('cleans up empty .dot/filename output dir', async () => {
        await fs.mkdir(path.join(__dirname, 'images/.dot/graphviz-md'), { recursive: true });
        await fs.writeFile(path.join(__dirname, 'images/.dot/foobar.svg'), 'dummy content');
        await fs.writeFile(path.join(__dirname, 'images/.dot/graphviz-md/.gitignore'), 'dot-001.svg\n');
        await expect(fs.stat(path.join(__dirname, 'images/.dot/graphviz-md'))).resolves.toBeDefined();
        const input = alignLeft(`# Dot
            No dot code here
        `);
        const result = await process(input, 'graphviz.md');
        await expect(fs.stat(path.join(__dirname, 'images/.dot/graphviz-md'))).rejects.toThrow(/ENOENT/);
        await expect(fs.stat(path.join(__dirname, 'images/.dot'))).resolves.toBeDefined();
        expect(result).toMatchInlineSnapshot(`
          "# Dot

          No dot code here
          "
        `);
    });
    it('cleans up empty .dot output dir', async () => {
        await fs.mkdir(path.join(__dirname, 'images/.dot/graphviz-md'), { recursive: true });
        await fs.writeFile(path.join(__dirname, 'images/foobar.svg'), 'dummy content');
        await fs.writeFile(path.join(__dirname, 'images/.dot/graphviz-md/.gitignore'), 'dot-001.svg\n');
        await expect(fs.stat(path.join(__dirname, 'images/.dot/graphviz-md'))).resolves.toBeDefined();
        const input = alignLeft(`# Dot
            No dot code here
        `);
        const result = await process(input, 'graphviz.md');
        await expect(fs.stat(path.join(__dirname, 'images/.dot/graphviz-md'))).rejects.toThrow(/ENOENT/);
        await expect(fs.stat(path.join(__dirname, 'images/.dot'))).rejects.toThrow(/ENOENT/);
        await expect(fs.stat(path.join(__dirname, 'images'))).resolves.toBeDefined();
        expect(result).toMatchInlineSnapshot(`
          "# Dot

          No dot code here
          "
        `);
    });
    it('cleans up empty images output dir', async () => {
        await fs.mkdir(path.join(__dirname, 'images/.dot/graphviz-md'), { recursive: true });
        await fs.writeFile(path.join(__dirname, 'images/.dot/graphviz-md/.gitignore'), 'dot-001.svg\n');
        await expect(fs.stat(path.join(__dirname, 'images/.dot/graphviz-md'))).resolves.toBeDefined();
        const input = alignLeft(`# Dot
            No dot code here
        `);
        const result = await process(input, 'graphviz.md');
        await expect(fs.stat(path.join(__dirname, 'images/.dot/graphviz-md'))).rejects.toThrow(/ENOENT/);
        await expect(fs.stat(path.join(__dirname, 'images/.dot'))).rejects.toThrow(/ENOENT/);
        await expect(fs.stat(path.join(__dirname, 'images'))).rejects.toThrow(/ENOENT/);
        expect(result).toMatchInlineSnapshot(`
          "# Dot

          No dot code here
          "
        `);
    });
});
