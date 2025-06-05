import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as AiRequestModel } from '@tdev-models/Ai/AiRequest';
import Card from '@tdev-components/shared/Card';
import Loader from '@tdev-components/Loader';
import { formatDateTime } from '@tdev-models/helpers/date';
import Response from './Response';
import WithTranslations, { Translation } from '@tdev-components/shared/WithTranslations';

interface Props {
    aiRequest: AiRequestModel;
    translations?: Translation;
}

const AiRequest = observer((props: Props) => {
    const { aiRequest } = props;
    return (
        <Card
            header={
                <>
                    <h4>{formatDateTime(aiRequest.createdAt)}</h4>
                    <small>{aiRequest.user?.nameShort}</small>
                    <small className={clsx(styles.requestInfo)}>
                        <pre className={clsx(styles.request)}>{aiRequest.request}</pre>
                    </small>
                </>
            }
            classNames={{ body: clsx(styles.response) }}
        >
            {aiRequest.status === 'pending' ? (
                <Loader label="Antwort generieren..." />
            ) : (
                <>
                    {aiRequest.response && (
                        <WithTranslations translations={props.translations}>
                            <Response response={aiRequest.response} isRoot />
                        </WithTranslations>
                    )}
                </>
            )}
        </Card>
    );
});

export default AiRequest;
