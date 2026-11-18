import minimist from 'minimist';
import fs from 'node:fs';
import path from 'node:path';
import { annotationsOf } from '../annotate/annotationsOf';
import { excalidrawScene } from '../annotate/excalidrawScene';
import { layoutPage } from '../annotate/layoutPage';
import { createTextLocator } from '../annotate/locateText';
import { readPdf } from '../annotate/readPdf';
import { renderAnnotatedPng } from '../annotate/renderAnnotatedPng';
import { createNormalizer, DEFAULT_EQUIVALENT_CHARACTERS } from '../checks/normalizeText';
import { buildDocModel } from '../docx/buildDocModel';
import { readDocx } from '../docx/readDocx';
import { readSpecFile } from './specFile';

// `yarn workspace` runs the script in the package folder, so paths are relative to the repository.
const REPO_ROOT = path.resolve(__dirname, '../../../..');
// Pixels per PDF point of the page images: sharp enough to zoom into in the markup editor.
const PAGE_PIXEL_RATIO = 2;

const USAGE = `
yarn workspace @hfr/docx-grader annotate <original.docx> --pdf <original.pdf>

Writes one annotated image per page of the original, labelling the formatting the docx-spec checks:
<original>-annotated-<page>.png, and next to it the editable Excalidraw scene
<original>-annotated-<page>.png.excalidraw for the markup editor of @tdev/excalidoc.

  --pdf   the original exported as PDF from Word (File › Save as › PDF); it gives the page images
          and where each text is on them

The docx-spec must exist (create-spec). Relative paths are resolved from the repository root.
`;

const main = async () => {
    const argv = minimist(process.argv.slice(2), { boolean: ['help'], string: ['pdf'] });
    const original = String(argv._[0] ?? '');
    if (argv.help || argv._.length !== 1 || !/\.docx$/i.test(original) || !argv.pdf) {
        console.log(USAGE);
        return;
    }

    const originalPath = path.resolve(REPO_ROOT, original);
    const spec = readSpecFile(originalPath.replace(/\.docx$/i, '.docx-spec.yaml'));
    const model = buildDocModel(await readDocx(fs.readFileSync(originalPath)));
    const pages = await readPdf(new Uint8Array(fs.readFileSync(path.resolve(REPO_ROOT, argv.pdf))));
    const normalize = createNormalizer(spec.equivalentCharacters ?? DEFAULT_EQUIVALENT_CHARACTERS);
    const annotations = annotationsOf(spec.checks, model, createTextLocator(pages), normalize);

    const unplaced = annotations.filter((annotation) => !annotation.target).length;
    for (const page of pages) {
        // Annotations without a place in the PDF are listed on the first page.
        const ofPage = annotations.filter(({ target }) => (target?.page ?? 0) === page.index);
        const layout = layoutPage(page, ofPage);
        const pagePng = await page.renderPng(PAGE_PIXEL_RATIO);
        const imagePath = originalPath.replace(/\.docx$/i, `-annotated-${page.index + 1}.png`);

        fs.writeFileSync(imagePath, await renderAnnotatedPng(layout, pagePng, PAGE_PIXEL_RATIO));
        fs.writeFileSync(
            `${imagePath}.excalidraw`,
            JSON.stringify(excalidrawScene(layout, pagePng), null, 2)
        );
        console.log(`✅ ${ofPage.length} Anmerkungen: ${imagePath}`);
    }
    if (unplaced > 0) {
        console.warn(`⚠️ ${unplaced} Anmerkungen ohne Stelle im PDF stehen oben auf Seite 1.`);
    }
};

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
