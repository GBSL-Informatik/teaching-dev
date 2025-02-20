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

interface Props {
    compact?: boolean;
}

const BranchSelector = observer((props: Props) => {
    const ref = React.useRef<PopupActions>(null);
    const cmsStore = useStore('cmsStore');
    const { activeBranchName } = cmsStore;
    if (!activeBranchName) {
        return (
            <li className={clsx('breadcrumbs__item')}>
                <Loader title="Laden..." />
            </li>
        );
    }

    return (
        <li className={clsx('breadcrumbs__item')}>
            <div className={clsx('dropdown dropdown--hoverable')}>
                <button
                    className={clsx(
                        'button',
                        'button--secondary',
                        'button--sm',
                        'breadcrumbs__link',
                        shared.breadcrumbsButton,
                        styles.branchButton
                    )}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <Icon
                        path={mdiSourceBranch}
                        color={
                            activeBranchName === cmsStore.github?.defaultBranchName
                                ? 'var(--ifm-color-success)'
                                : 'var(--ifm-color-blue)'
                        }
                        size={0.7}
                    />{' '}
                    <span className={clsx(styles.name, props.compact && styles.compact)}>
                        {activeBranchName}
                    </span>
                </button>
                <ul className={clsx('dropdown__menu')}>
                    {cmsStore.branchNames.map((br, idx) => {
                        const isActive = br === activeBranchName;
                        return (
                            <li key={idx}>
                                <a
                                    className={clsx(
                                        'dropdown__link',
                                        styles.item,
                                        shared.item,
                                        isActive && shared.active
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        cmsStore.setBranch(br);
                                    }}
                                >
                                    <Icon
                                        path={mdiSourceBranch}
                                        color={
                                            isActive
                                                ? 'var(--ifm-color-blue)'
                                                : br === cmsStore.github?.defaultBranchName
                                                  ? 'var(--ifm-color-success)'
                                                  : undefined
                                        }
                                        size={0.7}
                                    />{' '}
                                    {br}
                                </a>
                            </li>
                        );
                    })}
                    <li>
                        <Popup
                            trigger={
                                <a
                                    className={clsx(
                                        'dropdown__link',
                                        styles.item,
                                        shared.item,
                                        styles.newBranch
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    <Icon
                                        path={mdiSourceBranchPlus}
                                        color={'var(--ifm-color-warning)'}
                                        size={0.7}
                                    />{' '}
                                    Neuer Branch
                                </a>
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
                    </li>
                </ul>
            </div>
        </li>
    );
});

export default BranchSelector;
