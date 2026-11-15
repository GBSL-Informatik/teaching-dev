import { mdiFileTree, mdiFileTreeOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../../../hooks/useCmsStore';

interface Props {
    className?: string;
}

const FileTreeToggle = observer(({ className }: Props) => {
    const { viewStore } = useCmsStore();
    const { showFileTree } = viewStore;
    return (
        <Button
            icon={showFileTree ? mdiFileTree : mdiFileTreeOutline}
            color={showFileTree ? 'blue' : undefined}
            title={showFileTree ? 'Dateibaum ausblenden' : 'Dateibaum anzeigen'}
            onClick={() => viewStore.setShowFileTree(!showFileTree)}
            className={className}
            size={SIZE_S}
        />
    );
});

export default FileTreeToggle;
