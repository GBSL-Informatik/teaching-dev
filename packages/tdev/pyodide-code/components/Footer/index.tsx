import * as React from 'react';
import { observer } from 'mobx-react-lite';
import Container from '@tdev-components/documents/CodeEditor/Editor/Footer/Container';
import Logs from '@tdev-components/documents/CodeEditor/Editor/Footer/Logs';
import PyodideCode from '@tdev/pyodide-code/models/PyodideCode';
import styles from './styles.module.scss';
import clsx from 'clsx';
import TextInput from '@tdev-components/shared/TextInput';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiSend } from '@mdi/js';

interface Props {
    code: PyodideCode;
}

const Footer = observer((props: Props) => {
    const { code } = props;
    return (
        <Container>
            {code.logs.length > 0 && (
                <Logs
                    messages={code.logs}
                    onClear={() => {
                        code.clearMessages();
                    }}
                />
            )}
            {code.hasPrompt && (
                <div className={clsx(styles.prompt)}>
                    <div className={clsx(styles.inputContainer)}>
                        <TextInput
                            label={code.promptText || 'Eingabe'}
                            onChange={(text) => {
                                code.setPromptResponse(text);
                            }}
                            value={code.promptResponse || ''}
                            onEnter={() => {
                                code.sendPromptResponse();
                            }}
                            className={clsx(styles.input)}
                            labelClassName={clsx(styles.label)}
                        />
                    </div>
                    <div className={clsx(styles.actions)}>
                        <Button
                            onClick={() => {
                                code.sendPromptResponse();
                            }}
                            icon={mdiSend}
                        />
                        <Button
                            icon={mdiClose}
                            onClick={() => {
                                code.pyodideStore.cancelCodeExecution(code.id);
                            }}
                        />
                    </div>
                </div>
            )}
        </Container>
    );
});

export default Footer;
