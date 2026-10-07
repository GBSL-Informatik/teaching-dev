import Loader from '@tdev-components/Loader';
import { useFirstRealMainDocument } from '@tdev-hooks/useFirstRealMainDocument';
import { ModelMeta } from '@tdev-models/documents/FileSystem/Directory';
import { MetaInit } from '@tdev-models/documents/FileSystem/iFileSystem';
import { observer } from 'mobx-react-lite';
import React from 'react';
import DocumentFileTree from './DocumentFileTree';

interface Props extends MetaInit {
    id: string;
    className?: string;
}

const FileSystem = observer((props: Props) => {
    const meta = React.useMemo(() => new ModelMeta(props), [props.id]);
    const doc = useFirstRealMainDocument(props.id, meta);
    if (!doc) {
        return <Loader />;
    }
    return <DocumentFileTree dir={doc} height="calc(80vh - 3em)" />;
});

export default FileSystem;
