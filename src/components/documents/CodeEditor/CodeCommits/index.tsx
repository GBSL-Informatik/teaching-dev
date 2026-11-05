import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import CommitForm from './CommitForm';
import CommitTree from './CommitTree';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const CodeCommits = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    return (
        <div className={styles.codeCommits}>
            {code.canCommit && <CommitForm code={code} />}
            <CommitTree code={code} />
        </div>
    );
});

export default CodeCommits;
