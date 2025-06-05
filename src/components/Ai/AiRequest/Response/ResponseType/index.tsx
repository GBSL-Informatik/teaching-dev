import React from 'react';
import clsx from 'clsx';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { ObjectValue } from '@tdev-models/Ai/AiRequest';

interface Props {
    response: ObjectValue;
    className?: string;
    children: React.ReactNode;
}

const ResponseType = observer((props: Props) => {
    const { response, className } = props;

    return (
        <>
            <div className={clsx(shared.name, className)}>{response.name}</div>
            <div className={clsx(shared.value)}>{props.children}</div>
        </>
    );
});

export default ResponseType;
