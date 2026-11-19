import minimist from 'minimist';
import fs from 'node:fs';
import path from 'node:path';
import { annotationsOf } from '../annotate/annotationsOf';
import { excalidrawScene } from '../annotate/excalidrawScene';
import { layoutPage } from '../annotate/layoutPage';
import { readPdf } from '../annotate/readPdf';
import { createNormalizer, DEFAULT_EQUIVALENT_CHARACTERS } from '../checks/normalizeText';
import { buildDocModel } from '../docx/buildDocModel';
import { readDocx } from '../docx/readDocx';
import { readSpecFile } from './specFile';

// `yarn workspace` runs the script in the package folder, so paths are relative to the repository.
const REPO_ROOT = path.resolve(__dirname, '../../../..');
// Pixels per PDF point of the page images: sharp enough to zoom into in the markup editor.
const PAGE_PIXEL_RATIO = 2;
const PLACEHOLDER_IMAGE = path.resolve(__dirname, '../annotate/placeholder.webp');

const USAGE = `
yarn workspace @hfr/docx-grader annotate <original.docx> --pdf <original.pdf>

Writes per page of the original an Excalidraw scene labelling the formatting the docx-spec checks,
<original>-annotated-<page>.webp.excalidraw, for the markup editor of @tdev/excalidoc. The image
<original>-annotated-<page>.webp next to it is a placeholder until the scene is saved in the editor.

  --pdf      the original exported as PDF from Word (File › Save as › PDF); it gives the page images
             and where each text is on them

The docx-spec must exist (create-spec). Relative paths are resolved from the repository root.
`;

const main = async () => {
    const argv = minimist(process.argv.slice(2), {
        boolean: ['help'],
        string: ['pdf']
    });
    const original = String(argv._[0] ?? '');
    const isValid = argv._.length === 1 && /\.docx$/i.test(original) && argv.pdf;
    if (argv.help || !isValid) {
        console.log(USAGE);
        return;
    }

    const originalPath = path.resolve(REPO_ROOT, original);
    const spec = readSpecFile(originalPath.replace(/\.docx$/i, '.docx-spec.yaml'));
    const model = buildDocModel(await readDocx(fs.readFileSync(originalPath)));
    const pdf = await readPdf(new Uint8Array(fs.readFileSync(path.resolve(REPO_ROOT, argv.pdf))));
    const normalize = createNormalizer(spec.equivalentCharacters ?? DEFAULT_EQUIVALENT_CHARACTERS);
    const annotations = annotationsOf(spec.checks, model, pdf.pages, normalize);

    const unplaced = annotations.filter((annotation) => !annotation.target).length;
    for (const page of pdf.pages) {
        // Annotations without a place in the PDF are listed above the first page.
        const ofPage = annotations.filter(({ target }) => (target?.page ?? 0) === page.index);
        const layout = layoutPage(page, ofPage);
        const imagePath = originalPath.replace(/\.docx$/i, `-annotated-${page.index + 1}.webp`);

        const scene = excalidrawScene(layout, await page.renderPng(PAGE_PIXEL_RATIO));
        fs.writeFileSync(`${imagePath}.excalidraw`, JSON.stringify(scene, null, 2));
        // Saving the scene in the markup editor replaces it with the export.
        fs.copyFileSync(PLACEHOLDER_IMAGE, imagePath);
        console.log(`✅ ${ofPage.length} Anmerkungen: ${imagePath}`);
    }
    await pdf.close();
    if (unplaced > 0) {
        console.warn(`⚠️ ${unplaced} Anmerkungen ohne Stelle im PDF stehen über Seite 1.`);
    }
};

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
