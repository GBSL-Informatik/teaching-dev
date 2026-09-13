import RunCode from '@tdev-components/documents/CodeEditor/Actions/RunCode';
import Container from '@tdev-components/documents/CodeEditor/Editor/Header/Container';
import Content from '@tdev-components/documents/CodeEditor/Editor/Header/Content';
import Script, { IsBrythonPluginRegistered } from '@tdev/brython-code/models/Script';
import { observer } from 'mobx-react-lite';
import PluginNotRegistered from './PluginNotRegisteredAlert';

interface Props {
    code: Script;
}

const Header = observer((props: Props) => {
    const { code } = props;
    if (!code) {
        return null;
    }
    if (!IsBrythonPluginRegistered) {
        return <PluginNotRegistered />;
    }
    return (
        <Container code={code} ignoreSlim>
            {!code.meta.slim && <Content code={code} />}
            {code.canExecute && <RunCode code={code} onExecute={() => code.runCode()} />}
        </Container>
    );
});

export default Header;
