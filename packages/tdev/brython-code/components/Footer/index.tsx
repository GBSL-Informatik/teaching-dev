import Container from '@tdev-components/documents/CodeEditor/Editor/Footer/Container';
import Logs from '@tdev-components/documents/CodeEditor/Editor/Footer/Logs';
import type Script from '@tdev/brython-code/models/Script';
import { observer } from 'mobx-react-lite';

interface Props {
    code: Script;
}

const Footer = observer((props: Props) => {
    const { code } = props;
    return (
        <Container>
            {code.messages.length > 0 && (
                <Logs
                    messages={code.logs}
                    onClear={() => {
                        code.clearMessages();
                    }}
                />
            )}
        </Container>
    );
});

export default Footer;
