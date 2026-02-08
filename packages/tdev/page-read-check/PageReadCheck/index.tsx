import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { MetaInit, ModelMeta } from '../model/ModelMeta';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import SlideButton from '@tdev-components/shared/SlideButton';

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
            doc?.saveNow();
            clearInterval(id);
        };
    }, [doc, viewStore.isPageVisible]);
    if (!doc) {
        return null;
    }

    return (
        <SlideButton
            text={doc.fReadTime}
            unlockedText={`Gelesen ${doc.fReadTime}`}
            onUnlock={() => doc.setReadState(true)}
            onReset={() => doc.setReadState(false)}
            isUnlocked={doc.read}
            disabled={doc.readTime < meta.minReadTime}
        />
    );
});

export default PageReadCheck;
