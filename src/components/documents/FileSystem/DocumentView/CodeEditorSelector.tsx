import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import { HtmlEditorComponent } from '@tdev-components/documents/CodeEditor/HtmlEditor';
import { SvgEditorComponent } from '@tdev-components/documents/CodeEditor/SvgEditor';
import iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';

interface Props {
    code: iCode;
}

const CodeEditorSelector = observer((props: Props) => {
    const { code } = props;
    switch (code.derivedLang) {
        case 'html':
            return <HtmlEditorComponent doc={code} />;
        case 'svg':
            return <SvgEditorComponent doc={code} />;
        default:
            return (
                <>
                    <CodeEditorComponent code={code} />
                    {code.derivedLang}
                </>
            );
    }
});

export default CodeEditorSelector;
