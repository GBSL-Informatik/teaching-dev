import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiFileTree, mdiFileTreeOutline } from '@mdi/js';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import BranchPathNav from './BranchPathNav';
import Loader from '@tdev-components/Loader';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import { default as PrOverview } from '@tdev-components/Cms/Github/PR/ExpandableOverwiew';
import { default as BranchOverview } from '@tdev-components/Cms/Github/Branch/ExpandableOverwiew';

interface Props {}

const EditorNav = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { activeEntry, viewStore } = cmsStore;
    const { showFileTree } = viewStore;
    const isMobile = useIsMobileView(900);
    React.useEffect(() => {
        viewStore.setShowFileTree(!isMobile);
    }, [isMobile, viewStore]);

    if (!activeEntry) {
        return <Loader />;
    }

    return (
        <div className={clsx(styles.editorNav)}>
            {viewStore.showFileTree && <div className={clsx(styles.navLeftSpacer)} />}
            <Button
                icon={showFileTree ? mdiFileTree : mdiFileTreeOutline}
                color={showFileTree ? 'blue' : undefined}
                onClick={() => {
                    viewStore.setShowFileTree(!showFileTree);
                }}
                className={clsx(styles.toggleFileTree)}
                size={SIZE_S}
            />
            <BranchPathNav item={activeEntry} />
            <span className={clsx(styles.spacer)} />
            {cmsStore.activeBranch &&
                (cmsStore.activeBranch.PR ? (
                    <PrOverview pr={cmsStore.activeBranch.PR} />
                ) : (
                    <BranchOverview branch={cmsStore.activeBranch} />
                ))}
        </div>
    );
});

export default EditorNav;
