import _ from 'es-toolkit/compat';

export const createRandomOrderMap = (numOptions: number): { [originalIndex: number]: number } => {
    const originalIndices = _.range(numOptions);
    const shuffledIndices = _.shuffle(originalIndices);
    const randomIndexMap: { [originalIndex: number]: number } = {};
    originalIndices.forEach((originalIndex, i) => {
        randomIndexMap[originalIndex] = shuffledIndices[i];
    });
    return randomIndexMap;
};
