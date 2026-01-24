import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Button from '../Button';
import useFullscreenChange, { currentFullscreenElement } from '@tdev-hooks/useFullscreen';
import { mdiFullscreen, mdiFullscreenExit } from '@mdi/js';
import { Color } from '../Colors';
import { useStore } from '@tdev-hooks/useStore';

interface Props {
    targetId: string;
    size?: number;
    color?: Color | string;
    adminOnly?: boolean;
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

const RequestFullscreen = observer((props: Props) => {
    const { targetId: id, onFullscreenChange } = props;
    const userStore = useStore('userStore');
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const onChangeFullscreen = React.useCallback(
        (fullscreen: boolean) => {
            setIsFullscreen(fullscreen);
            onFullscreenChange?.(fullscreen);
        },
        [onFullscreenChange]
    );
    const { requestFullscreen } = useFullscreenChange(id, onChangeFullscreen);
    const toggleFullscreen = React.useCallback(() => {
        const fullscreenElement = currentFullscreenElement();
        if (fullscreenElement) {
            document.exitFullscreen();
        } else {
            requestFullscreen();
        }
    }, [id, requestFullscreen]);
    if (props.adminOnly && !userStore.current?.hasElevatedAccess) {
        return null;
    }
    return (
        <Button
            onClick={toggleFullscreen}
            color={props.color || 'blue'}
            size={props.size}
            title={isFullscreen ? 'Vollbildmodus beenden' : 'Vollbildmodus'}
            icon={isFullscreen ? mdiFullscreenExit : mdiFullscreen}
        />
    );
});

export default RequestFullscreen;
