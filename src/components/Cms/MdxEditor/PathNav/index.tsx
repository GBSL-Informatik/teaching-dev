import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import iEntry from '@tdev-models/cms/iEntry';
import Icon from '@mdi/react';

interface Props {
    item: iEntry;
}

const PathNav = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { item } = props;
    return (
        <div className={clsx(styles.PathNav)}>
            <nav aria-label="breadcrumbs">
                <ul className={clsx('breadcrumbs', 'breadcrumbs--sm')}>
                    {item.tree.map((part, index) => {
                        if (!part) {
                            return null;
                        }
                        return (
                            <li
                                className={clsx(
                                    'breadcrumbs__item',
                                    part.path === item.path && 'breadcrumbs__item--active'
                                )}
                                key={index}
                            >
                                {part.children.length > 0 ? (
                                    <div className={clsx('dropdown dropdown--hoverable')}>
                                        <button
                                            className={clsx(
                                                'button',
                                                'button--secondary',
                                                'button--sm',
                                                'breadcrumbs__link',
                                                styles.breadcrumbsButton
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                cmsStore.setActiveEntry(part);
                                            }}
                                        >
                                            {part.name}
                                        </button>
                                        <ul className={clsx('dropdown__menu')}>
                                            {part.children.map((child, idx) => {
                                                return (
                                                    <li key={idx}>
                                                        <a
                                                            className={clsx(
                                                                'dropdown__link',
                                                                styles.item,
                                                                child.path === item.path && styles.active
                                                            )}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                // if (child.type === 'dir') {
                                                                //     child.fetchDirectory();
                                                                // }
                                                                cmsStore.setActiveEntry(child);
                                                            }}
                                                        >
                                                            <Icon
                                                                path={child.icon}
                                                                color={child.iconColor}
                                                                size={0.7}
                                                            />{' '}
                                                            {child.name}
                                                        </a>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ) : (
                                    <a
                                        className={clsx('breadcrumbs__link')}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        href="#"
                                    >
                                        {part.name}
                                    </a>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
});

export default PathNav;
