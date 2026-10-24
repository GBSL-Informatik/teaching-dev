import { RootStore } from '@tdev-stores/rootStore';
import axios from 'axios';
import { action, observable } from 'mobx';
import { computedFn } from 'mobx-utils';

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
    private apiStateResetTimeouts = new Map<Api | ApiAction, ReturnType<typeof setTimeout>>();

    @action
    abortRequest(sigId: Api | ApiAction, skipReset: boolean = false) {
        const controller = this.abortControllers.get(sigId);
        this.abortControllers.delete(sigId);
        this.cancelApiStateReset(sigId);
        if (!skipReset) {
            this.apiState.delete(sigId);
        }
        controller?.abort();
    }

    @action
    async withAbortController<T>(
        sigId: Api | ApiAction,
        fn: (ct: AbortController) => Promise<T>
    ): Promise<T> {
        const controller = new AbortController();
        this.abortRequest(sigId, true);
        this.abortControllers.set(sigId, controller);
        this.apiState.set(sigId, ApiState.SYNCING);

        try {
            const result = await fn(controller);
            this.updateRequestState(sigId, controller, ApiState.SUCCESS);
            return result;
        } catch (error) {
            if (axios.isCancel(error)) {
                this.updateRequestState(sigId, controller, ApiState.IDLE);
                return { data: null } as T;
            }
            this.updateRequestState(sigId, controller, ApiState.ERROR);
            throw error;
        } finally {
            this.finishRequest(sigId, controller);
        }
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

    @action
    private updateRequestState(sigId: Api | ApiAction, controller: AbortController, state: ApiState) {
        if (this.abortControllers.get(sigId) !== controller || controller.signal.aborted) {
            return;
        }
        if (state === ApiState.IDLE) {
            this.apiState.delete(sigId);
            return;
        }
        this.apiState.set(sigId, state);
    }

    @action
    private finishRequest(sigId: Api | ApiAction, controller: AbortController) {
        if (this.abortControllers.get(sigId) !== controller) {
            return;
        }
        this.abortControllers.delete(sigId);
        if (controller.signal.aborted) {
            this.apiState.delete(sigId);
            return;
        }
        if (!this.apiState.has(sigId)) {
            return;
        }
        this.scheduleApiStateReset(sigId);
    }

    private scheduleApiStateReset(sigId: Api | ApiAction) {
        this.cancelApiStateReset(sigId);
        const timeout = setTimeout(
            action(() => {
                if (this.apiStateResetTimeouts.get(sigId) !== timeout) {
                    return;
                }
                this.apiStateResetTimeouts.delete(sigId);
                this.apiState.delete(sigId);
            }),
            API_STATE_RESET_TIMEOUT
        );
        this.apiStateResetTimeouts.set(sigId, timeout);
    }

    private cancelApiStateReset(sigId: Api | ApiAction) {
        clearTimeout(this.apiStateResetTimeouts.get(sigId));
        this.apiStateResetTimeouts.delete(sigId);
    }
}

export default iStore;
