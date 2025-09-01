import Icon from '@mdi/react';
import { mdiCircle } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { useIsLive } from '@tdev-hooks/useIsLive';

interface Props {
    userId?: string;
    size?: number;
    className?: string;
}

const countConnectedClients = (userId: string) => {
    const userStore = useStore('userStore');
    const socketStore = useStore('socketStore');

    const connectedClients = socketStore.connectedClients.get(userId) || 0;
    const viewingThisUser = userStore.isUserSwitched && userId === userStore.viewedUser?.id;
    return Math.max(viewingThisUser ? connectedClients - 1 : connectedClients, 0);
};

const LiveStatusIndicator = ({ userId, size, className }: Props) => {
    const isLive = useIsLive();

    return (
        <Icon
            path={mdiCircle}
            size={size ?? 0.3}
            color={
                (!!userId ? countConnectedClients(userId) > 0 : isLive)
                    ? 'var(--ifm-color-success)'
                    : 'var(--ifm-color-danger)'
            }
            className={className ?? ''}
        />
    );
};

export default LiveStatusIndicator;
