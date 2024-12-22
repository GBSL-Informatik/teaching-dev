import {
    mdiCircleOutline,
    mdiMinusCircleOutline,
    mdiNumeric0Circle,
    mdiNumeric1Circle,
    mdiNumeric2Circle,
    mdiNumeric3Circle,
    mdiNumeric4Circle,
    mdiNumeric5Circle,
    mdiNumeric6Circle,
    mdiNumeric7Circle,
    mdiNumeric8Circle,
    mdiNumeric9Circle,
    mdiNumeric9PlusCircle
} from '@mdi/js';

export const MdiNumericCircle = {
    [0]: mdiNumeric0Circle,
    [1]: mdiNumeric1Circle,
    [2]: mdiNumeric2Circle,
    [3]: mdiNumeric3Circle,
    [4]: mdiNumeric4Circle,
    [5]: mdiNumeric5Circle,
    [6]: mdiNumeric6Circle,
    [7]: mdiNumeric7Circle,
    [8]: mdiNumeric8Circle,
    [9]: mdiNumeric9Circle
};

export const getNumericCircleIcon = (num: number) => {
    if (num < 0) {
        return mdiMinusCircleOutline;
    }
    if (num > 9) {
        return mdiNumeric9PlusCircle;
    }
    return MdiNumericCircle[num as keyof typeof MdiNumericCircle] || mdiCircleOutline;
};
