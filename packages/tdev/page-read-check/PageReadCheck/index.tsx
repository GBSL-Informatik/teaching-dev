import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { MetaInit, ModelMeta } from '../model/ModelMeta';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import Button from '@tdev-components/shared/Button';
import { mdiClock, mdiClockDigital } from '@mdi/js';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

interface Props extends MetaInit {
    id: string;
    hideTime?: boolean;
}

const PageReadCheck = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const viewStore = useStore('viewStore');
    const doc = useFirstMainDocument(props.id, meta);
    React.useEffect(() => {
        if (!viewStore.isPageVisible) {
            return;
        }
        const id = setInterval(() => {
            doc?.incrementReadTime(1);
        }, 1000);
        return () => {
            clearInterval(id);
        };
    }, [doc, viewStore.isPageVisible]);
    if (!doc) {
        return null;
    }

    return (
        <Button
            text={doc.fReadTime}
            icon={mdiClock}
            color={doc.read ? 'green' : 'gray'}
            iconSide="left"
            title={`Lesezeit: ${doc.fReadTimeLong}`}
            size={SIZE_S}
            onClick={() => {
                doc.setReadState(!doc.read);
            }}
        />
    );
});

export default PageReadCheck;
