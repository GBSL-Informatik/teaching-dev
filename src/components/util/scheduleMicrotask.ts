const scheduleMicrotask = (callback: () => void) => {
    let subscribed = true;
    queueMicrotask(() => {
        if (subscribed) callback();
    });
    return () => (subscribed = false);
};

export default scheduleMicrotask;
