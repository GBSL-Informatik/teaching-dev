import React from 'react';
import { observer } from 'mobx-react-lite';
import Script from '@tdev-models/documents/Script';
import CodeEditorComponent from '@tdev/script/components/CodeEditor';
import HtmlEditor from '@tdev/script/components/HtmlEditor';
import SvgEditor from '@tdev/script/components/SvgEditor';
import NetpbmEditor from '@tdev/netpbm-graphic/NetpbmEditor';

interface Props {
    script: Script;
}

const CodeEditorSelector = observer((props: Props) => {
    const { script } = props;
    switch (script.derivedLang) {
        case 'html':
            return <HtmlEditor id={script.id} />;
        case 'svg':
            return <SvgEditor id={script.id} />;
        case 'pbm':
        case 'pgm':
        case 'ppm':
            return <NetpbmEditor id={script.id} />;
        default:
            return <CodeEditorComponent script={script} />;
    }
});

export default CodeEditorSelector;
