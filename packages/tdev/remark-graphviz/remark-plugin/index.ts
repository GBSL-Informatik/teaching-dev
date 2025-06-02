import { CONTINUE, SKIP } from 'unist-util-visit';
import path from 'path';
import type { Plugin, Transformer } from 'unified';
import { Root } from 'mdast';
import { promises as fs } from 'fs';
import { Graphviz } from '@hpcc-js/wasm-graphviz';

interface OptionsInput {
    dotFileRootDir?: string;
}

const fileExists = async (filePath: string) => {
    try {
        await fs.stat(filePath);
        return true;
    } catch (error) {
        return false;
    }
};

const cleanupDotImages = async (dotOutputDir: string) => {
    /**
     * cleanup old dot files by removing all files in the directory.
     * Expected a directory structure like this:
     * images
     * └── .dot
     *    ├── index-mdx
     *    │  ├── dot-001.svg
     *    │  ├── .gitignore
     *    │  └...
     *    ├── hello-mdx
     *    │  ├── dot-001.svg
     *    │  ├── .gitignore
     *    │  └...
     *    └...
     *
     * dotOutputDir: './images/.dot/index-mdx'.
     *      --> delete dotOutputDir
     *      --> if './images/.dot' is empty now, delete that dir
     *      --> if './images' is empty now, delete this folder too
     */
    await fs.rm(dotOutputDir, { recursive: true, force: true });
    const dotDir = path.dirname(dotOutputDir);
    const dotFiles = await fs.readdir(dotDir);
    if (dotFiles.length === 0) {
        await fs.rm(dotDir, { recursive: true, force: true });
        const imageDir = path.dirname(dotDir);
        const imageFiles = await fs.readdir(imageDir);
        if (imageFiles.length === 0) {
            await fs.rm(imageDir, { recursive: true, force: true });
        }
    }
};

const plugin: Plugin<OptionsInput[], Root> = function plugin(this, optionsInput = {}): Transformer<Root> {
    let svgEnumerator = 0;
    const dotFileRootDir = optionsInput.dotFileRootDir || './images/.dot';
    return async (root, vfile) => {
        const graphviz = await Graphviz.load();
        const mdFileName = path.basename(vfile.history[0]).replaceAll('.', '-');
        const markdownDir = path.dirname(vfile.history[0] || '');
        const dotDir = path.join(markdownDir, dotFileRootDir);
        const dotOutputDir = path.join(dotDir, mdFileName);
        const hasDotDir = await fileExists(dotOutputDir);
        if (hasDotDir) {
            await cleanupDotImages(dotOutputDir);
        }
        const svgsToCreate: { path: string; value: string }[] = [];
        const { visit } = await import('unist-util-visit');
        visit(root, 'code', (node, idx, parent) => {
            const { lang, value, meta } = node;
            if (lang !== 'dot' || idx === undefined || !parent) {
                return CONTINUE;
            }
            try {
                const svg = graphviz.dot(value, 'svg');
                const svgPath = path.join(
                    dotFileRootDir,
                    mdFileName,
                    `dot-${`${svgEnumerator + 1}`.padStart(3, '0')}.svg`
                );
                svgEnumerator++;
                svgsToCreate.push({ path: svgPath, value: svg });
                parent?.children.splice(idx, 1, {
                    type: 'paragraph',
                    children: [
                        {
                            type: 'image',
                            url: `./${svgPath}`,
                            title: meta
                        }
                    ]
                });
                return SKIP;
            } catch (error) {
                return CONTINUE;
            }
        });
        if (svgsToCreate.length > 0) {
            await fs.mkdir(dotOutputDir, { recursive: true });
            await fs.writeFile(
                path.join(dotOutputDir, '.gitignore'),
                `# Ignore all files in current directory\n/*`,
                'utf-8'
            );
            await Promise.all(
                svgsToCreate.map(({ path: svgPath, value: svg }) => {
                    return fs.writeFile(path.join(markdownDir, svgPath), svg, 'utf-8');
                })
            );
        }
    };
};

export default plugin;
