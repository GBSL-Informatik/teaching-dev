import { action, observable } from 'mobx';
import { computedFn } from 'mobx-utils';
import axios from 'axios';
import { RootStore } from '@tdev-stores/rootStore';

export type ApiAction =
    `load` | `create-${string}` | `load-${string}` | `save-${string}` | `destroy-${string}`;

export enum ApiState {
    IDLE = 'idle',
    SYNCING = 'syncing',
    ERROR = 'error',
    SUCCESS = 'success'
}

const API_STATE_RESET_TIMEOUT = 1500;

abstract class iStore<Api = ''> {
    abstract readonly root: RootStore;

    abortControllers = new Map<Api | ApiAction, AbortController>();
    apiState = observable.map<Api | ApiAction, ApiState>();

    withAbortController<T>(sigId: Api | ApiAction, fn: (ct: AbortController) => Promise<T>) {
        const sig = new AbortController();
        if (this.abortControllers.has(sigId)) {
            this.abortControllers.get(sigId)?.abort();
        }
        this.abortControllers.set(sigId, sig);
        this.apiState.set(sigId, ApiState.SYNCING);
        return fn(sig)
            .then(
                action((res) => {
                    this.apiState.set(sigId, ApiState.SUCCESS);
                    return res;
                })
            )
            .catch(
                action((err) => {
                    if (axios.isCancel(err)) {
                        return { data: null } as T;
                    } else {
                        this.apiState.set(sigId, ApiState.ERROR);
                    }
                    throw err;
                })
            )
            .finally(() => {
                if (this.abortControllers.get(sigId) === sig) {
                    this.abortControllers.delete(sigId);
                }
                setTimeout(
                    action(() => {
                        if (this && !this.abortControllers.has(sigId)) {
                            this.apiState.delete(sigId);
                        }
                    }),
                    API_STATE_RESET_TIMEOUT
                );
            });
    }

    apiStateFor = computedFn(
        function (this: iStore<Api>, sigId?: Api | ApiAction): ApiState {
            if (!sigId) {
                return ApiState.IDLE;
            }
            return this.apiState.get(sigId) || ApiState.IDLE;
        },
        { keepAlive: true }
    );
}

export default iStore;
