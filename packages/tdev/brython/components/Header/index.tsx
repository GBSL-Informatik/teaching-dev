import * as React from 'react';
import RunCode from '@tdev-components/documents/CodeEditor/Actions/RunCode';
import { observer } from 'mobx-react-lite';
import Container from '@tdev-components/documents/CodeEditor/Editor/Header/Container';
import Script from '@tdev/brython/models/Script';
import Content from '@tdev-components/documents/CodeEditor/Editor/Header/Content';

interface Props {
    script: Script;
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
        </Container>
    );
});

export default Header;
