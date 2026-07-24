import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import User from '@tdev-models/User';

interface Props {
    user: User;
    onClick?: (user: User) => void;
    selected?: boolean;
    className?: string;
}

const BadgeSelector = observer((props: Props) => {
    const userStore = useStore('userStore');
    const svgId = React.useId();
    const { user } = props;
    /**
     * M 6,50 A 44,44 0 0 1 94,50
     * M 10,50 A 40,40 0 0 1 90,50
     * M 14,50 A 36,36 0 0 1 86,50
     * M 18,50 A 32,36 0 0 1 82,50
     * M 22,50 A 28,36 0 0 1 78,50
     */

    return (
        <div
            className={clsx(styles.badgeSelector, props.className, props.selected && styles.selected)}
            title={user.nameShort}
            onClick={(e) => {
                e.stopPropagation();
                props.onClick?.(user);
            }}
        >
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
            <svg viewBox="0 0 100 100">
                <path id={svgId} d="M 20,50 A 30,36 0 0 1 80,50" fill="none" />
                <text>
                    <textPath href={`#${svgId}`} startOffset="50%" textAnchor="middle">
                        {user.firstName}
                    </textPath>
                </text>
            </svg>
        </div>
    );
});

export default BadgeSelector;
