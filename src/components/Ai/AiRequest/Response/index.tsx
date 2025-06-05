import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import AiRequest, { ObjectValue } from '@tdev-models/Ai/AiRequest';
import ArrayResponse from './ArrayResponse';
import ObjectResponse from './ObjectResponse';
import GenericResponse from './GenericResponse';

interface Props {
    response: ObjectValue;
    className?: string;
    isRoot?: boolean;
}

const Response = observer((props: Props) => {
    const { response } = props;
    if (!response) {
        return null;
    }
    switch (response.type) {
        case 'array':
            return <ArrayResponse {...props} response={response} />;
        case 'object':
            return <ObjectResponse {...props} response={response} />;
        default:
            return <GenericResponse {...props} response={response} />;
    }
});

export default Response;
