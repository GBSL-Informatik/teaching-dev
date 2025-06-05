import React from 'react';
import clsx from 'clsx';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { ObjectValue } from '@tdev-models/Ai/AiRequest';
import { useTranslation } from '@tdev-hooks/useTranslation';

interface Props {
    response: ObjectValue;
    className?: string;
    children: React.ReactNode;
}

const ResponseType = observer((props: Props) => {
    const { response, className } = props;
    const name = useTranslation(response.name);

    return (
        <>
            <div className={clsx(shared.name, className)}>{name}</div>
            <div className={clsx(shared.value)}>{props.children}</div>
        </>
    );
});

export default ResponseType;
