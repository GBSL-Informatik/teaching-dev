import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as AiTemplateModel } from '@tdev-models/Ai/AiTemplate';
import TextInput from '@tdev-components/shared/TextInput';
import Checkbox from '@tdev-components/shared/Checkbox';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiContentSave, mdiPlusCircleOutline } from '@mdi/js';
import CodeEditor from '@tdev-components/shared/CodeEditor';
import DefinitionList from '@tdev-components/DefinitionList';
import SchemaEditor from './SchemaEditor';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import JsObjectEditor from '@tdev-components/shared/JsObject/Editor';
import { action } from 'mobx';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

interface Props {
    template: AiTemplateModel;
    className?: string;
}

const Edit = observer((props: Props) => {
    const { template, className } = props;
    console.log('rerender Edit', template.id, template.isDirty);
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

            <dt>Konfiguration</dt>
            <dd>
                <Tabs className={clsx(styles.tabs)} lazy>
                    <TabItem value="schema" label="Editor">
                        <div>
                            <h3>Model Config</h3>
                            <JsObjectEditor
                                js={template.modelConfig}
                                onUpdate={(val) => template.setModelConfig(val)}
                                className={clsx(styles.modelConfig, className)}
                            />

                            <h3>Response Schema</h3>
                            {template.jsonSchema ? (
                                <SchemaEditor
                                    json={template.jsonSchema?.schema}
                                    className={clsx(styles.schemaEditor, className)}
                                    onDelete={() => template.setJsonSchema(null)}
                                    noChangeType
                                />
                            ) : (
                                <Button
                                    text="Schema hinzufügen"
                                    onClick={() =>
                                        template.setJsonSchema({
                                            name: 'Response Schema',
                                            schema: {
                                                type: 'object',
                                                required: [],
                                                additionalProperties: false,
                                                properties: {}
                                            },
                                            strict: false
                                        })
                                    }
                                    icon={mdiPlusCircleOutline}
                                    color="primary"
                                    size={SIZE_S}
                                />
                            )}
                        </div>
                    </TabItem>
                    <TabItem value="code" label="Code">
                        <CodeEditor
                            value={template.stringifiedConfig}
                            onChange={action((val) => {
                                try {
                                    const parsed = JSON.parse(val);
                                    template.setConfig(parsed);
                                } catch (error) {
                                    console.warn('Failed to parse JSON:', error);
                                }
                            })}
                            lang="json"
                            className={clsx(styles.codeEditor, className)}
                        />
                    </TabItem>
                </Tabs>
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
                    <Button
                        text="Speichern"
                        onClick={() => template.save()}
                        icon={mdiContentSave}
                        color="green"
                        disabled={!template.isDirty}
                    />
                    <Button
                        text="Abbrechen"
                        onClick={() => {
                            template.setEditing(false);
                            template.discardChanges();
                        }}
                        icon={mdiClose}
                        color="black"
                    />
                </div>
            </dd>
        </DefinitionList>
    );
});

export default Edit;
