import React from 'react';

/** the value, once it did not change for `delayMs` */
export const useDebouncedValue = <T>(value: T, delayMs: number) => {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => {
        const timeout = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timeout);
    }, [value, delayMs]);
    return debounced;
};
