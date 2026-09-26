import { mdiFlashTriangle } from '@mdi/js';
import Icon from '@mdi/react';
import type { CodeType } from '@tdev-api/document';
import Reset from '@tdev-components/documents/CodeEditor/Actions/Reset';
import RequestFullscreen from '@tdev-components/shared/RequestFullscreen';
import RequestPresentationMode from '@tdev-components/shared/RequestPresentationMode';
import SyncStatus from '@tdev-components/SyncStatus';
import { useFullscreenTargetId } from '@tdev-hooks/useFullscreenTargetId';
import { useStore } from '@tdev-hooks/useStore';
import type iCode from '@tdev-models/documents/iCode';
import clsx from 'clsx';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import DownloadCode from '../../Actions/DownloadCode';
import ShowRaw from '../../Actions/ShowRaw';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
    showFullscreenButton?: boolean;
}

const Content = observer(<T extends CodeType>(props: Props<T>) => {
    const { code, showFullscreenButton } = props;
    const viewStore = useStore('viewStore');
    const notifyUnpersisted = code.root?.isDummy && !code.meta.slim && !code.meta.hideWarning;
    const targetId = useFullscreenTargetId();
    React.useEffect(() => {
        return reaction(
            () => viewStore.fullscreenTargetId === targetId,
            () => {
                code.stopExecution();
            },
            { fireImmediately: false }
        );
    }, [targetId, code]);
    return (
        <>
            <div className={clsx(styles.title)}>{code.title}</div>
            <div className={clsx(styles.spacer)} />
            <RequestPresentationMode document={code} className={clsx(styles.hoverButton)} />
            <RequestFullscreen
                targetId={targetId}
                adminOnly={!showFullscreenButton}
                className={clsx(styles.hoverButton)}
            />
            {notifyUnpersisted && (
                <Icon
                    path={mdiFlashTriangle}
                    size={0.7}
                    color="orange"
                    title="Wird nicht gespeichert."
                    className={clsx(styles.dummyIndicatorIcon)}
                />
            )}
            <div className={clsx(styles.spacer)} />
            <SyncStatus model={code} />
            {code.hasEdits && code.meta.isResettable && <Reset code={code} />}
            {code.meta.canDownload && <DownloadCode code={code} />}
            {code.hasEdits && code.meta.canCompare && <ShowRaw code={code} />}
        </>
    );
});

export default Content;
