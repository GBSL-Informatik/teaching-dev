import { CodeEditor, Props as CodeEditorProps } from '@tdev-components/documents/CodeEditor';
import { observer } from 'mobx-react-lite';

interface Props extends CodeEditorProps {
    packages?: readonly string[];
}

const Pyodide = observer((props: Props) => {
    return <CodeEditor liveCodeType="live_pyo" {...props} />;
});

export default Pyodide;
