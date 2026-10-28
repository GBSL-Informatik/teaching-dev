type CleanupStep = () => void | Promise<void>;

export const finalizeExecution = async (
    cleanupSteps: readonly CleanupStep[],
    executionErrors: readonly unknown[] = []
) => {
    const errors = [...executionErrors];
    for (const cleanup of cleanupSteps) {
        try {
            await cleanup();
        } catch (error: unknown) {
            errors.push(error);
        }
    }
    if (errors.length === 1) {
        throw errors[0];
    }
    if (errors.length > 1) {
        const [primaryError, ...additionalErrors] = errors;
        const details = additionalErrors.map(formatError).join('\n');
        throw new AggregateError(
            errors,
            `${formatError(primaryError)}\n\nAdditional errors during finalization:\n${details}`,
            { cause: primaryError }
        );
    }
};

const formatError = (error: unknown) => (error instanceof Error ? error.message : String(error));
