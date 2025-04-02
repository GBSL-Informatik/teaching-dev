import React from 'react';
import Storage from '@tdev-stores/utils/Storage';
import _ from 'lodash';

export const useUnlockHandler = (newNodes, initializeNew = false) => {
    const [value, setValue] = React.useState(Storage.getUnsafe('MINT-A-STAR-NODES', [], true))
    React.useEffect(() => {
        const updated = initializeNew ? newNodes : [...new Set([...value, ...newNodes])];
        setValue(updated);
        Storage.setUnsafe('MINT-A-STAR-NODES', updated, true);
    }, [newNodes, initializeNew]);
    return value;
}

