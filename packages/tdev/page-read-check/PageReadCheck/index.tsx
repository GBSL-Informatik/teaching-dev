import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { MetaInit, ModelMeta } from '../model/ModelMeta';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import SlideButton from '@tdev-components/shared/SlideButton';
import Badge from '@tdev-components/shared/Badge';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { mdiFlashTriangle } from '@mdi/js';
import Icon from '@mdi/react';

interface Props extends MetaInit {
    id: string;
    hideTime?: boolean;
    hideWarning?: boolean;
    continueAfterUnlock?: boolean;
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
            if (!doc?.read || props.continueAfterUnlock) {
                doc?.incrementReadTime(1);
            }
        }, 1000);
        return () => {
            clearInterval(id);
        };
    }, [doc, viewStore.isPageVisible, props.continueAfterUnlock]);
    if (!doc) {
        return null;
    }

    return (
        <div className={clsx(styles.pageReadCheck)}>
            <SlideButton
                text={(unlocked) => (unlocked ? `Gelesen ${doc.fReadTime}` : doc.fReadTime)}
                onUnlock={() => doc.setReadState(true)}
                onReset={() => doc.setReadState(false)}
                isUnlocked={doc.read}
                disabled={!doc.canUnlock}
                sliderWidth={320}
                disabledReason={`Mindestens ${doc.meta.fMinReadTime} lesen, um zu entsperren`}
            />
            <div className={clsx(styles.status)}>
                {!doc.canUnlock && (
                    <Badge
                        title={`Mindestens ${doc.meta.fMinReadTime} lesen, um zu entsperren`}
                        className={clsx(styles.minReadTime)}
                    >
                        {doc.meta.fMinReadTime}
                    </Badge>
                )}
                {doc.isDummy && !props.hideWarning && (
                    <Icon
                        path={mdiFlashTriangle}
                        size={0.7}
                        color="var(--ifm-color-warning)"
                        title="Wird nicht gespeichert."
                    />
                )}
            </div>
        </div>
    );
});

export default PageReadCheck;
