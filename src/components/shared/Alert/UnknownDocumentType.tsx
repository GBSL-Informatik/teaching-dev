import Icon from '@mdi/react';
import Alert from '.';
import { mdiAlert } from '@mdi/js';
import { SIZE_S } from '../iconSizes';
import { IfmColors } from '../Colors';

interface Props {
    type: string;
}

const UnknownDocumentType = (props: Props) => {
    return (
        <Alert type="warning">
            <Icon path={mdiAlert} size={SIZE_S} color={IfmColors.orange} /> Keine Anzeigekomponente für{' '}
            <code>{props.type}</code> gefunden.
        </Alert>
    );
};

export default UnknownDocumentType;
