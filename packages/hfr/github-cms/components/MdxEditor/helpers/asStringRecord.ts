export const asStringRecord = (obj: { [key: string]: any }): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const key in obj) {
        result[key] = obj[key].toString();
    }
    return result;
};
