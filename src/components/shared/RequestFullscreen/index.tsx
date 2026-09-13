import { mdiFullscreen, mdiFullscreenExit } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';
import Button from '../Button';
import { Color } from '../Colors';

interface Props {
    targetId: string;
    size?: number;
    color?: Color | string;
    adminOnly?: boolean;
    className?: string;
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
                } else {
                    viewStore.requestFullscreen(id);
                }
            }}
            className={className}
            color={props.color || 'blue'}
            size={props.size}
            title={isFullscreen ? 'Vollbildmodus beenden' : 'Vollbildmodus'}
            icon={isFullscreen ? mdiFullscreenExit : mdiFullscreen}
        />
    );
});

export default RequestFullscreen;
