import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Icon from '@mdi/react';

interface Props {
    icon?: string;
    color?: string;
    onClick?: (e?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    href?: string | null;
    name: string;
    isActive?: boolean;
    className?: string;
    propagateClick?: boolean;
}

const NavItemLink = observer((props: Props & { href: string }) => {
    return (
        <a
            className={clsx(styles.navItem, props.className, props.isActive && styles.active)}
            href={props.href}
            target="_blank"
        >
            {props.icon && <Icon path={props.icon} color={props.color} size={0.7} />}
            {props.name}
        </a>
    );
});

const NavItem = observer((props: Props) => {
    if (props.href) {
        return <NavItemLink {...props} href={props.href} />;
    }
    return (
        <div
            className={clsx(styles.navItem, props.className, props.isActive && styles.active)}
            onClick={(e) => {
                if (!props.propagateClick) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                props.onClick?.(e);
            }}
        >
            {props.icon && <Icon path={props.icon} color={props.color} size={0.7} />}
            {props.name}
        </div>
    );
});

export default NavItem;
