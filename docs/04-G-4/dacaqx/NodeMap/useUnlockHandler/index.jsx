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

export const useUnlockEdgesHandler = (newEdges, initializeNew = false) => {
    const [value, setValue] = React.useState(Storage.getUnsafe('MINT-A-STAR-EDGES', [], true))
    React.useEffect(() => {
        const updated = initializeNew ? newEdges : [...new Set([...value, ...newEdges])];
        setValue(updated);
        Storage.setUnsafe('MINT-A-STAR-EDGES', updated, true);
    }, [newEdges, initializeNew]);
    return value;
}

