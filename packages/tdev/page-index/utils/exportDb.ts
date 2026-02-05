import db from './db';
import { promises as fs } from 'fs';
import { pageIndexPath } from './options';
import { PageIndex } from '..';

const getDocumentRoots = db.prepare('SELECT * FROM document_roots ORDER BY path ASC, position ASC');

export const getContent = () => {
    const documentRoots = getDocumentRoots.all() as PageIndex[];
    return { documentRoots };
};

export const exportDB = async () => {
    await fs.writeFile(pageIndexPath, JSON.stringify(getContent(), null, 2));
};
