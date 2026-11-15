import { action, observable } from 'mobx';
import { type CmsLocation, SITE_REPOSITORY } from '../../models/cmsLocation';
import { DEFAULT_BRANCH, type Visit, VisitDb } from './visitDb';

const visitKey = (repo: string, branch: string) => `${repo}:${branch}`;

const toLocation = ({ repo, branch, path }: Visit): CmsLocation => ({
    repo,
    branch: branch === DEFAULT_BRANCH ? undefined : branch,
    path
});

const latest = (visits: Visit[]): CmsLocation | undefined => {
    const [latestVisit] = visits.sort((a, b) => b.visitedAt - a.visitedAt);
    return latestVisit && toLocation(latestVisit);
};

const logError = (error: unknown) => console.error('Failed to persist the visited location', error);

/**
 * Remembers the last visited location of each branch in IndexedDB, to restore the last viewed
 * file when the cms is opened without a branch and a file, e.g. `/cms` after the login.
 * Without a viewed file, the readme of the default branch is opened, see `CmsStore.startLocationOf`.
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
     * and no file: the last viewed file of the repository (of the last visited one for `/cms`).
     */
    restore(request: CmsLocation | null): CmsLocation | undefined {
        if (!request) {
            const repo = latest([...this.visits.values()])?.repo ?? SITE_REPOSITORY;
            return this.lastViewedFile(repo) ?? { repo, path: '' };
        }
        if (request.branch || request.path) {
            return undefined;
        }
        return this.lastViewedFile(request.repo);
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

    /** also a directory, but not the root directory of a branch */
    private lastViewedFile(repo: string): CmsLocation | undefined {
        const visits = [...this.visits.values()].filter((visit) => visit.repo === repo && visit.path);
        return latest(visits);
    }

    private load() {
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
