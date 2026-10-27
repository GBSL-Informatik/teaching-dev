import { mdiClose, mdiRestart } from '@mdi/js';
import RunCode from '@tdev-components/documents/CodeEditor/Actions/RunCode';
import Container from '@tdev-components/documents/CodeEditor/Editor/Header/Container';
import Content from '@tdev-components/documents/CodeEditor/Editor/Header/Content';
import Button from '@tdev-components/shared/Button';
import PyodideCode from '@tdev/pyodide-code/models/PyodideCode';
import { observer } from 'mobx-react-lite';

interface Props {
    code: PyodideCode;
}

const Header = observer((props: Props) => {
    const { code } = props;
    if (!code) {
        return null;
    }
    const handleRun = () => !code.isExecuting && code.runCode();
    const handleStop = () => code.stopExecution();
    const handleRecreate = () => code.recreateRuntime();
    return (
        <Container code={code} ignoreSlim>
            {!code.meta.slim && <Content code={code} />}
            {code.canExecute && <RunCode code={code} onExecute={handleRun} />}
            {code.isExecuting && !code.isCancelling && (
                <Button icon={mdiClose} title="Ausführung abbrechen" onClick={handleStop} />
            )}
            {code.canRecreateRuntime && (
                <Button
                    icon={mdiRestart}
                    text="Python neu starten"
                    title="Ausführung beenden und Python neu laden. Geladene Pakete müssen erneut geladen werden."
                    onClick={handleRecreate}
                />
            )}
        </Container>
    );
});

export default Header;
