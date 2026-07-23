import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import AccessSelector from '.';
import { Access, DocumentType } from '@tdev-api/document';
import DocumentRoot from '@tdev-models/DocumentRoot';

interface Props {
    documentRoot: DocumentRoot<DocumentType>;
    maxAccess?: Access;
    className?: string;
}

const SharedAccessSelector = observer((props: Props) => {
    const { documentRoot } = props;

    return (
        <AccessSelector
            accessTypes={[Access.None_DocumentRoot, Access.RO_DocumentRoot, Access.RW_DocumentRoot]}
            access={documentRoot.sharedAccess}
            onChange={(access) => {
                documentRoot.setSharedAccess(access);
                documentRoot.save();
            }}
            maxAccess={props.maxAccess}
        />
    );
});

export default SharedAccessSelector;
