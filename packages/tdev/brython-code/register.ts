import { mdiLanguagePython } from '@mdi/js';
import { MetaInit } from '@tdev-models/documents/iCode/iCodeMeta';
import { LiveCode } from '@tdev-stores/ComponentStore';
import { rootStore } from '@tdev-stores/rootStore';
import DocumentView from './components/DocumentView';
import Footer from './components/Footer';
import Header from './components/Header';
import Meta from './components/Meta';
import { createModel } from './models/Script';
import { ScriptMeta } from './models/ScriptMeta';

const createModelMeta = (props: Partial<MetaInit>) => new ScriptMeta(props);

const register = () => {
    rootStore.componentStore.registerEditorComponent('script', {
        Header: Header,
        Footer: Footer,
        Meta: Meta,
        createModelMeta: createModelMeta,
        codeBlockMetastringMatcher: (metaLiveCode: LiveCode) => {
            if (metaLiveCode === 'live_py') {
                return 'script';
            }
            return undefined;
        }
    });
    rootStore.documentStore.registerDocumentType({
        type: 'script',
        factory: createModel,
        defaultMeta: createModelMeta({}),
        preferredInRoot: true,
        fileExtensions: [
            {
                extension: '.py',
                name: 'Python (Brython)',
                description: 'Webbasiertes Python, inkl. Turtle-Grafik',
                priority: 5,
                icon: mdiLanguagePython,
                iconColor: 'light-dark(#ffba00, #ebff00)',
                defaultData: { code: '' }
            }
        ]
    });
    rootStore.componentStore.registerDocumentView('script', DocumentView);
};

register();
