import { useStore } from '@tdev-hooks/useStore';

export const useCmsStore = () => {
    const viewStore = useStore('viewStore');
    const cmsStore = viewStore.useStore('cmsStore');
    return cmsStore;
};
