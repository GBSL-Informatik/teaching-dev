import { rootStore } from '@tdev-stores/rootStore';
import { CmsStore } from './stores/CmsStore';
import ViewStore from '@tdev-stores/ViewStores';

const createStore = (viewStore: ViewStore) => {
    return new CmsStore(viewStore);
};

const register = () => {
    rootStore.viewStore.registerStore('cmsStore', createStore);
};

register();
