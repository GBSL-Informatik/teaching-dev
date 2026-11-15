import { mdiSourceMerge } from '@mdi/js';
import Badge from '@tdev-components/shared/Badge';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../../../../hooks/useCmsStore';
import type { MergeMethod } from '../../../../models/Github';
import type PR from '../../../../models/PR';

const MERGE_METHOD_LABELS: Record<MergeMethod, string> = {
    squash: 'Squash',
    merge: 'Merge-Commit',
    rebase: 'Rebase'
};

interface Props {
    pr: PR;
}

/**
 * Shows why the merge failed and offers the other allowed merge methods,
 * e.g. when squash merges are disabled in the repository.
 */
const MergeFallback = observer(({ pr }: Props) => {
    const { github } = useCmsStore();
    if (!github || !pr.mergeError) {
        return null;
    }
    const failedLabel = MERGE_METHOD_LABELS[pr.mergeError.method];

    return (
        <>
            <Badge type="danger" title={pr.mergeError.message}>
                {failedLabel} fehlgeschlagen
            </Badge>
            {pr.alternativeMergeMethods.map((method) => (
                <Confirm
                    key={method}
                    icon={mdiSourceMerge}
                    color="green"
                    size={SIZE_S}
                    iconSide="left"
                    text={MERGE_METHOD_LABELS[method]}
                    confirmText={`Mit ${MERGE_METHOD_LABELS[method]} mergen?`}
                    title={`In den ${github.defaultBranchName}-Branch mergen: ${MERGE_METHOD_LABELS[method]}`}
                    disabled={!pr.canMerge}
                    onConfirm={() => github.mergePR(pr.number, method)}
                />
            ))}
        </>
    );
});

export default MergeFallback;
