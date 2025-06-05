import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { default as AiTemplateModel } from '@tdev-models/Ai/AiTemplate';
import Card from '@tdev-components/shared/Card';
import Button from '@tdev-components/shared/Button';
import DefinitionList from '@tdev-components/DefinitionList';
import { formatDateTime } from '@tdev-models/helpers/date';
import CodeBlock from '@theme/CodeBlock';
import Edit from './Edit';
import { mdiFileEdit, mdiTrashCan } from '@mdi/js';
import AiPrompt from '@tdev-components/Ai/AiRequest/Prompt';
import { SIZE_M } from '@tdev-components/shared/iconSizes';
import { Confirm } from '@tdev-components/shared/Button/Confirm';

interface Props {
    template: AiTemplateModel;
    className?: string;
}

const AiTemplate = observer((props: Props) => {
    const aiStore = useStore('aiStore');
    const { template, className } = props;
    return (
        <Card classNames={{ card: clsx(styles.aiTemplate, className) }}>
            {template.isEditing ? (
                <Edit template={template} className={styles.edit} />
            ) : (
                <>
                    <DefinitionList className={clsx(styles.definitionList)}>
                        <dt>ID</dt>
                        <dd>{template.id}</dd>
                        <dt>Model</dt>
                        <dd>{template.model}</dd>
                        <dt>API Key</dt>
                        <dd>{template.apiKey}</dd>
                        <dt>API URL</dt>
                        <dd>{template.apiUrl}</dd>
                        <dt>Rate Limit</dt>
                        <dd>
                            {template.rateLimit} requests per {template.rateLimitPeriodMs} ms
                        </dd>
                        <dt>Temperature</dt>
                        <dd>{template.temperature}</dd>
                        <dt>Max Tokens</dt>
                        <dd>{template.maxTokens}</dd>
                        <dt>Top P</dt>
                        <dd>{template.topP}</dd>
                        <dt>Created At</dt>
                        <dd>{formatDateTime(template.createdAt)}</dd>
                        <dt>Updated At</dt>
                        <dd>{formatDateTime(template.updatedAt)}</dd>
                        <dt>System Message</dt>
                        <dd>{template.systemMessage}</dd>
                        <dt>JSON Schema</dt>
                        <dd className={clsx(styles.displayBlock, styles.jsonSchema)}>
                            {template.jsonSchema && (
                                <CodeBlock language="json" showLineNumbers title="JSON Schema">
                                    {template.stringifiedJsonSchema}
                                </CodeBlock>
                            )}
                        </dd>
                        <dt>Aktionen</dt>
                        <dd>
                            <div className={clsx(styles.actions)}>
                                <Button
                                    icon={mdiFileEdit}
                                    color="blue"
                                    onClick={() => template.setEditing(true)}
                                    text="Bearbeiten"
                                    iconSide="left"
                                    size={SIZE_M}
                                />
                                <Confirm
                                    onConfirm={() => aiStore.deleteTemplate(template)}
                                    text="Löschen"
                                    color="red"
                                    icon={mdiTrashCan}
                                    size={SIZE_M}
                                />
                            </div>
                        </dd>
                        <dt>Prompts</dt>
                        <dd className={clsx(styles.displayBlock)}>
                            <AiPrompt aiTemplateId={template.id} />
                        </dd>
                    </DefinitionList>
                </>
            )}
        </Card>
    );
});

export default AiTemplate;
