import { useEffect } from 'react';

export default function useFullscreenChange(
    element: HTMLElement | null,
    onChange: (isFullscreen: boolean) => void
) {
    useEffect(() => {
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
        document.addEventListener('MSFullscreenChange', checkFullscreen);

        return () => {
            document.removeEventListener('fullscreenchange', checkFullscreen);
            document.removeEventListener('webkitfullscreenchange', checkFullscreen);
            document.removeEventListener('mozfullscreenchange', checkFullscreen);
            document.removeEventListener('MSFullscreenChange', checkFullscreen);
        };
    }, [element, onChange]);
}
