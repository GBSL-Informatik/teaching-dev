import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import CommitForm from './CommitForm';
import CommitGraph from './CommitGraph';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const CodeCommits = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    React.useEffect(() => {
        code.commits.load();
    }, [code]);
    return (
        <div className={styles.codeCommits}>
            {code.commits.canCommit && <CommitForm code={code} />}
            <CommitGraph code={code} />
        </div>
    );
});

export default CodeCommits;
