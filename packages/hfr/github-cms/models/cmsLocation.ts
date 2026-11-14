import { matchPath } from '@docusaurus/router';
import siteConfig from '@generated/docusaurus.config';

/** the repository of this website, opened when no other repository was visited */
export const SITE_REPOSITORY = `${siteConfig.organizationName}/${siteConfig.projectName}`;

/**
 * A location in the cms, as in the url `/cms/<owner>/<name>/<path>?ref=<branch>`.
 */
export interface CmsLocation {
    /** `owner/name` of the repository */
    repo: string;
    /** the default branch of the repository, when not set */
    branch?: string;
    /** the file or directory, `''` for the root directory */
    path: string;
}

interface RouteParams {
    owner: string;
    name: string;
    0?: string;
}

const trimSlashes = (path: string) => path.replace(/(^\/+|\/+$)/g, '');

/**
 * The location of a cms url, `null` for `/cms` without a repository.
 */
export const parseCmsUrl = (pathname: string, search: string): CmsLocation | null => {
    const match =
        matchPath<RouteParams>(pathname, '/cms/:owner/:name/*') ??
        matchPath<RouteParams>(pathname, '/cms/:owner/:name');
    if (!match) {
        return null;
    }
    const { owner, name, 0: path } = match.params;
    return {
        repo: `${owner}/${name}`,
        branch: new URLSearchParams(search).get('ref') || undefined,
        path: decodeURIComponent(trimSlashes(path ?? ''))
    };
};

export const cmsUrl = ({ repo, branch, path }: CmsLocation) => {
    const encodedPath = path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
    const pathname = encodedPath ? `/cms/${repo}/${encodedPath}` : `/cms/${repo}`;
    return branch ? `${pathname}?ref=${encodeURIComponent(branch)}` : pathname;
};
