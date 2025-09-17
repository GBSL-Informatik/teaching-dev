import React, { type ReactNode } from 'react';
import { ThemeClassNames } from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import styles from './styles.module.scss';
import siteConfig from '@generated/docusaurus.config';
import type { Props } from '@theme/EditThisPage';
import Icon from '@mdi/react';
import { mdiGithub, mdiInfinity, mdiMicrosoftVisualStudioCode } from '@mdi/js';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { useLocation } from '@docusaurus/router';
import type { EditThisPageOption, ShowEditThisPage } from '@tdev/siteConfig/siteConfig';
const { organizationName, projectName, customFields } = siteConfig;
const { showEditThisPage, showEditThisPageOptions, editThisPageCmsUrl } = customFields as {
    showEditThisPage: ShowEditThisPage;
    showEditThisPageOptions: EditThisPageOption[];
    editThisPageCmsUrl: string;
};
const DisplayBadgeFor = new Set<EditThisPageOption>(
    showEditThisPageOptions.length === 0 ? ['github', 'github-dev', 'cms'] : showEditThisPageOptions
);
const GH_EDIT_URL = `https://github.com/${organizationName}/${projectName}/edit/main/`;
const GH_DEV_EDIT_URL = `https://github.dev/${organizationName}/${projectName}/blob/main/`;
const CMS_EDIT_URL = `${editThisPageCmsUrl}${organizationName}/${projectName}/`;

const EditThisPage = observer(({ editUrl }: Props): ReactNode => {
    const userStore = useStore('userStore');
    const location = useLocation();
    const search = new URLSearchParams(location.search);
    if (!editUrl || search.has('edit')) {
        return;
    }
    const isLoggedIn = !!userStore.current;
    switch (showEditThisPage) {
        case 'always':
            break;
        case 'never':
            return null;
        case 'loggedIn':
            if (!isLoggedIn) {
                return null;
            }
            break;
        case 'teachers':
            if (!userStore.current?.hasElevatedAccess) {
                return null;
            }
            break;
        case 'admins':
            if (!userStore.current?.isAdmin) {
                return null;
            }
            break;
        default:
            console.warn(`Unknown value for showEditThisPage: ${showEditThisPage}`);
            return null;
    }
    return (
        <div className={clsx(styles.editThisPage)}>
            {DisplayBadgeFor.has('github') && (
                <Link
                    to={`${GH_EDIT_URL}${editUrl}`}
                    className={clsx(ThemeClassNames.common.editThisPage, styles.edit)}
                >
                    <Icon path={mdiGithub} size={0.7} />
                    Github
                </Link>
            )}
            {DisplayBadgeFor.has('github-dev') && (
                <Link
                    to={`${GH_DEV_EDIT_URL}${editUrl}`}
                    className={clsx(ThemeClassNames.common.editThisPage, styles.edit)}
                >
                    <Icon path={mdiMicrosoftVisualStudioCode} size={0.7} />
                    .dev
                </Link>
            )}
            {DisplayBadgeFor.has('cms') && isLoggedIn && (
                <Link
                    to={`${CMS_EDIT_URL}${editUrl}`}
                    className={clsx(ThemeClassNames.common.editThisPage, styles.edit)}
                >
                    <Icon path={mdiInfinity} size={0.7} />
                    cms
                </Link>
            )}
        </div>
    );
});

export default EditThisPage;
