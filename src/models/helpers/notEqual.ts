import _ from 'es-toolkit/compat';

export const notEqual = (a: any, b: any) => {
    if (Array.isArray(a)) {
        if (_.xor(a, b).length !== 0) {
            return true;
        }
    } else if (a !== b) {
        return true;
    }
};
