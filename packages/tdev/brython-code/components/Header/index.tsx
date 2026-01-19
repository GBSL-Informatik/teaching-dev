import * as React from 'react';
import RunCode from '@tdev-components/documents/CodeEditor/Actions/RunCode';
import { observer } from 'mobx-react-lite';
import Container from '@tdev-components/documents/CodeEditor/Editor/Header/Container';
import Script from '@tdev/brython-code/models/Script';
import Content from '@tdev-components/documents/CodeEditor/Editor/Header/Content';

interface Props {
    code: Script;
}

const Header = observer((props: Props) => {
    const { code: code } = props;
    if (!code) {
        return null;
    }
    return (
        <Container code={code} ignoreSlim>
            {!code.meta.slim && <Content code={code} />}
            {code.canExecute && <RunCode code={code} onExecute={() => code.runCode()} />}
        </Container>
    );
});

export default Header;
