import Loader from '@tdev-components/Loader';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';
import { default as BranchOverview } from '../../Github/Branch/ExpandableOverwiew';
import { default as PrOverview } from '../../Github/PR/ExpandableOverwiew';
import FileTreeToggle from '../FileTreeToggle';
import BranchPathNav from './BranchPathNav';
import styles from './styles.module.scss';
import useReportVisibility from './useReportVisibility';

interface Props {}

const EditorNav = observer((props: Props) => {
    const cmsStore = useCmsStore();
    const { activeEntry, viewStore } = cmsStore;
    const [nav, setNav] = React.useState<HTMLDivElement | null>(null);
    useReportVisibility(nav);
    const isMobile = useIsMobileView(900);
    React.useEffect(() => {
        viewStore.setShowFileTree(!isMobile);
    }, [isMobile, viewStore]);

    if (!activeEntry) {
        return <Loader />;
    }

    return (
        <div ref={setNav} className={clsx(styles.editorNav)}>
            {viewStore.showFileTree && <div className={clsx(styles.navLeftSpacer)} />}
            <FileTreeToggle />
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
