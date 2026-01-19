import * as React from 'react';
import CodeBlock from '@theme-original/CodeBlock';
import { observer } from 'mobx-react-lite';
import type Script from '@tdev/brython-code/models/Script';
import Container from '@tdev-components/documents/CodeEditor/Editor/Footer/Container';

interface Props {
    script: Script;
}

const Logs = observer((props: Props) => {
    const { script } = props;
    const logs = script.logs;
    if (logs.length === 0) {
        return null;
    }
    const errors: string[] = [];
    let lineNr = 1;
    const code = logs.slice().map((msg) => {
        const msgLen = (msg.output || '').split('\n').length - 1;
        if (msg.type === 'stderr') {
            errors.push(`${lineNr}-${lineNr + msgLen}`);
        }
        lineNr += msgLen;
        return msg.output;
    });
    return (
        <Container>
            <CodeBlock metastring={`{${errors.join(',')}}`}>{code.join('')}</CodeBlock>
        </Container>
    );
});

export default Logs;
