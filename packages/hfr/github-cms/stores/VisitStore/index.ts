import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { action, observable } from 'mobx';
import { type CmsLocation, SITE_REPOSITORY } from '../../models/cmsLocation';
import { DEFAULT_BRANCH, type Visit, VisitDb } from './visitDb';

const visitKey = (repo: string, branch: string) => `${repo}:${branch}`;

const toLocation = ({ repo, branch, path }: Visit): CmsLocation => ({
    repo,
    branch: branch === DEFAULT_BRANCH ? undefined : branch,
    path
});

const logError = (error: unknown) => console.error('Failed to persist the visited location', error);

/**
 * Remembers the last visited location of each branch in IndexedDB, to restore it when the cms
 * is opened without a branch and a file, e.g. `/cms` after the login.
 *
 * - Each opened location is visited, also before the login, see `CmsStore.open`.
 * - A location requested without a branch is resolved to the default branch, its visit is then
 *   replaced by the visit of the default branch.
 * - Invalid locations are forgotten, see `CmsStore`.
 */
export class VisitStore {
    @observable accessor isLoaded = false;
    private readonly db = new VisitDb();
    private readonly visits = observable.map<string, Visit>([], { deep: false });

    constructor() {
        this.load();
    }

    /**
     * The location to open instead of the requested one, when the request names no branch
     * and no file: the last visited location of the repository (or of any repository for `/cms`).
     */
    restore(request: CmsLocation | null): CmsLocation | undefined {
        if (!request) {
            return this.lastVisited() ?? { repo: SITE_REPOSITORY, path: '' };
        }
        if (request.branch || request.path) {
            return undefined;
        }
        const lastVisited = this.lastVisited(request.repo);
        // a visit naming no branch and no file is the request itself
        if (!lastVisited?.branch && !lastVisited?.path) {
            return undefined;
        }
        return lastVisited;
    }

    @action
    visit(location: CmsLocation) {
        const visit: Visit = {
            repo: location.repo,
            branch: location.branch ?? DEFAULT_BRANCH,
            path: location.path,
            visitedAt: Date.now()
        };
        if (location.branch) {
            this.forget(location.repo, DEFAULT_BRANCH);
        }
        this.visits.set(visitKey(visit.repo, visit.branch), visit);
        this.db.put(visit).catch(logError);
    }

    @action
    forget(repo: string, branch: string) {
        const key = visitKey(repo, branch);
        if (!this.visits.has(key)) {
            return;
        }
        this.visits.delete(key);
        this.db.delete(repo, branch).catch(logError);
    }

    @action
    forgetRepo(repo: string) {
        for (const visit of [...this.visits.values()]) {
            if (visit.repo === repo) {
                this.forget(visit.repo, visit.branch);
            }
        }
    }

    private lastVisited(repo?: string): CmsLocation | undefined {
        const visits = [...this.visits.values()].filter((visit) => !repo || visit.repo === repo);
        const latest = visits.sort((a, b) => b.visitedAt - a.visitedAt)[0];
        return latest && toLocation(latest);
    }

    private load() {
        // the server renders the loader, like the browser does while hydrating, see `CmsRoute`
        if (!ExecutionEnvironment.canUseDOM) {
            return;
        }
        this.db
            .getAll()
            .then(
                action((visits) => {
                    for (const visit of visits) {
                        const key = visitKey(visit.repo, visit.branch);
                        // visited while loading, which is more recent
                        if (!this.visits.has(key)) {
                            this.visits.set(key, visit);
                        }
                    }
                })
            )
            .catch(logError)
            .finally(action(() => (this.isLoaded = true)));
    }
}
