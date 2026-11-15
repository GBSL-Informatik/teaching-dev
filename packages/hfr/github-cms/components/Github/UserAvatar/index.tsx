import { mdiAlertDecagram, mdiCheckDecagram } from '@mdi/js';
import Icon from '@mdi/react';
import Avatar from '@tdev-components/shared/Avatar';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../../../hooks/useCmsStore';
import styles from './styles.module.scss';

/**
 * The github account and a link to the current repository, or to the pull request of the current branch.
 */
const UserAvatar = observer(() => {
    const cmsStore = useCmsStore();
    const { github } = cmsStore;

    if (!github?.user) {
        return null;
    }

    return (
        <div className={clsx(styles.ghUser)}>
            <Avatar
                imgSrc={github.user.avatar_url}
                name={
                    <span>
                        {github.user.login}{' '}
                        <Icon
                            path={github.canWrite ? mdiCheckDecagram : mdiAlertDecagram}
                            color={github.canWrite ? 'var(--ifm-color-success)' : 'var(--ifm-color-danger)'}
                            size={SIZE_XS}
                            title={github.canWrite ? 'Kann Änderungen vornehmen' : 'Keine Schreibrechte'}
                        />
                    </span>
                }
                size="sm"
                href={github.user.html_url}
                className={clsx(styles.avatar)}
                description={
                    <a
                        href={
                            cmsStore.activeBranch?.PR
                                ? cmsStore.activeBranch.PR.htmlUrl
                                : github.repo?.html_url
                        }
                        target="_blank"
                    >
                        {`${cmsStore.repoOwner}/${cmsStore.repoName}`}
                    </a>
                }
            />
        </div>
    );
});

export default UserAvatar;
