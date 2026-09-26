import { rootStore, storesContext } from '@tdev-stores/rootStore';
import React from 'react';

export const useStore = <T extends keyof typeof rootStore>(store: T): (typeof rootStore)[T] => {
    return React.useContext(storesContext)[store];
};
