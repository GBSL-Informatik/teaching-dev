import { type ParsedArgs } from 'minimist';

export const ensureTdevMessage = (message: string): `[tdev] ${string}` => {
    if (!message.startsWith('[tdev] ')) {
        return `[tdev] ${message}`;
    }
    return message as `[tdev] ${string}`;
};

export const getCommitMessage = (argv: ParsedArgs, defaultMessage: string): `[tdev] ${string}` => {
    return ensureTdevMessage(argv.message || argv.m || defaultMessage);
};
