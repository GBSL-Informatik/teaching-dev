import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { ObjectResponse } from '@tdev-models/Ai/AiRequest';
import ResponseType from '../ResponseType';
import Response, { Props as CommonProps } from '..';

interface Props extends CommonProps {
    response: ObjectResponse;
}

const ObjectResponse = observer((props: Props) => {
    const { response } = props;
    if (props.isRoot) {
        return (
            <div className={clsx(shared.response, props.className)}>
                {response.value.map((item, idx) => {
                    return <Response response={item} key={idx} />;
                })}
            </div>
        );
    }

    return (
        <ResponseType {...props} response={response}>
            <div className={clsx(shared.response, props.className)}>
                {response.value.map((item, idx) => {
                    return <Response response={item} key={idx} />;
                })}
            </div>
        </ResponseType>
    );
});

export default ObjectResponse;
