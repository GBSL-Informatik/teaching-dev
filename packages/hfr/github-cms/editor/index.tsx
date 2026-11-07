import { observer } from 'mobx-react-lite';
import React from 'react';
import DefaultEditor from '../components/Github/DefaultEditor';
import type File from '../models/File';
import Editor from './Editor';
import MdxDocument from './models/MdxDocument';

interface Props {
    file: File;
}

const createDocument = (file: File): MdxDocument | Error => {
    try {
        return new MdxDocument(file);
    } catch (error) {
        return error instanceof Error ? error : new Error(String(error));
    }
};

/**
 * WYSIWYG editor for md(x) files. Falls back to the source code editor when the file
 * is not valid mdx.
 */
const MdxEditor = observer(({ file }: Props) => {
    const [document] = React.useState(() => createDocument(file));
    if (document instanceof Error) {
        return (
            <div>
                <div className="alert alert--warning" role="alert">
                    Die Datei kann nicht im visuellen Editor geöffnet werden: {document.message}
                </div>
                <DefaultEditor file={file} />
            </div>
        );
    }
    return <Editor document={document} />;
});

export default MdxEditor;
