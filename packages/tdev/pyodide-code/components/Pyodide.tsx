import { CodeEditor, Props } from '@tdev-components/documents/CodeEditor';
import { observer } from 'mobx-react-lite';

const Pyodide = observer((props: Props) => {
    return <CodeEditor liveCodeType="live_pyo" {...props} />;
});

export default Pyodide;
