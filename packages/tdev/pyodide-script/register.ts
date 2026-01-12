import { rootStore } from '@tdev-stores/rootStore';
import PyodideStore from './stores/PyodideStore';
import ViewStore from '@tdev-stores/ViewStores';
import { createModel } from './models';

const createStore = (viewStore: ViewStore) => {
    return new PyodideStore(viewStore);
};

const register = () => {
    rootStore.viewStore.registerStore('pyodideStore', createStore);
    rootStore.documentStore.registerFactory('pyodide_script', createModel);
};

register();
