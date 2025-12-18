import React from 'react';
import { observer } from 'mobx-react-lite';
import _ from 'es-toolkit/compat';
import Image from './Image';
import { useDocument } from '@tdev-hooks/useDocument';
import { DocumentType } from '@tdev-api/document';

export interface Props {
    documentId: string;
}

const Preview = observer((props: Props) => {
    const excalidoc = useDocument<'excalidoc'>(props.documentId);
    if (!excalidoc) {
        return null;
    }
    return <Image image={excalidoc.data.image} />;
});

export default Preview;
