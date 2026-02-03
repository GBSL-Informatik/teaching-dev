import _ from 'es-toolkit/compat';

export const createRandomOptionsOrder = (numOptions: number): { [originalOptionIndex: number]: number } => {
    const originalIndices = Array.from({ length: numOptions }, (_, i) => i);
    const shuffledIndices = _.shuffle(originalIndices);
    const randomIndexMap: { [originalOptionIndex: number]: number } = {};
    originalIndices.forEach((originalIndex, i) => {
        randomIndexMap[originalIndex] = shuffledIndices[i];
    });
    return randomIndexMap;
};
