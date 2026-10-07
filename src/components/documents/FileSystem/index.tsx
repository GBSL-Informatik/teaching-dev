import type * as DocumentFileTreeLib from '@tdev-components/documents/FileSystem/DocumentFileTree';
import Loader from '@tdev-components/Loader';
import { useClientLib } from '@tdev-hooks/useClientLib';
import { useFirstRealMainDocument } from '@tdev-hooks/useFirstRealMainDocument';
import { ModelMeta } from '@tdev-models/documents/FileSystem/Directory';
import { MetaInit } from '@tdev-models/documents/FileSystem/iFileSystem';
import { observer } from 'mobx-react-lite';
import React from 'react';

interface Props extends MetaInit {
    id: string;
    className?: string;
    name?: string;
    height?: string;
}

const FileSystem = observer((props: Props) => {
    const meta = React.useMemo(() => new ModelMeta(props), [props.id]);
    const doc = useFirstRealMainDocument(props.id, meta);
    const Lib = useClientLib<typeof DocumentFileTreeLib>(
        () => import('@tdev-components/documents/FileSystem/DocumentFileTree'),
        '@tdev-components/documents/FileSystem/DocumentFileTree'
    );
    if (!doc || !Lib) {
        return <Loader />;
    }
    return <Lib.default dir={doc} height={props.height || 'calc(80vh - 5rem)'} name={props.name} />;
});

export default FileSystem;
