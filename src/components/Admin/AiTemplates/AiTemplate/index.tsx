import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { default as AiTemplateModel } from '@tdev-models/Ai/AiTemplate';
import Card from '@tdev-components/shared/Card';
import Button from '@tdev-components/shared/Button';
import DefinitionList from '@tdev-components/DefinitionList';
import { formatDate, formatDateTime } from '@tdev-models/helpers/date';
import CodeBlock from '@theme/CodeBlock';
import Edit from './Edit';
import { mdiTrashCan } from '@mdi/js';

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
                    <dd className={clsx(styles.jsonSchema)}>
                        {template.jsonSchema && (
                            <CodeBlock language="json" showLineNumbers title="JSON Schema">
                                {JSON.stringify(template.jsonSchema, null, 2)}
                            </CodeBlock>
                        )}
                    </dd>
                    <dt>Aktionen</dt>
                    <dd>
                        <Button onClick={() => template.setEditing(true)} text="Bearbeiten" />
                        <Button
                            onClick={() => aiStore.deleteTemplate(template)}
                            text="Löschen"
                            color="red"
                            icon={mdiTrashCan}
                        />
                    </dd>
                </DefinitionList>
            )}
        </Card>
    );
});

export default AiTemplate;
