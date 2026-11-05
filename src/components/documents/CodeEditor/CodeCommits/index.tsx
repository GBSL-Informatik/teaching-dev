import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import CommitForm from './CommitForm';
import CommitGraph from './CommitGraph';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const CodeCommits = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    return (
        <div className={styles.codeCommits}>
            {code.canCommit && <CommitForm code={code} />}
            <CommitGraph code={code} />
        </div>
    );
});

export default CodeCommits;
