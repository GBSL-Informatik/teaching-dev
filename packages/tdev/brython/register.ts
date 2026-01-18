import { rootStore } from '@tdev-stores/rootStore';
import Header from './components/Header';
import Logs from './components/Logs';
import Meta from './components/Meta';

const register = () => {
    rootStore.componentStore.registerEditorComponent('script', {
        Header: Header,
        Logs: Logs,
        Meta: Meta
    });
};

register();
