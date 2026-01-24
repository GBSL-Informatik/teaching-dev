import React from 'react';

export const FullscreenContext = React.createContext<boolean>(false);

export const currentFullscreenElement = () => {
    return (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
    );
};

export const exitFullscreen = () => {
    if (!document.fullscreenElement) {
        return;
    }
    document.exitFullscreen?.();
};

export default function useFullscreenChange(elementId: string, onChange: (isFullscreen: boolean) => void) {
    const checkFullscreen = React.useEffectEvent(() => {
        const fullscreenEl = currentFullscreenElement();
        if (fullscreenEl) {
            onChange(fullscreenEl.id === elementId);
        } else {
            onChange(false);
        }
    });
    React.useEffect(() => {
        document.addEventListener('fullscreenchange', checkFullscreen);
        document.addEventListener('webkitfullscreenchange', checkFullscreen);
        document.addEventListener('mozfullscreenchange', checkFullscreen);

        return () => {
            document.removeEventListener('fullscreenchange', checkFullscreen);
            document.removeEventListener('webkitfullscreenchange', checkFullscreen);
            document.removeEventListener('mozfullscreenchange', checkFullscreen);
        };
    }, []);

    const requestFullscreen = React.useCallback(() => {
        const element = document.getElementById(elementId);
        if (!element) {
            return;
        }
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
            (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
            (element as any).mozRequestFullScreen();
        }
    }, [elementId]);

    return { requestFullscreen };
}

export function useIsFullscreen() {
    return React.useContext(FullscreenContext);
}
