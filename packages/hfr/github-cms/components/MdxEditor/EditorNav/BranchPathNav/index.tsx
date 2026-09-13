import useIsMobileView from '@tdev-hooks/useIsMobileView';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import FileNav from '../../../../components/MdxEditor/EditorNav/BranchPathNav/FileNav';
import iEntry from '../../../../models/iEntry';
import BranchSelector from './BranchSelector';
import DirNav from './DirNav';
import styles from './styles.module.scss';

interface Props {
    item: iEntry;
}

const BranchPathNav = observer((props: Props) => {
    const { item } = props;
    const isMobile = useIsMobileView(550);
    return (
        <div className={clsx(styles.pathNav)}>
            <nav aria-label="breadcrumbs" className={clsx(styles.breadcrumbs)}>
                <div className={clsx(styles.part)}>
                    <BranchSelector compact />
                </div>
                {item.tree.map((part, idx) => {
                    if (!part) {
                        return null;
                    }
                    if (part.type === 'dir') {
                        return (
                            <div className={clsx(styles.part)} key={idx}>
                                <DirNav dir={part} partOf="nav" noDropdown={isMobile} />
                            </div>
                        );
                    }
                    return (
                        <div className={clsx(styles.part)} key={idx}>
                            <FileNav file={part} isActive className={clsx(styles.part)} linkToGithub />
                        </div>
                    );
                })}
            </nav>
        </div>
    );
});

export default BranchPathNav;
