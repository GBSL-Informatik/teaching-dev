import React from 'react';
import clsx from 'clsx';
import shared from '../styles.module.scss';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Loader from '@tdev-components/Loader';
import Icon from '@mdi/react';
import { mdiSourceBranch, mdiSourceBranchPlus } from '@mdi/js';
import Popup from 'reactjs-popup';
import NewBranch from '@tdev-components/Cms/Github/Branch/NewBranch';
import { PopupActions } from 'reactjs-popup/dist/types';
import Card from '@tdev-components/shared/Card';
import NavItem from '../NavItem';

interface Props {
    compact?: boolean;
}

const BranchSelector = observer((props: Props) => {
    const ref = React.useRef<PopupActions>(null);
    const cmsStore = useStore('cmsStore');
    const { activeBranchName } = cmsStore;
    if (!activeBranchName) {
        return <Loader title="Laden..." />;
    }

    return (
        <Popup
            ref={ref}
            on="hover"
            arrow={false}
            trigger={
                <div>
                    <NavItem
                        icon={mdiSourceBranch}
                        color={
                            activeBranchName === cmsStore.github?.defaultBranchName
                                ? 'var(--ifm-color-success)'
                                : 'var(--ifm-color-blue)'
                        }
                        name={activeBranchName}
                    />
                </div>
            }
            position="bottom left"
            nested
        >
            <Card classNames={{ body: styles.menu, card: styles.menuCard }}>
                {cmsStore.branchNames.map((br, idx) => {
                    const isActive = br === activeBranchName;
                    return (
                        <NavItem
                            key={idx}
                            icon={mdiSourceBranch}
                            color={
                                isActive
                                    ? 'var(--ifm-color-blue)'
                                    : br === cmsStore.github?.defaultBranchName
                                      ? 'var(--ifm-color-success)'
                                      : undefined
                            }
                            onClick={(e) => {
                                cmsStore.setBranch(br);
                            }}
                            name={br}
                        />
                    );
                })}
                <Popup
                    trigger={
                        <div>
                            <NavItem
                                icon={mdiSourceBranchPlus}
                                color={'var(--ifm-color-warning)'}
                                name="Neuer Branch"
                                propagateClick
                            />
                        </div>
                    }
                    ref={ref}
                    modal
                    on="click"
                    overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                >
                    <NewBranch
                        onDone={() => {
                            ref.current?.close();
                        }}
                        onDiscard={() => {
                            ref.current?.close();
                        }}
                    />
                </Popup>
            </Card>
        </Popup>
    );
});

export default BranchSelector;
