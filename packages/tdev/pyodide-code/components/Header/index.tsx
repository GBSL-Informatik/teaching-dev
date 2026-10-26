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
    const handleResetRuntime = () => {
        code.resetRuntime();
    };
    return (
        <Container code={code} ignoreSlim>
            {!code.meta.slim && <Content code={code} />}
            {code.canExecute && <RunCode code={code} onExecute={() => !code.isExecuting && code.runCode()} />}
            {code.canExecute && (
                <Button
                    icon={mdiRestart}
                    title="Lokales Python zurücksetzen: nächster Start mit neuer Umgebung"
                    onClick={handleResetRuntime}
                />
            )}
            {code.isExecuting && (
                <Button
                    icon={mdiClose}
                    onClick={() => {
                        code.stopExecution();
                    }}
                />
            )}
        </Container>
    );
});

export default Header;
