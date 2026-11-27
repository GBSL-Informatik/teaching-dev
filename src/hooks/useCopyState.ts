import React from 'react';

export type CopyState = 'none' | 'spin' | 'copied' | 'error';

/**
 * Feedback for a copy action: spins while copying, then shows the result for a while.
 */
export const useCopyState = (resultDurationMs: number = 2000) => {
    const [copyState, setCopyState] = React.useState<CopyState>('none');

    React.useEffect(() => {
        if (copyState === 'none' || copyState === 'spin') {
            return;
        }
        const timeoutId = setTimeout(() => setCopyState('none'), resultDurationMs);
        return () => clearTimeout(timeoutId);
    }, [copyState, resultDurationMs]);

    const copy = React.useCallback((copyAction: () => Promise<unknown>) => {
        setCopyState('spin');
        copyAction()
            .then(() => setCopyState('copied'))
            .catch((error) => {
                console.error('Copying failed', error);
                setCopyState('error');
            });
    }, []);

    return { copyState, copy };
};
