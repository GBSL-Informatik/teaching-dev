import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { GenericValue } from '@tdev-models/Ai/AiRequest';
import Icon from '@mdi/react';
import { mdiCheckboxBlank, mdiCheckboxMarked } from '@mdi/js';
import { SIZE_M } from '@tdev-components/shared/iconSizes';
import { IfmColors } from '@tdev-components/shared/Colors';
import { Props } from '.';

const GenericValue = observer((props: Props) => {
    const { response, className } = props;
    if (response.type === 'boolean') {
        return (
            <Icon
                className={clsx(className)}
                path={response.value ? mdiCheckboxMarked : mdiCheckboxBlank}
                size={SIZE_M}
                color={response.value ? IfmColors.green : IfmColors.gray}
            />
        );
    }
    return <div className={clsx(className)}>{response.value}</div>;
});

export default GenericValue;
