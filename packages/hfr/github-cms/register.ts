import { rootStore } from '@tdev-stores/rootStore';
import ViewStore from '@tdev-stores/ViewStores';
import { CmsStore } from './stores/CmsStore';

const createStore = (viewStore: ViewStore) => {
    return new CmsStore(viewStore);
};

const register = () => {
    rootStore.viewStore.registerStore('cmsStore', createStore);
};

register();
