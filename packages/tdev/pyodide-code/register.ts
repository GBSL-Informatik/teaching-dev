import { LiveCode } from '@tdev-stores/ComponentStore';
import { rootStore } from '@tdev-stores/rootStore';
import ViewStore from '@tdev-stores/ViewStores';
import Footer from './components/Footer';
import Header from './components/Header';
import { ModelMeta } from './models/ModelMeta';
import { createModel } from './models/PyodideCode';
import PyodideStore from './stores/PyodideStore';

const createStore = (viewStore: ViewStore) => {
    return new PyodideStore(viewStore);
};

const register = () => {
    rootStore.viewStore.registerStore('pyodideStore', createStore);
    rootStore.documentStore.registerFactory('pyodide_code', createModel);
    rootStore.componentStore.registerEditorComponent('pyodide_code', {
        Header: Header,
        Footer: Footer,
        createModelMeta: (props) => new ModelMeta(props),
        codeBlockMetastringMatcher: (metaLiveCode: LiveCode) => {
            if (metaLiveCode === 'live_pyo') {
                return 'pyodide_code';
            }
            return undefined;
        }
    });
};

register();
