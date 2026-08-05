import { execa } from 'execa';

export const hasUncommittedChanges = async (): Promise<boolean> => {
    const { stdout } = await execa`git status --porcelain`;
    return stdout.trim() !== '';
};
