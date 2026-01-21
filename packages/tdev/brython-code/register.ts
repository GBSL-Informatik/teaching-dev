import { rootStore } from '@tdev-stores/rootStore';
import Header from './components/Header';
import Footer from './components/Footer';
import Meta from './components/Meta';
import { createModel } from './models/Script';
import { LiveCode } from '@tdev-stores/ComponentStore';
import { ScriptMeta } from './models/ScriptMeta';

const register = () => {
    rootStore.componentStore.registerEditorComponent('script', {
        Header: Header,
        Footer: Footer,
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
