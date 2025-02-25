import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Icon from '@mdi/react';

interface Props {
    icon?: string;
    color?: string;
    onClick?: (e?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    name: string;
    isActive?: boolean;
    className?: string;
    propagateClick?: boolean;
}

const NavItem = observer((props: Props) => {
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
