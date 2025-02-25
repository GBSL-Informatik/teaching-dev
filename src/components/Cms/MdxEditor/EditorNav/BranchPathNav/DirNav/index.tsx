import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Dir from '@tdev-models/cms/Dir';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import Card from '@tdev-components/shared/Card';
import Loader from '@tdev-components/Loader';
import NavItem from '@tdev-components/Cms/MdxEditor/EditorNav/BranchPathNav/NavItem';
import { action } from 'mobx';
import FileNav from '@tdev-components/Cms/MdxEditor/EditorNav/BranchPathNav/FileNav';

interface Props {
    dir: Dir;
    partOf: 'nav' | 'menu';
    isActive?: boolean;
    className?: string;
    noDropdown?: boolean;
}

const DirItem = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { dir, partOf, isActive, className } = props;
    return (
        <NavItem
            onClick={action(() => {
                dir.setOpen(true);
                cmsStore.setActiveEntry(dir);
            })}
            icon={partOf === 'menu' ? dir.icon : undefined}
            color={dir.iconColor}
            name={dir.name}
            isActive={isActive}
            className={clsx(className)}
        />
    );
});

const DirNav = observer((props: Props) => {
    const { dir, partOf } = props;
    const cmsStore = useStore('cmsStore');
    const activeFilePath = cmsStore.activeFilePath || '';
    const ref = React.useRef<PopupActions>(null);
    if (props.noDropdown) {
        return <DirItem {...props} />;
    }

    return (
        <Popup
            ref={ref}
            on="hover"
            arrow={false}
            trigger={
                <div>
                    <DirItem {...props} />
                </div>
            }
            onOpen={() => {
                dir.fetchDirectory();
            }}
            position={partOf === 'menu' ? 'right top' : 'bottom left'}
            offsetY={partOf === 'menu' ? -15 : 0}
            offsetX={partOf === 'menu' ? 5 : 0}
            nested
        >
            <Card classNames={{ body: styles.menu, card: styles.menuCard }}>
                {!dir.isLoaded && <Loader />}
                {dir.children.map((c, idx) => {
                    if (c.type === 'dir') {
                        return (
                            <DirNav
                                dir={c}
                                key={idx}
                                partOf="menu"
                                isActive={activeFilePath.startsWith(c.path)}
                            />
                        );
                    }
                    return <FileNav file={c} key={idx} isActive={activeFilePath === c.path} />;
                })}
            </Card>
        </Popup>
    );
});

export default DirNav;
