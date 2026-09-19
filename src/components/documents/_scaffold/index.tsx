import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { observer } from 'mobx-react-lite';
import React from 'react';

// @ts-ignore
interface Props extends MetaInit {
    id: string;
}

const Component = observer((props: Props) => {
    // @ts-ignore
    const meta = React.useMemo(() => new ModelMeta(props), [props.id]);

    const doc = useFirstMainDocument(props.id, meta);
    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }
    return <div></div>;
});

export default Component;
