import * as React from 'react';
import CodeBlock from '@theme-original/CodeBlock';
import { observer } from 'mobx-react-lite';
import Container from '@tdev-components/documents/CodeEditor/Editor/Footer/Container';
import PyodideCode from '@tdev/pyodide-code/models/PyodideCode';
import styles from './styles.module.scss';
import clsx from 'clsx';
import TextInput from '@tdev-components/shared/TextInput';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiSend } from '@mdi/js';

interface Props {
    script: PyodideCode;
}

const Logs = observer((props: Props) => {
    const { script } = props;
    return (
        <Container>
            {script.logs.length > 0 && (
                <CodeBlock
                    language="plaintext"
                    className={clsx(styles.logContainer)}
                    metastring={`{${script.logErrorIndices.map((range) => range.join('-')).join(',')}}`}
                >
                    {script.logs.map((log, idx) => `${log.timeStamp}: ${log.message}`).join('\n')}
                </CodeBlock>
            )}
            {script.hasPrompt && (
                <div className={clsx(styles.prompt)}>
                    <div className={clsx(styles.inputContainer)}>
                        <TextInput
                            label={script.promptText || 'Eingabe'}
                            onChange={(text) => {
                                script.setPromptResponse(text);
                            }}
                            value={script.promptResponse || ''}
                            onEnter={() => {
                                script.sendPromptResponse();
                            }}
                            className={clsx(styles.input)}
                            labelClassName={clsx(styles.label)}
                        />
                    </div>
                    <div className={clsx(styles.actions)}>
                        <Button
                            onClick={() => {
                                script.sendPromptResponse();
                            }}
                            icon={mdiSend}
                        />
                        <Button
                            icon={mdiClose}
                            onClick={() => {
                                script.pyodideStore.cancelCodeExecution(script.id);
                            }}
                        />
                    </div>
                </div>
            )}
        </Container>
    );
});

export default Logs;
