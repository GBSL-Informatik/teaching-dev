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
import Edit from './Edit';
import { mdiFileEdit, mdiTrashCan } from '@mdi/js';
import AiPrompt from '@tdev-components/Ai/AiRequest/Prompt';
import { SIZE_M } from '@tdev-components/shared/iconSizes';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import JsObjectViewer from '@tdev-components/shared/JsObject/Viewer';

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
                        <dt>API Key</dt>
                        <dd>{template.apiKey}</dd>
                        <dt>API URL</dt>
                        <dd>{template.apiUrl}</dd>
                        <dt>Rate Limit</dt>
                        <dd>
                            {template.rateLimit} requests per {template.rateLimitPeriodMs} ms
                        </dd>
                        <dt>Model Config</dt>
                        <dd>
                            <JsObjectViewer
                                js={template.config}
                                className={clsx(styles.displayBlock, styles.modelConfig)}
                            />
                        </dd>
                        <dt>Created At</dt>
                        <dd>{formatDateTime(template.createdAt)}</dd>
                        <dt>Updated At</dt>
                        <dd>{formatDateTime(template.updatedAt)}</dd>
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
