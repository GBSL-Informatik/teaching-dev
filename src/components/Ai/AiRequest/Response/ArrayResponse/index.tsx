import React from 'react';
import { observer } from 'mobx-react-lite';
import { ArrayResponse, GenericValue as GenericValueType } from '@tdev-models/Ai/AiRequest';
import ResponseType from '../ResponseType';
import GenericValue from '../GenericResponse/GenericValue';
import ObjectResponse from '../ObjectResponse';

interface Props {
    response: ArrayResponse;
    className?: string;
}

const ArrayResponse = observer((props: Props) => {
    const { response, className } = props;

    return (
        <ResponseType response={response}>
            <div>
                {response.value.map((item, idx) => {
                    switch (response.items) {
                        case 'array':
                            return <ArrayResponse key={idx} response={item as unknown as ArrayResponse} />;
                        case 'object':
                            return <ObjectResponse key={idx} response={item as unknown as ObjectResponse} />;
                        default:
                            return <GenericValue key={idx} response={item as unknown as GenericValueType} />;
                    }
                })}
            </div>
        </ResponseType>
    );
});

export default ArrayResponse;
