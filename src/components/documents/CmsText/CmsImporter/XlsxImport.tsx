import { mdiClose } from '@mdi/js';
import FromXlsxClipboard from '@tdev-components/shared/FromXlsxClipboard';
import { observer } from 'mobx-react-lite';

interface Props {
    onDone: (data: string[][]) => void;
    onClose: () => void;
}

const XlsxImport = observer((props: Props) => {
    return (
        <FromXlsxClipboard
            matchUsers
            onDone={(table) => {
                const newTable = table?.filter((row) => row.length > 0 && row[0].trim().length > 0);
                /**
                 * table includes header
                 */
                if (!newTable || newTable.length <= 1) {
                    return props.onClose();
                }
                props.onDone(newTable);
            }}
            importLabel="Weiter"
            cancelIcon={mdiClose}
            includeHeader
        />
    );
});

export default XlsxImport;
