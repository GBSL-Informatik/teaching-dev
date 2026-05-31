import { DocumentModelType } from '@tdev-api/document';
import React from 'react';

type ScrollDoc = DocumentModelType & {
    scrollTo?: boolean;
    setScrollTo: (scrollTo: boolean) => void;
};
export const useScrollTo = <T extends HTMLElement = HTMLDivElement>(doc?: ScrollDoc | null) => {
    const ref = React.useRef<T>(null);
    const [animate, setAnimate] = React.useState(false);
    React.useEffect(() => {
        if (ref.current && doc?.scrollTo) {
            ref.current.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'start' });
            doc.setScrollTo(false);
            setAnimate(true);
        }
    }, [doc, doc?.scrollTo]);

    React.useEffect(() => {
        if (animate) {
            const timeout = setTimeout(() => {
                setAnimate(false);
            }, 2000);
            return () => {
                clearTimeout(timeout);
            };
        }
    }, [animate]);
    return [ref, animate] as const;
};
