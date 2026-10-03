import { mdiFlashTriangle } from '@mdi/js';
import Icon from '@mdi/react';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import SyncStatus from '@tdev-components/SyncStatus';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import NetpbmGraphic from '@tdev/netpbm-graphic/model/index';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { MetaInit, ModelMeta } from '../model/ModelMeta';
import NetpbmComponent from './NetpbmComponent';
import styles from './styles.module.scss';

const StateIcons = observer(({ doc }: { doc: NetpbmGraphic }) => (
    <span className={clsx(styles.stateIcons)}>
        <SyncStatus model={doc} size={0.7} />
        {doc.root?.isDummy && (
            <Icon path={mdiFlashTriangle} size={0.7} color="orange" title="Wird nicht gespeichert." />
        )}
    </span>
));

interface Props extends MetaInit {
    id: string;
    noEditor?: boolean;
    hideWarning?: boolean;
}

const NetpbmEditor = observer((props: Props) => {
    const meta = React.useMemo(() => new ModelMeta(props), [props.default]);
    const doc = useFirstMainDocument(props.id, meta);
    const ref = React.useRef<HTMLTextAreaElement>(null);
    React.useEffect(() => {
        if (!ref.current) {
            return;
        }
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                const textarea = e.target as HTMLTextAreaElement;
                if (!textarea) {
                    return;
                }
                e.preventDefault();
                const currentSize = parseFloat(window.getComputedStyle(textarea).fontSize);
                const newSize = e.deltaY < 0 ? currentSize * 1.1 : currentSize * 0.9;
                textarea.style.fontSize = `${newSize}px`;
            }
        };

        ref.current.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            ref.current?.removeEventListener('wheel', handleWheel);
        };
    }, []);

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
