import type { CodeType } from '@tdev-api/document';
import { useComputed } from '@tdev-hooks/useComputed';
import type CodeCommit from '@tdev-models/documents/CodeCommit';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import CommitEntry from './CommitEntry';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
    commit: CodeCommit;
}

const CommitNode = observer(<T extends CodeType>(props: Props<T>) => {
    const { code, commit } = props;
    const isHead = useComputed(() => code.codeCommitId === commit.id, [code, commit]);
    const handleRestore = React.useCallback(() => code.restoreCommit(commit), [code, commit]);
    return (
        <li>
            <CommitEntry
                code={code}
                selectionId={commit.id}
                label={commit.title}
                details={commit.details}
                createdAt={commit.createdAt}
                isHead={isHead}
                onRestore={handleRestore}
            />
            {commit.childCommits.length > 0 && (
                <ul className={styles.tree}>
                    {commit.childCommits.map((child) => (
                        <CommitNode key={child.id} code={code} commit={child} />
                    ))}
                </ul>
            )}
        </li>
    );
});

export default CommitNode;
