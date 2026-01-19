import * as React from 'react';
import RunCode from '@tdev-components/documents/CodeEditor/Actions/RunCode';
import { observer } from 'mobx-react-lite';
import Container from '@tdev-components/documents/CodeEditor/Editor/Header/Container';
import Content from '@tdev-components/documents/CodeEditor/Editor/Header/Content';
import PyodideCode from '@tdev/pyodide-code/models/PyodideCode';
import Button from '@tdev-components/shared/Button';
import { mdiClose } from '@mdi/js';

interface Props {
    code: PyodideCode;
}

const Header = observer((props: Props) => {
    const { code } = props;
    if (!code) {
        return null;
    }
    return (
        <Container code={code} ignoreSlim>
            {!code.meta.slim && <Content code={code} />}
            {code.canExecute && <RunCode code={code} onExecute={() => !code.isExecuting && code.runCode()} />}
            {code.isExecuting && (
                <Button
                    icon={mdiClose}
                    onClick={() => {
                        code.pyodideStore.recreatePyWorker();
                    }}
                />
            )}
        </Container>
    );
});

export default Header;
