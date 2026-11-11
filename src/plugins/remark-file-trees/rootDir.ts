import type { DirType } from '../../components/FileSystem/Dir';

/** a single item of the tree list is the root directory, several items are put into `/` */
export const rootDir = (children: DirType['children']): DirType => {
    if (children.length !== 1) {
        return { name: '/', children };
    }
    const [first] = children;
    return typeof first === 'string' ? { name: first, children: [] } : first;
};
