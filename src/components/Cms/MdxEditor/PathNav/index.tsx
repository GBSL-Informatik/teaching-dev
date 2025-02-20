import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import iEntry from '@tdev-models/cms/iEntry';
import Icon from '@mdi/react';
import BranchSelector from './BranchSelector';

interface Props {
    item: iEntry;
}

const PathNav = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { item } = props;
    const [closeDropdown, setCloseDropdown] = React.useState(false);
    React.useEffect(() => {
        if (closeDropdown) {
            setCloseDropdown(false);
        }
    }, [closeDropdown]);
    return (
        <div className={clsx(styles.pathNav)}>
            <nav aria-label="breadcrumbs" className={clsx(styles.breadcrumbNav)}>
                <ul className={clsx('breadcrumbs', 'breadcrumbs--sm', styles.breadcrumbs)}>
                    <BranchSelector compact />
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
                                    <div className={clsx('dropdown dropdown--hoverable', styles.dropdown)}>
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
                                        {!closeDropdown && (
                                            <ul className={clsx('dropdown__menu', styles.dropdownMenu)}>
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
                                                                    setCloseDropdown(true);
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
                                        )}
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
