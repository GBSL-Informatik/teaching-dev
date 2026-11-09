import { observer } from 'mobx-react-lite';
import React from 'react';
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
 * WYSIWYG editor for md(x) files. When the file is not valid mdx, the source editor is shown
 * with the error, see `File.showSource`.
 */
const MdxEditor = observer(({ file }: Props) => {
    const [document] = React.useState(() => createDocument(file));
    React.useEffect(() => {
        if (document instanceof Error) {
            file.showSource(document.message);
        }
    }, [document, file]);
    if (document instanceof Error) {
        return null;
    }
    return <Editor document={document} />;
});

export default MdxEditor;
