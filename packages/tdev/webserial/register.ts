import { rootStore } from '@tdev-stores/rootStore';
import ViewStore from '@tdev-stores/ViewStores';
import WebserialStore from './stores/WebserialStore';

const createStore = (viewStore: ViewStore) => {
    return new WebserialStore(viewStore);
};

const register = () => {
    rootStore.viewStore.registerStore('webserialStore', createStore);
};

register();
