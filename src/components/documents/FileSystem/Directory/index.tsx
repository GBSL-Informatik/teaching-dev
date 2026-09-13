import type { default as DirectoryComponentType } from '@tdev-components/documents/FileSystem/Directory/Directory';
import Loader from '@tdev-components/Loader';
import { useClientLib } from '@tdev-hooks/useClientLib';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { ModelMeta } from '@tdev-models/documents/FileSystem/Directory';
import { MetaInit } from '@tdev-models/documents/FileSystem/iFileSystem';
import { observer } from 'mobx-react-lite';
import React from 'react';

import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
interface Props extends MetaInit {
    id: string;
}

const Directory = observer((props: Props) => {
    const meta = React.useMemo(() => new ModelMeta(props), [props.id]);
    const doc = useFirstMainDocument(props.id, meta);
    const DirectoryComponent = useClientLib<typeof DirectoryComponentType>(
        () => import('@tdev-components/documents/FileSystem/Directory/Directory').then((d) => d.default),
        '@tdev-components/documents/FileSystem/Directory/Directory'
    );
    if (!DirectoryComponent) {
        return <Loader />;
    }
    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }
    return <DirectoryComponent dir={doc} />;
});

export default Directory;
