import React from 'react';
import { observer } from 'mobx-react-lite';
import Script from '@tdev/brython-code/models/Script';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import HtmlEditor from '@tdev-components/documents/CodeEditor/HtmlEditor';
import SvgEditor from '@tdev-components/documents/CodeEditor/SvgEditor';
import NetpbmEditor from '@tdev/netpbm-graphic/NetpbmEditor';

interface Props {
    code: Script;
}

const CodeEditorSelector = observer((props: Props) => {
    const { code } = props;
    switch (code.derivedLang) {
        case 'html':
            return <HtmlEditor id={code.id} />;
        case 'svg':
            return <SvgEditor id={code.id} />;
        case 'pbm':
        case 'pgm':
        case 'ppm':
            return <NetpbmEditor id={code.id} />;
        default:
            return <CodeEditorComponent code={code} />;
    }
});

export default CodeEditorSelector;
