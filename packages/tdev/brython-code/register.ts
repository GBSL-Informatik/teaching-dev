import { mdiLanguagePython } from '@mdi/js';
import { LiveCode } from '@tdev-stores/ComponentStore';
import { rootStore } from '@tdev-stores/rootStore';
import DocumentView from './components/DocumentView';
import Footer from './components/Footer';
import Header from './components/Header';
import Meta from './components/Meta';
import { createModel } from './models/Script';
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
    rootStore.documentStore.registerFileExtension('script', {
        extension: '.py',
        name: 'Python',
        description: 'Webbasiertes Python, inkl. Turtle-Grafik',
        priority: 5,
        icon: mdiLanguagePython,
        iconColor: 'light-dark(#ffba00, #ebff00)',
        defaultData: { code: '' }
    });
    rootStore.componentStore.registerDocumentView('script', DocumentView);
};

register();
