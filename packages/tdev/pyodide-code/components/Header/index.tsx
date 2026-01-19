import * as React from 'react';
import RunCode from '@tdev-components/documents/CodeEditor/Actions/RunCode';
import { observer } from 'mobx-react-lite';
import Container from '@tdev-components/documents/CodeEditor/Editor/Header/Container';
import Content from '@tdev-components/documents/CodeEditor/Editor/Header/Content';
import PyodideCode from '@tdev/pyodide-code/models/PyodideCode';
import Button from '@tdev-components/shared/Button';
import { mdiClose } from '@mdi/js';

interface Props {
    script: PyodideCode;
}

const Header = observer((props: Props) => {
    const { script } = props;
    if (!script) {
        return null;
    }
    return (
        <Container script={script} ignoreSlim>
            {!script.meta.slim && <Content script={script} />}
            {script.canExecute && <RunCode script={script} onExecute={() => script.execScript()} />}
            {script.isExecuting && (
                <Button
                    icon={mdiClose}
                    onClick={() => {
                        script.pyodideStore.recreatePyWorker();
                    }}
                />
            )}
        </Container>
    );
});

export default Header;
