import React from 'react';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import { ArrayResponse } from '@tdev-models/Ai/AiRequest';
import ResponseType from '../ResponseType';
import GenericValue from '../GenericResponse/GenericValue';
import ObjectResponse from '../ObjectResponse';
import clsx from 'clsx';

interface Props {
    response: ArrayResponse;
    className?: string;
}

const ArrayResponse = observer((props: Props) => {
    const { response, className } = props;

    return (
        <ResponseType response={response}>
            <div className={clsx(styles.array, className)}>
                {response.value.map((item, idx) => {
                    switch (response.items) {
                        case 'array':
                            return <ArrayResponse key={idx} response={item as unknown as ArrayResponse} />;
                        case 'object':
                            return <ObjectResponse key={idx} response={item as unknown as ObjectResponse} />;
                        default:
                            return (
                                <GenericValue
                                    key={idx}
                                    response={{
                                        type: response.items,
                                        value: item as any
                                    }}
                                />
                            );
                    }
                })}
            </div>
        </ResponseType>
    );
});

export default ArrayResponse;
