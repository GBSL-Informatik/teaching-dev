export const withTimeout = async <T>(
    promise: Promise<T>,
    milliseconds: number,
    message: string
): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new Error(message)), milliseconds);
            })
        ]);
    } finally {
        clearTimeout(timer);
    }
};
