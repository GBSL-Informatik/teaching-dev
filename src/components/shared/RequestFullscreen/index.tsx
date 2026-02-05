import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Button from '../Button';
import { mdiFullscreen, mdiFullscreenExit } from '@mdi/js';
import { Color } from '../Colors';
import { useStore } from '@tdev-hooks/useStore';

interface Props {
    targetId: string;
    size?: number;
    color?: Color | string;
    adminOnly?: boolean;
    className?: string;
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

const RequestFullscreen = observer((props: Props) => {
    const { targetId: id, className } = props;
    const userStore = useStore('userStore');
    const viewStore = useStore('viewStore');
    if (props.adminOnly && !userStore.current?.hasElevatedAccess) {
        return null;
    }
    const isFullscreen = viewStore.isFullscreenTarget(id);
    return (
        <Button
            onClick={() => {
                if (viewStore.isFullscreenTarget(id)) {
                    viewStore.exitFullscreen();
                    props.onFullscreenChange?.(false);
                } else {
                    viewStore.requestFullscreen(id);
                    props.onFullscreenChange?.(true);
                }
            }}
            className={props.className}
            color={props.color || 'blue'}
            size={props.size}
            title={isFullscreen ? 'Vollbildmodus beenden' : 'Vollbildmodus'}
            icon={isFullscreen ? mdiFullscreenExit : mdiFullscreen}
        />
    );
});

export default RequestFullscreen;
