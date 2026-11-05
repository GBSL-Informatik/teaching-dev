import { mdiSourceCommit } from '@mdi/js';
import type { CodeType } from '@tdev-api/document';
import Button, { Color } from '@tdev-components/documents/CodeEditor/Button';
import { useStore } from '@tdev-hooks/useStore';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const ToggleCommits = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const { codeCommitsView } = useStore('viewStore');
    const isOpen = codeCommitsView.isPanelOpen(code);
    const handleClick = () => codeCommitsView.togglePanel(code);
    return (
        <Button
            icon={mdiSourceCommit}
            onClick={handleClick}
            color={isOpen ? Color.Primary : Color.Secondary}
            title={isOpen ? 'Commits ausblenden' : 'Commits anzeigen'}
        />
    );
});

export default ToggleCommits;
