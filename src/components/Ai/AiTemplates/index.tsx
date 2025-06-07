import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import AiTemplate from './AiTemplate';
import Button from '@tdev-components/shared/Button';

interface Props {}

const AiTemplates = observer((props: Props) => {
    const aiStore = useStore('aiStore');

    return (
        <div className={clsx(styles.aiTemplates)}>
            <h2>AI Templates</h2>
            <p>Hier können Sie AI Templates verwalten.</p>
            <Button
                text="Neues Ai Template erstellen"
                onClick={() => {
                    aiStore.createTemplate({
                        model: 'gpt-4.1',
                        apiKey: '',
                        apiUrl: 'https://api.openai.com/v1',
                        rateLimit: 10,
                        rateLimitPeriodMs: 1000 * 60 * 60 * 24 * 30,
                        temperature: 0.7,
                        maxTokens: 2048,
                        topP: 0.85,
                        systemMessage: ''
                    });
                }}
            />
            <div className={styles.templates}>
                {aiStore.aiTemplates.map((template) => (
                    <AiTemplate key={template.id} template={template} className={styles.template} />
                ))}
            </div>
        </div>
    );
});

export default AiTemplates;
