import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import CodeBlock from '@theme-original/CodeBlock';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { useStore } from '@tdev-hooks/useStore';
import { ModelMeta } from '../models/ModelMeta';
import CodeEditor from '@tdev-components/shared/CodeEditor';
import { Source } from '@tdev-models/iDocument';
import Card from '@tdev-components/shared/Card';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiLoading, mdiPlay, mdiSend } from '@mdi/js';
import TextInput from '@tdev-components/shared/TextInput';
import PyodideScript from '../models';
import { action } from 'mobx';

export interface Props {
    code?: string;
    id?: string;
    readonly?: boolean;
    title?: string;
}

const Head = observer((props: { title?: string; code: PyodideScript }) => {
    const { code } = props;
    const viewStore = useStore('viewStore');
    const pyodideStore = viewStore.useStore('pyodideStore');
    return (
        <div className={clsx(styles.header)}>
            <h3 className={clsx(styles.title)}>{props.title ?? 'Python'}</h3>
            <div className={clsx(styles.actions)}>
                <Button
                    icon={code.isExecuting ? mdiLoading : mdiPlay}
                    spin={code.isExecuting}
                    color="green"
                    onClick={(e) => {
                        pyodideStore.run(code);
                    }}
                />
                {code.isExecuting && (
                    <Button
                        icon={mdiClose}
                        onClick={() => {
                            code.pyodideStore.recreatePyWorker();
                        }}
                    />
                )}
            </div>
        </div>
    );
});

const Pyodide = observer((props: Props) => {
    const id = props.id;
    const userStore = useStore('userStore');
    const viewStore = useStore('viewStore');
    const pyodideStore = viewStore.useStore('pyodideStore');
    console.log(props);
    const meta = React.useMemo(
        () =>
            new ModelMeta({
                code: props.code || '',
                readonly: props.readonly || false
            }),
        [props.code, props.readonly]
    );
    const doc = useFirstMainDocument(id, meta);
    const isBrowser = useIsBrowser();
    if (!isBrowser || !doc) {
        return <CodeBlock language="py">{props.code}</CodeBlock>;
    }
    if (!doc.canDisplay && props.id && !userStore.isUserSwitched) {
        return (
            <div>
                <PermissionsPanel documentRootId={props.id} />
            </div>
        );
    }

    return (
        <div className={clsx(styles.pyodide)}>
            <Card header={<Head title={props.title} code={doc} />}>
                <div className={clsx(styles.editor)}>
                    {doc.isInitialized && (
                        <CodeEditor
                            value={doc.code}
                            lang="python"
                            readonly={!doc.canEdit}
                            focus={false}
                            onChange={(value) => {
                                if (!value) {
                                    return;
                                }
                                try {
                                    doc.setData({ code: value }, Source.LOCAL, new Date());
                                } catch (e) {
                                    console.error(e);
                                }
                            }}
                            onInit={(node) => {
                                node.editor.commands.addCommand({
                                    // commands is array of key bindings.
                                    name: 'execute',
                                    bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
                                    exec: action(() => pyodideStore.run(doc))
                                });
                                node.editor.commands.addCommand({
                                    // commands is array of key bindings.
                                    name: 'save',
                                    bindKey: { win: 'Ctrl-s', mac: 'Command-s' },
                                    exec: () => {
                                        doc.saveNow();
                                    }
                                });
                                return () => {
                                    if (node && node.editor) {
                                        const cmd = node.editor.commands.commands['execute'];
                                        if (cmd) {
                                            node.editor.commands.removeCommand(cmd, true);
                                        }
                                        const save = node.editor.commands.commands['save'];
                                        if (save) {
                                            node.editor.commands.removeCommand(save, true);
                                        }
                                    }
                                };
                            }}
                        />
                    )}
                </div>
                <div>
                    {doc.logs.length > 0 && (
                        <CodeBlock language="plaintext">
                            {doc.logs
                                .filter((l) => l.type !== 'clock')
                                .map((log, index) => `${log.message}\n`)
                                .join('')}
                        </CodeBlock>
                    )}
                </div>
                {doc.hasPrompt && (
                    <div className={clsx(styles.prompt)}>
                        <div className={clsx(styles.inputContainer)}>
                            <TextInput
                                label={doc.promptText || 'Eingabe'}
                                onChange={(text) => {
                                    doc.setPromptResponse(text);
                                }}
                                value={doc.promptResponse || ''}
                                onEnter={() => {
                                    doc.sendPromptResponse();
                                }}
                                className={clsx(styles.input)}
                                labelClassName={clsx(styles.label)}
                            />
                        </div>
                        <div className={clsx(styles.actions)}>
                            <Button
                                onClick={() => {
                                    doc.sendPromptResponse();
                                }}
                                icon={mdiSend}
                            />
                            <Button
                                icon={mdiClose}
                                onClick={() => {
                                    doc.pyodideStore.cancelCodeExecution(doc.id);
                                }}
                            />
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
});

export default Pyodide;
