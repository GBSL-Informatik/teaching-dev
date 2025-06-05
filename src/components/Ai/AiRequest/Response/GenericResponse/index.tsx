import React from 'react';
import { observer } from 'mobx-react-lite';
import { GenericValue as GenericValueType } from '@tdev-models/Ai/AiRequest';
import ResponseType from '../ResponseType';
import GenericValue from './GenericValue';

export interface Props {
    response: GenericValueType;
    className?: string;
}

const GenericResponse = observer((props: Props) => {
    const { response } = props;

    return (
        <ResponseType response={response}>
            <GenericValue {...props} response={response} />
        </ResponseType>
    );
});

export default GenericResponse;
