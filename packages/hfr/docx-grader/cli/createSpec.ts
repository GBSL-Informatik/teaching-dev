import minimist from 'minimist';
import fs from 'node:fs';
import path from 'node:path';
import { extractChecks } from '../checks/extractChecks';
import { DEFAULT_EQUIVALENT_CHARACTERS } from '../checks/normalizeText';
import { buildDocModel } from '../docx/buildDocModel';
import { readDocx } from '../docx/readDocx';
import { createRawDocx } from '../raw/createRawDocx';
import { SPEC_VERSION } from '../spec/DocxSpec';
import { selectChecks } from './selectChecks';
import { mergeWithPreviousSpec, readSpecFile, warnAboutDroppedHints, writeSpecFile } from './specFile';

// `yarn workspace` runs the script in the package folder, so paths are relative to the repository.
const REPO_ROOT = path.resolve(__dirname, '../../../..');

const USAGE = `
yarn workspace @hfr/docx-grader create-spec <original.docx> [--out <name.docx-spec.yaml>] [--all]

Extracts the formatting of the original document and writes it as checks to a docx-spec,
and writes the unformatted document for students as <original>-raw.docx.
Relative paths are resolved from the repository root.

  --out   spec file to write; defaults to <original>.docx-spec.yaml next to the document
  --all   keep all checks without asking

Running it again on an existing spec preselects the kept checks and keeps their hint and docs.
`;

const main = async () => {
    const argv = minimist(process.argv.slice(2), { boolean: ['all', 'help'], string: ['out'] });
    // The spec and raw document are written next to the original, by replacing its extension.
    if (argv.help || argv._.length !== 1 || !/\.docx$/i.test(String(argv._[0]))) {
        console.log(USAGE);
        return;
    }

    const originalPath = path.resolve(REPO_ROOT, String(argv._[0]));
    const specPath = argv.out
        ? path.resolve(REPO_ROOT, argv.out)
        : originalPath.replace(/\.docx$/i, '.docx-spec.yaml');

    const previousSpec = fs.existsSync(specPath) ? readSpecFile(specPath) : undefined;
    const equivalents = previousSpec?.equivalentCharacters ?? DEFAULT_EQUIVALENT_CHARACTERS;
    const originalData = fs.readFileSync(originalPath);
    const original = buildDocModel(await readDocx(originalData));
    const checks = extractChecks(original, equivalents);
    warnAboutDroppedHints(checks, previousSpec);

    const selectedIds = argv.all
        ? new Set(checks.map((check) => check.id))
        : await selectChecks(checks, previousSpec);

    await writeSpecFile(specPath, {
        version: SPEC_VERSION,
        source: path.basename(originalPath),
        ...(previousSpec?.equivalentCharacters ? { equivalentCharacters: equivalents } : {}),
        ...(previousSpec?.defaultSource ? { defaultSource: previousSpec.defaultSource } : {}),
        checks: mergeWithPreviousSpec(
            checks.filter((check) => selectedIds.has(check.id)),
            previousSpec
        )
    });
    console.log(`✅ ${selectedIds.size} von ${checks.length} Checks gespeichert: ${specPath}`);

    const rawPath = originalPath.replace(/\.docx$/i, '-raw.docx');
    const raw = await createRawDocx(originalData);
    fs.writeFileSync(rawPath, raw.data);
    console.log(`✅ Unformatiertes Dokument gespeichert: ${rawPath}`);
    if (raw.skippedImageCount > 0) {
        console.warn(
            `⚠️ ${raw.skippedImageCount} verknüpfte oder unbekannte Bilder wurden nicht übernommen.`
        );
    }
};

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
