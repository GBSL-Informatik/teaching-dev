import type { Context, Message } from '../messages';

export const createMessageDelivery = (sendMessage: Context['sendMessage']) => {
    const pending = new Set<Promise<void>>();
    let failure: { error: unknown } | undefined;

    const send = (message: Message) => {
        const delivery = Promise.resolve(sendMessage(message));
        pending.add(delivery);
        delivery.then(
            () => {
                pending.delete(delivery);
            },
            (error: unknown) => {
                failure ??= { error };
                pending.delete(delivery);
            }
        );
    };

    const finish = async () => {
        await Promise.allSettled([...pending]);
        if (failure) {
            throw failure.error;
        }
    };

    return { send, finish };
};
