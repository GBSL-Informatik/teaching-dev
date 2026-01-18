import { rootStore } from '@tdev-stores/rootStore';
import Header from './components/Header';
import Logs from './components/Footer';
import Meta from './components/Meta';
import { createModel, ScriptMeta } from './models/Script';
import { LiveCode } from '@tdev-stores/ComponentStore';

const register = () => {
    rootStore.componentStore.registerEditorComponent('script', {
        Header: Header,
        Footer: Logs,
        Meta: Meta,
        createModelMeta: (props) => new ScriptMeta(props),
        codeBlockMetastringMatcher: (metaLiveCode: LiveCode) => {
            if (metaLiveCode === 'live_py') {
                return 'script';
            }
            return undefined;
        }
    });
    rootStore.documentStore.registerFactory('script', createModel);
};

register();
