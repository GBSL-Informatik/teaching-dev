import * as React from 'react';
import RunCode from '@tdev-components/documents/CodeEditor/Actions/RunCode';
import { observer } from 'mobx-react-lite';
import Container from '@tdev-components/documents/CodeEditor/Editor/Header/Container';
import Script, { IsBrythonPluginRegistered } from '@tdev/brython-code/models/Script';
import Content from '@tdev-components/documents/CodeEditor/Editor/Header/Content';
import PluginNotRegistered from './PluginNotRegisteredAlert';

interface Props {
    code: Script;
    onRequestFullscreen?: () => void;
}

const Header = observer((props: Props) => {
    const { code, onRequestFullscreen } = props;
    if (!code) {
        return null;
    }
    if (!IsBrythonPluginRegistered) {
        return <PluginNotRegistered />;
    }
    return (
        <Container code={code} ignoreSlim onRequestFullscreen={onRequestFullscreen}>
            {!code.meta.slim && <Content code={code} />}
            {code.canExecute && <RunCode code={code} onExecute={() => code.runCode()} />}
        </Container>
    );
});

export default Header;
