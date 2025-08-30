import Storage, { StorageKey } from '@tdev-stores/utils/Storage';
import _ from 'es-toolkit/compat';
import React from 'react';

const useLocalStorage = <T = string>(
    key: keyof typeof StorageKey,
    defaultValue?: T,
    syncTabs: boolean = false,
    useJson: boolean = true
) => {
    const initialValue = React.useRef(Storage.get(key, defaultValue, useJson));
    const [value, setValue] = React.useState<T | undefined>(initialValue.current);
    const update = React.useCallback(
        (newValue: T) => {
            if (newValue === value) {
                return;
            }
            Storage.set(key, newValue, useJson);
            setValue(newValue);
        },
        [key]
    );
    React.useEffect(() => {
        if (!syncTabs) {
            return;
        }
        const handleStorage = _.debounce(() => {
            setValue(Storage.get(key, defaultValue, useJson));
        }, 50);
        window.addEventListener('storage', handleStorage);
        return () => {
            handleStorage.cancel();
            window.removeEventListener('storage', handleStorage);
        };
    }, [key, defaultValue]);
    return [value, update, initialValue.current] as const;
};

export default useLocalStorage;
