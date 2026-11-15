import { useHistory } from '@docusaurus/router';
import { mdiLoading, mdiReload } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import _ from 'es-toolkit/compat';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';
import NavItem from '../../MdxEditor/EditorNav/BranchPathNav/NavItem';
import styles from './styles.module.scss';

/** the number of repositories github returns without loading more, see `Github.fetchRepositories` */
const FIRST_PAGE_SIZE = 20;

interface Props {
    /** called after a repository is opened */
    onOpen?: () => void;
}

/**
 * The repositories of the github account, the user's own first.
 */
const RepositoryList = observer(({ onOpen }: Props) => {
    const cmsStore = useCmsStore();
    const history = useHistory();
    const [isLoading, setIsLoading] = React.useState(false);

    const repos = React.useMemo(() => {
        const user = cmsStore.github?.user?.login;
        return _.orderBy(
            cmsStore.github?.repositories || [],
            [
                (r) => r.owner.login === user,
                (r) => r.owner.login.toLocaleLowerCase(),
                (r) => r.name.toLowerCase()
            ],
            ['desc', 'asc', 'asc']
        );
    }, [cmsStore.github?.repositories]);
    const canLoadMore = repos.length === FIRST_PAGE_SIZE;

    const handleFetch = (max: number) => {
        setIsLoading(true);
        cmsStore.github?.fetchRepositories(max).then(() => {
            setIsLoading(false);
        });
    };

    const handleOpen = (owner: string, name: string) => {
        // opens the last visited location of the repository, see `VisitStore`
        history.push(`/cms/${owner}/${name}`);
        onOpen?.();
    };

    return (
        <div className={clsx(styles.repositoryList)}>
            <div className={clsx(styles.repoHeader)}>
                <h5>Repository öffnen</h5>
                <Button
                    icon={mdiReload}
                    title="Repository-Liste Aktualisieren"
                    spin={isLoading}
                    onClick={() => handleFetch(repos.length > 0 ? repos.length : FIRST_PAGE_SIZE)}
                    size={SIZE_S}
                />
            </div>
            <div className={clsx(styles.repos)}>
                {repos.map((repo) => (
                    <NavItem
                        key={repo.id}
                        name={`${repo.owner.login}/${repo.name}`}
                        isActive={repo.name === cmsStore.repoName}
                        onClick={() => handleOpen(repo.owner.login, repo.name)}
                    />
                ))}
                {canLoadMore && (
                    <Button
                        text="Mehr..."
                        title="Mehr (max. 200) Repositories laden"
                        disabled={isLoading}
                        spin={isLoading}
                        icon={isLoading ? mdiLoading : undefined}
                        onClick={() => handleFetch(200)}
                    />
                )}
            </div>
        </div>
    );
});

export default RepositoryList;
