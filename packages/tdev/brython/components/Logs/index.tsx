import * as React from 'react';
import styles from './styles.module.scss';
import CodeBlock from '@theme-original/CodeBlock';
import { observer } from 'mobx-react-lite';
import type Script from '@tdev-models/documents/Script';

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
        <div className={styles.result}>
            <CodeBlock metastring={`{${errors.join(',')}}`}>{code.join('')}</CodeBlock>
        </div>
    );
});

export default Logs;
