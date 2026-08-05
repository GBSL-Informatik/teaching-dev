import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const shellInput = async (message: string): Promise<string> => {
    const rl = createInterface({ input, output });
    try {
        const res = await rl.question(message);
        return res;
    } finally {
        rl.close();
    }
};

export default shellInput;
