import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { mdiLoading, mdiLogoutVariant, mdiReload } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import NavItem from '@tdev-components/Cms/MdxEditor/EditorNav/BranchPathNav/NavItem';
import { useHistory } from '@docusaurus/router';
import _ from 'lodash';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import UserAvatar from './UserAvatar';

interface Props {}

const AccountOptions = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const history = useHistory();
    const [canLoadMore, setCanLoadMore] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(false);
    React.useEffect(() => {
        const count = cmsStore.github?.repositories?.length || 0;
        if (count !== 20) {
            setCanLoadMore(false);
        } else {
            setCanLoadMore(true);
        }
    }, [cmsStore.github?.repositories]);

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

    return (
        <Card
            classNames={{ card: styles.card, body: styles.accountOptions }}
            header={<h4>Github Account: {cmsStore.github?.user?.name}</h4>}
        >
            <UserAvatar />
            <div className={clsx(styles.repoHeader)}>
                <h5>Repository öffnen</h5>
                <Button
                    icon={mdiReload}
                    title="Repository-Liste Aktualisieren"
                    spin={isLoading}
                    onClick={() => {
                        setIsLoading(true);
                        cmsStore.github?.fetchRepositories(repos.length > 0 ? repos.length : 20).then(() => {
                            setIsLoading(false);
                        });
                    }}
                    size={SIZE_S}
                />
            </div>
            <div className={clsx(styles.repos)}>
                {repos.map((repo) => {
                    return (
                        <NavItem
                            key={repo.id}
                            name={`${repo.owner.login}/${repo.name}`}
                            isActive={repo.name === cmsStore.repoName}
                            onClick={() => {
                                history.push(
                                    `/cms/${repo.owner.login}/${repo.name}?ref=${repo.default_branch}`
                                );
                            }}
                        />
                    );
                })}
                {canLoadMore && (
                    <Button
                        text="Mehr..."
                        title="Mehr (max. 200) Repositories laden"
                        disabled={isLoading}
                        spin={isLoading}
                        icon={isLoading ? mdiLoading : undefined}
                        onClick={() => {
                            setIsLoading(true);
                            cmsStore.github?.fetchRepositories(200).then(() => {
                                setIsLoading(false);
                            });
                        }}
                    />
                )}
            </div>
            <Button
                onClick={() => {
                    cmsStore.logoutGithub();
                }}
                icon={mdiLogoutVariant}
                color="red"
                title="Logout from Github Account"
                text="Logout"
            />
        </Card>
    );
});

export default AccountOptions;
