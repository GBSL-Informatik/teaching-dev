import fs from 'node:fs';
import path from 'node:path';
import { buildDocModel } from '../docx/buildDocModel';
import { readDocx } from '../docx/readDocx';

/** Sample documents of issue #385, with their images emptied to keep them small. */
export const loadFixture = async (name: string) => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures', `${name}.docx`));
    return buildDocModel(await readDocx(data));
};
