import React from 'react';

export const FullscreenContext = React.createContext<boolean>(false);

export default function useFullscreenChange(elementId: string, onChange: (isFullscreen: boolean) => void) {
    React.useEffect(() => {
        const element = document.getElementById(elementId);
        if (!element) {
            return;
        }
        function checkFullscreen() {
            const fullscreenEl =
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement;
            onChange(fullscreenEl === element);
        }

        document.addEventListener('fullscreenchange', checkFullscreen);
        document.addEventListener('webkitfullscreenchange', checkFullscreen);
        document.addEventListener('mozfullscreenchange', checkFullscreen);

        return () => {
            document.removeEventListener('fullscreenchange', checkFullscreen);
            document.removeEventListener('webkitfullscreenchange', checkFullscreen);
            document.removeEventListener('mozfullscreenchange', checkFullscreen);
        };
    }, [elementId, onChange]);
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
