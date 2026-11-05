import { translate } from '@docusaurus/Translate';
import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import { INITIAL_CODE_SELECTION } from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import CommitEntry from './CommitEntry';
import CommitNode from './CommitNode';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const CommitTree = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const handleRestore = React.useCallback(() => code.restoreInitialCode(), [code]);
    return (
        <ul className={styles.tree}>
            <li>
                <CommitEntry
                    code={code}
                    label={translate({ id: 'CodeCommits.Tree.InitialCode', message: 'Ursprünglicher Code' })}
                    selectionId={INITIAL_CODE_SELECTION}
                    isHead={!code.codeCommitId}
                    onRestore={handleRestore}
                />
                {code.rootCommits.length > 0 && (
                    <ul className={styles.tree}>
                        {code.rootCommits.map((commit) => (
                            <CommitNode key={commit.id} code={code} commit={commit} />
                        ))}
                    </ul>
                )}
            </li>
        </ul>
    );
});

export default CommitTree;
