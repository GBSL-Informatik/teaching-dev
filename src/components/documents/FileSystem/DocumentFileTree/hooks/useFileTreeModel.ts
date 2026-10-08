import { FileTree } from '@pierre/trees';
import React from 'react';
import { FileTreeContext } from '../FileTreeComponent/WithFileTreeModel';
export const useFileTreeModel = (): FileTree => {
    const context = React.useContext(FileTreeContext);
    if (!context) {
        throw new Error('useFileTreeModel must be used within a FileTreeContext.Provider');
    }
    return context;
};
