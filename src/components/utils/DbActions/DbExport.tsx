import { mdiDatabaseExport } from '@mdi/js';
import { localDb } from '@tdev-api/base';
import Button from '@tdev-components/shared/Button';
import customFields from '@tdev-components/utils/customFields';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';

const { tdevConfig } = customFields;

interface Props {}

const DbExport = observer((props: Props) => {
    const sessionStore = useStore('sessionStore');
    if (sessionStore.apiMode === 'api') {
        return;
    }
    if (tdevConfig.database?.preventImport) {
        return;
    }

    return (
        <Button
            icon={mdiDatabaseExport}
            iconSide="left"
            text="Exportieren"
            color="blue"
            onClick={() => {
                localDb.exportDb().then((blob) => {
                    const dataStr =
                        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(blob, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute('href', dataStr);
                    downloadAnchorNode.setAttribute(
                        'download',
                        `indexedDB_export_${new Date().toISOString()}.json`
                    );
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                });
            }}
        />
    );
});

export default DbExport;
