import _ from 'es-toolkit/compat';
import { useState, useEffect } from 'react';

const useIsMobileView = (mobileViewWidth: number = 768) => {
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        const handleResize = _.debounce(() => {
            setIsMobileView(window.innerWidth <= mobileViewWidth);
        }, 50);

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        return () => {
            handleResize.cancel();
            window.removeEventListener('resize', handleResize);
        };
    }, [mobileViewWidth]);
    return isMobileView;
};

export default useIsMobileView;
