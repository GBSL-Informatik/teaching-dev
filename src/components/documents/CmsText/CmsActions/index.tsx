import { observer } from 'mobx-react-lite';
import React from 'react';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import CmsImporter from '../CmsImporter';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { CmsTextEntries } from '../WithCmsText';

interface Props {
    entries: CmsTextEntries;
    className?: string;
    mode?: 'xlsx' | 'code';
}

const CmsActions = observer((props: Props) => {
    const { entries } = props;
    const documentRootIds = Object.values(entries);
    if (documentRootIds.length === 0) {
        return null;
    }
    return (
        <div className={clsx(styles.actions, props.className)}>
            <CmsImporter toAssign={entries} mode={props.mode} />
            <PermissionsPanel documentRootIds={documentRootIds} />
        </div>
    );
});

export default CmsActions;
