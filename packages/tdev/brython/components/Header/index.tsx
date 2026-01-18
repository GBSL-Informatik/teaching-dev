import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Reset from '@tdev-components/documents/CodeEditor/Actions/Reset';
import DownloadCode from '@tdev-components/documents/CodeEditor/Actions/DownloadCode';
import ShowRaw from '@tdev-components/documents/CodeEditor/Actions/ShowRaw';
import RunCode from '@tdev-components/documents/CodeEditor/Actions/RunCode';
import { observer } from 'mobx-react-lite';
import SyncStatus from '@tdev-components/SyncStatus';
import Icon from '@mdi/react';
import { mdiFlashTriangle } from '@mdi/js';
import Script from '@tdev-models/documents/Script';

interface Props {
    script: Script;
}

const Header = observer((props: Props) => {
    const { script } = props;
    const notifyUnpersisted = script.root?.isDummy && !script.meta.slim && !script.meta.hideWarning;
    if (!script) {
        return null;
    }
    return (
        <div
            className={clsx(
                styles.controls,
                script.meta.slim && styles.slim,
                notifyUnpersisted && styles.unpersisted
            )}
        >
            {!script.meta.slim && (
                <React.Fragment>
                    <div className={styles.title}>{script.title}</div>
                    <div className={styles.spacer} />
                    {notifyUnpersisted && (
                        <Icon
                            path={mdiFlashTriangle}
                            size={0.7}
                            color="orange"
                            title="Wird nicht gespeichert."
                            className={styles.dummyIndicatorIcon}
                        />
                    )}
                    <div className={styles.spacer} />
                    <SyncStatus model={script} />
                    {script.hasEdits && script.meta.isResettable && <Reset script={script} />}
                    {script.meta.canDownload && <DownloadCode script={script} />}
                    {script.hasEdits && script.meta.canCompare && <ShowRaw script={script} />}
                </React.Fragment>
            )}
            {script.canExecute && <RunCode script={script} />}
        </div>
    );
});

export default Header;
