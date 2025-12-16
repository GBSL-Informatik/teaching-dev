import { promises as fs } from 'fs';

export const fileExists = async (filePath: string) => {
    try {
        await fs.stat(filePath);
        return true;
    } catch (error) {
        return false;
    }
};
