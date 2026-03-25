import { rootStore } from '@tdev-stores/rootStore';
import WebserialStore from './stores/WebserialStore';
import ViewStore from '@tdev-stores/ViewStores';

const createStore = (viewStore: ViewStore) => {
    return new WebserialStore(viewStore);
};

const register = () => {
    rootStore.viewStore.registerStore('webserialStore', createStore);
};

register();
