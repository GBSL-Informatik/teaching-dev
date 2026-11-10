import Link from '@docusaurus/Link';
import { mdiHome } from '@mdi/js';
import Icon from '@mdi/react';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../../../hooks/useCmsStore';
import Branch from '../Branch';
import LocalChanges from '../LocalChanges';
import PR from '../PR';
import styles from './styles.module.scss';

interface Props {
    /** closes the modal, e.g. after a changed file is opened */
    onClose?: () => void;
}

/**
 * The local changes, pull requests and branches of the repository, shown in a modal.
 */
const RepositoryOverview = observer(({ onClose }: Props) => {
    const cmsStore = useCmsStore();
    const { github } = cmsStore;
    if (!github) {
        return null;
    }
    const branchesWithoutPR = github.branches.filter((branch) => !branch.PR);

    return (
        <Card
            classNames={{ card: styles.card, body: styles.body }}
            header={<h4>{`${cmsStore.repoOwner}/${cmsStore.repoName}`}</h4>}
        >
            <Link to="/" className={clsx(styles.home)}>
                <Icon path={mdiHome} size={SIZE_S} />
                Zur Website
            </Link>
            <LocalChanges onNavigate={onClose} />
            <h5>Pull Requests und Branches</h5>
            <ul>
                {github.PRs.map((pr) => (
                    <li key={pr.number}>
                        <PR pr={pr} />
                    </li>
                ))}
                {branchesWithoutPR.map((branch) => (
                    <li key={branch.name}>
                        <Branch branch={branch} />
                    </li>
                ))}
            </ul>
        </Card>
    );
});

export default RepositoryOverview;
