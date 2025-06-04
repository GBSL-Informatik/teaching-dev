import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { default as AiRequestModel } from '@tdev-models/Ai/AiRequest';
import AiRequest from '.';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import Button from '@tdev-components/shared/Button';
import { mdiChatQuestionOutline } from '@mdi/js';

interface Props {
    aiTemplateId: string;
}

const AiPrompt = observer((props: Props) => {
    const [value, setValue] = React.useState('');
    const aiStore = useStore('aiStore');
    const aiRequests = aiStore.byTemplateId(props.aiTemplateId);
    React.useEffect(() => {
        if (aiRequests.length === 0) {
            aiStore.apiAllRequests(props.aiTemplateId);
        }
    }, [props.aiTemplateId, aiStore]);
    return (
        <div className={clsx(styles.aiRequest)}>
            <TextAreaInput
                placeholder="Gib deine Anfrage hier ein..."
                className={styles.promptInput}
                onChange={(text) => setValue(text)}
                minRows={2}
                label="Eingabe"
            />
            <Button
                text="Prompt!"
                color="blue"
                icon={mdiChatQuestionOutline}
                className={clsx('button--block')}
                onClick={() => {
                    aiStore.createRequest(props.aiTemplateId, value);
                }}
            />
            {aiRequests.map((aiRequest) => (
                <AiRequest key={aiRequest.id} aiRequest={aiRequest as AiRequestModel} />
            ))}
        </div>
    );
});

export default AiPrompt;
