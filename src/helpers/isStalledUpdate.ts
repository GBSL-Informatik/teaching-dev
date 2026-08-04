export const isStalledUpdate = (current: { updatedAt: Date }, updated: { updatedAt: Date | string }) => {
    const tsUpdate = new Date(updated.updatedAt).getTime();
    const tsCurrent = current.updatedAt.getTime();
    if (!Number.isFinite(tsUpdate)) {
        return true;
    }
    if (!Number.isFinite(tsCurrent)) {
        return false;
    }

    return tsUpdate <= tsCurrent;
};
