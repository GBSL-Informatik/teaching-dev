import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { MetaInit, ModelMeta } from '../model/ModelMeta';
import NetpbmComponent from './NetpbmComponent';

interface Props extends MetaInit {
    id: string;
    noEditor?: boolean;
    hideWarning?: boolean;
}

const NetpbmEditor = observer((props: Props) => {
    const meta = React.useMemo(() => new ModelMeta(props), [props.default]);
    const doc = useFirstMainDocument(props.id, meta);
    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }

    return (
        <NetpbmComponent
            doc={doc}
            noEditor={props.noEditor}
            hideWarning={props.hideWarning}
            readonly={props.readonly}
        />
    );
});

export default NetpbmEditor;
