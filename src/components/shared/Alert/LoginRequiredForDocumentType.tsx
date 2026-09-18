import Icon from '@mdi/react';
import Alert from '.';
import { mdiAlert } from '@mdi/js';
import { SIZE_S } from '../iconSizes';
import { IfmColors } from '../Colors';

interface Props {
    type: string;
}

const LoginRequiredForDocumentType = (props: Props) => {
    return (
        <Alert type="warning">
            <Icon path={mdiAlert} size={SIZE_S} color={IfmColors.orange} /> Für diese Anzeigekomponente (Typ:{' '}
            <code>{props.type}</code>) ist eine Anmeldung erforderlich.
        </Alert>
    );
};

export default LoginRequiredForDocumentType;
