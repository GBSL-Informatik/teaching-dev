import PermissionsPanel from '@tdev-components/PermissionsPanel';
import DivSpanWrapper from '@tdev-components/shared/DivSpanWrapper';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import CmsImporter from '../CmsImporter';
import { CmsTextEntries } from '../WithCmsText';
import styles from './styles.module.scss';

interface Props {
    entries: CmsTextEntries;
    className?: string;
    mode?: 'xlsx' | 'code';
    inline?: boolean;
}

const CmsActions = observer((props: Props) => {
    const { entries } = props;
    const documentRootIds = Object.values(entries);
    if (documentRootIds.length === 0) {
        return null;
    }
    return (
        <DivSpanWrapper
            inline={props.inline}
            className={clsx(styles.actions, props.inline && styles.inline, props.className)}
        >
            <CmsImporter toAssign={entries} mode={props.mode} />
            <PermissionsPanel documentRootIds={documentRootIds} />
        </DivSpanWrapper>
    );
});

export default CmsActions;
