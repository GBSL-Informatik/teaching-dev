import { mdiCircle } from '@mdi/js';
import Icon from '@mdi/react';
import { useIsLive } from '@tdev-hooks/useIsLive';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

interface Props {
    userId?: string;
    size?: number;
    className?: string;
}

const LiveStatusIndicator = observer(({ userId, size, className }: Props) => {
    const isLive = useIsLive();
    const userStore = useStore('userStore');
    const socketStore = useStore('socketStore');
    const connectedClients = socketStore.connectedClients.get(userId ?? '') || 0;
    const openConnections = Math.max(userStore.isUserSwitched ? connectedClients - 1 : connectedClients, 0);
    return (
        <Icon
            path={mdiCircle}
            size={size ?? 0.3}
            color={
                (!!userId ? openConnections > 0 : isLive)
                    ? 'var(--ifm-color-success)'
                    : 'var(--ifm-color-danger)'
            }
            className={clsx(className)}
        />
    );
});

export default LiveStatusIndicator;
