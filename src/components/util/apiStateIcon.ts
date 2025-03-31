import { mdiCheckCircle, mdiClose, mdiCloseCircle, mdiLoading } from '@mdi/js';
import { ApiState } from '@tdev-stores/iStore';

export const apiIcon = (icon: string, apiState?: ApiState, skipSuccess?: boolean) => {
    if (!apiState || apiState === ApiState.IDLE || (skipSuccess && apiState === ApiState.SUCCESS)) {
        return icon;
    }
    switch (apiState) {
        case ApiState.ERROR:
            return mdiCloseCircle;
        case ApiState.SYNCING:
            return mdiLoading;
        case ApiState.SUCCESS:
            return mdiCheckCircle;
    }
};

export const apiIconColor = (color: string, apiState?: ApiState, skipSuccess?: boolean) => {
    if (!apiState || apiState === ApiState.IDLE || (skipSuccess && apiState === ApiState.SUCCESS)) {
        return color;
    }
    switch (apiState) {
        case ApiState.ERROR:
            return 'var(--ifm-color-danger)';
        case ApiState.SYNCING:
            return 'var(--ifm-color-secondary)';
        case ApiState.SUCCESS:
            return 'var(--ifm-color-success)';
    }
};

export const apiButtonColor = (color: string, apiState?: ApiState, skipSuccess?: boolean) => {
    if (!apiState || apiState === ApiState.IDLE || (skipSuccess && apiState === ApiState.SUCCESS)) {
        return color;
    }
    switch (apiState) {
        case ApiState.ERROR:
            return 'red';
        case ApiState.SYNCING:
            return 'secondary';
        case ApiState.SUCCESS:
            return 'green';
    }
};
