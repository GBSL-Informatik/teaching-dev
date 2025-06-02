import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { default as AiRequestModel } from '@tdev-models/Ai/AiRequest';
import CodeBlock from '@theme/CodeBlock';

interface Props {
    aiRequest: AiRequestModel;
}

const AiRequest = observer((props: Props) => {
    const { aiRequest } = props;
    return (
        <div className={clsx(styles.AiRequest)}>
            <CodeBlock>{JSON.stringify(aiRequest.response, null, 2)}</CodeBlock>
        </div>
    );
});

export default AiRequest;
