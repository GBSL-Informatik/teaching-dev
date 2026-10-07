import { CodeType } from '@tdev-api/document';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import { HtmlEditorComponent } from '@tdev-components/documents/CodeEditor/HtmlEditor';
import { SvgEditorComponent } from '@tdev-components/documents/CodeEditor/SvgEditor';
import iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const CodeEditorSelector = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    switch (code.derivedLang) {
        case 'html':
            return <HtmlEditorComponent doc={code} />;
        case 'svg':
            return <SvgEditorComponent doc={code} />;
        default:
            return <CodeEditorComponent code={code} overrides={{ maxLines: 40 }} />;
    }
});

export default CodeEditorSelector;
