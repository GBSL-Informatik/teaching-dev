import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Script from '@tdev-models/documents/Script';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import HtmlEditor from '@tdev-components/documents/CodeEditor/HtmlEditor';
import SvgEditor from '@tdev-components/documents/CodeEditor/SvgEditor';
import NetpbmEditor from '@tdev-components/documents/NetpbmEditor';

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
