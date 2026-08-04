export const isStalledUpdate = (current: { updatedAt: Date }, updated: { updatedAt: Date | string }) => {
    const tsUpdate = new Date(updated.updatedAt).getTime();
    const tsCurrent = current.updatedAt.getTime();

    return Number.isFinite(tsUpdate) && Number.isFinite(tsCurrent) && tsCurrent >= tsUpdate;
};
