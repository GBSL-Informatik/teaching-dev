import React from 'react';
import { observer } from 'mobx-react-lite';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import HtmlEditor from '@tdev-components/documents/CodeEditor/HtmlEditor';
import SvgEditor from '@tdev-components/documents/CodeEditor/SvgEditor';
import iCode from '@tdev-models/documents/iCode';

interface Props {
    code: iCode;
}

const CodeEditorSelector = observer((props: Props) => {
    const { code } = props;
    switch (code.derivedLang) {
        case 'html':
            return <HtmlEditor id={code.id} />;
        case 'svg':
            return <SvgEditor id={code.id} />;
        default:
            return <CodeEditorComponent code={code} />;
    }
});

export default CodeEditorSelector;
