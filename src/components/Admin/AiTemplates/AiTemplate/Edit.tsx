import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { default as AiTemplateModel } from '@tdev-models/Ai/AiTemplate';
import Card from '@tdev-components/shared/Card';
import TextInput from '@tdev-components/shared/TextInput';
import Checkbox from '@tdev-components/shared/Checkbox';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiContentSave } from '@mdi/js';
import CodeEditor from '@tdev-components/shared/CodeEditor';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import DefinitionList from '@tdev-components/DefinitionList';

interface Props {
    template: AiTemplateModel;
    className?: string;
}

const Edit = observer((props: Props) => {
    const { template, className } = props;
    return (
        <DefinitionList>
            <dt>Rate Limit</dt>
            <dd>
                <TextInput
                    value={template.rateLimit.toString()}
                    onChange={(val) => template.update({ rateLimit: Number(val) })}
                    type="number"
                />
            </dd>
            <dt>Rate Limit Period (ms)</dt>
            <dd>
                <TextInput
                    value={template.rateLimitPeriodMs.toString()}
                    onChange={(val) => template.update({ rateLimitPeriodMs: Number(val) })}
                    type="number"
                />
            </dd>
            <dt>Model</dt>
            <dd>
                <TextInput value={template.model} onChange={(val) => template.update({ model: val })} />
            </dd>
            <dt>API Key</dt>
            <dd>
                <TextInput
                    value={template.apiKey}
                    onChange={(val) => template.update({ apiKey: val })}
                    type="text"
                />
            </dd>
            <dt>API URL</dt>
            <dd>
                <TextInput
                    value={template.apiUrl}
                    onChange={(val) => template.update({ apiUrl: val })}
                    type="text"
                />
            </dd>
            <dt>Temperature</dt>
            <dd>
                <TextInput
                    value={template.temperature.toString()}
                    onChange={(val) => template.update({ temperature: Number(val) })}
                    type="number"
                    step={0.05}
                    min={0}
                    max={1}
                />
            </dd>
            <dt>Max Tokens</dt>
            <dd>
                <TextInput
                    value={template.maxTokens.toString()}
                    onChange={(val) => template.update({ maxTokens: Number(val) })}
                    type="number"
                />
            </dd>
            <dt>Top P</dt>
            <dd>
                <TextInput
                    value={template.topP.toString()}
                    onChange={(val) => template.update({ topP: Number(val) })}
                    type="number"
                    step={0.05}
                    min={0}
                    max={1}
                />
            </dd>
            <dt>System Message</dt>
            <dd>
                <TextAreaInput
                    defaultValue={template.systemMessage}
                    onChange={(val) => template.update({ systemMessage: val })}
                    minRows={2}
                />
            </dd>
            <dt>JSON Schema</dt>
            <dd>
                <CodeEditor
                    defaultValue={JSON.stringify(template.jsonSchema, null, 2)}
                    onChange={(val) => {
                        template.update({ jsonSchema: JSON.parse(val) });
                    }}
                    lang="json"
                />
            </dd>
            <dt>Is Active</dt>
            <dd>
                <Checkbox
                    checked={template.isActive}
                    onChange={(val) => template.update({ isActive: val })}
                />
            </dd>
            <dt>Aktionen</dt>
            <dd>
                <div className={clsx(styles.actions)}>
                    {template.isDirty && (
                        <Button
                            text="Speichern"
                            onClick={() => template.save()}
                            icon={mdiContentSave}
                            color="green"
                        />
                    )}
                    <Button
                        text="Abbrechen"
                        onClick={() => template.setEditing(false)}
                        icon={mdiClose}
                        color="black"
                    />
                </div>
            </dd>
        </DefinitionList>
    );
});

export default Edit;
