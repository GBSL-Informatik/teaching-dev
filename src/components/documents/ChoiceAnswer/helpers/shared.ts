import _ from 'es-toolkit/compat';

const range = (numItems: number): number[] => {
    return Array.from({ length: numItems }, (_, i) => i);
};

export const createRandomOrderMap = (numOptions: number): { [originalIndex: number]: number } => {
    const originalIndices = range(numOptions);
    const shuffledIndices = _.shuffle(originalIndices);
    const randomIndexMap: { [originalIndex: number]: number } = {};
    originalIndices.forEach((originalIndex, i) => {
        randomIndexMap[originalIndex] = shuffledIndices[i];
    });
    return randomIndexMap;
};
