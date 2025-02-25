export const parseExpression = <T extends Object = { [key: string]: any }>(
    value: string | undefined
): T | undefined => {
    if (!value) {
        return undefined;
    }
    try {
        return Function('return ' + value)() as T;
    } catch (e) {
        console.log('Error parsing expression', e);
        return undefined;
    }
};
