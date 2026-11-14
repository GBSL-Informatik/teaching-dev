import Link from '@docusaurus/Link';
import { mdiHome, mdiLogoutVariant, mdiSwapHorizontal } from '@mdi/js';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';
import Branch from '../Branch';
import LocalChanges from '../LocalChanges';
import PR from '../PR';
import RepositoryList from '../RepositoryList';
import UserAvatar from '../UserAvatar';
import styles from './styles.module.scss';

interface Props {
    /** closes the modal, e.g. after a changed file is opened */
    onClose?: () => void;
}

/**
 * The github account, the local changes, pull requests and branches of the repository, shown in a modal.
 * The other repositories of the account are only listed on demand.
 */
const RepositoryOverview = observer(({ onClose }: Props) => {
    const cmsStore = useCmsStore();
    const { github } = cmsStore;
    const [showRepositories, setShowRepositories] = React.useState(false);
    if (!github) {
        return null;
    }
    const branchesWithoutPR = github.branches.filter((branch) => !branch.PR);

    return (
        <Card
            classNames={{ card: styles.card, body: styles.body }}
            header={
                <div className={clsx(styles.account)}>
                    <UserAvatar />
                    <Button
                        onClick={() => cmsStore.logoutGithub()}
                        icon={mdiLogoutVariant}
                        color="red"
                        size={SIZE_S}
                        title="Logout from Github Account"
                        text="Logout"
                    />
                </div>
            }
        >
            <div className={clsx(styles.navigation)}>
                <Link to="/" className={clsx(styles.home)}>
                    <Icon path={mdiHome} size={SIZE_S} />
                    Zur Website
                </Link>
                <Button
                    onClick={() => setShowRepositories(!showRepositories)}
                    icon={mdiSwapHorizontal}
                    size={SIZE_S}
                    active={showRepositories}
                    text="Repository wechseln"
                />
            </div>
            {showRepositories && <RepositoryList onOpen={onClose} />}
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
