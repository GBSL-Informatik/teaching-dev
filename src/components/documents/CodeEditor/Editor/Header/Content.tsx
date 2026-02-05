import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Reset from '@tdev-components/documents/CodeEditor/Actions/Reset';
import { observer } from 'mobx-react-lite';
import SyncStatus from '@tdev-components/SyncStatus';
import Icon from '@mdi/react';
import { mdiFlashTriangle } from '@mdi/js';
import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import DownloadCode from '../../Actions/DownloadCode';
import ShowRaw from '../../Actions/ShowRaw';
import RequestFullscreen from '@tdev-components/shared/RequestFullscreen';
import { useFullscreenTargetId } from '@tdev-hooks/useFullscreenTargetId';

interface Props<T extends CodeType> {
    code: iCode<T>;
    showFullscreenButton?: boolean;
}

const Content = observer(<T extends CodeType>(props: Props<T>) => {
    const { code, showFullscreenButton } = props;
    const notifyUnpersisted = code.root?.isDummy && !code.meta.slim && !code.meta.hideWarning;
    const targetId = useFullscreenTargetId();
    return (
        <>
            <div className={clsx(styles.title)}>{code.title}</div>
            <div className={clsx(styles.spacer)} />
            <RequestFullscreen
                targetId={targetId}
                adminOnly={!showFullscreenButton}
                className={clsx(styles.fullscreenButton)}
                onFullscreenChange={() => {
                    code.stopExecution();
                }}
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
