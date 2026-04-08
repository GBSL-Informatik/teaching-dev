import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import { VFile } from 'vfile';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import path from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);

const alignLeft = (content: string) => {
    return content
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n');
};

const process = async (content: string) => {
    const { default: plugin } = await import('../plugin');
    const tmpFile = path.resolve(path.dirname(__filename), 'artifacts', `test-${Date.now()}.mdx`);
    await fs.writeFile(tmpFile, alignLeft(content));
    const file = new VFile({ value: alignLeft(content), history: [tmpFile] });
    const result = await remark().use(remarkMdx).use(plugin).process(file);

    return result.value;
};

afterEach(() => {
    // clear ./artifacts folder content
    const artifactsDir = path.resolve(path.dirname(__filename), 'artifacts');
    fs.readdir(artifactsDir)
        .then((files) => {
            const unlinkPromises = files.map((file) =>
                file !== '.gitkeep' ? fs.unlink(path.join(artifactsDir, file)) : Promise.resolve()
            );
            return Promise.all(unlinkPromises);
        })
        .catch((err) => {
            console.warn('Could not clear artifacts directory', err);
        });
});

describe('#quiz', () => {
    it("does nothing if there's no quiz", async () => {
        const input = `# Heading

            Some content
        `;
        const result = await process(input);
        expect(result).toBe(alignLeft(input));
    });
    it('handles empty quiz', async () => {
        const input = `# Heading

            <Quiz>
            </Quiz>
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <Quiz questionCount={0} />
          "
        `);
    });
    it('handles quiz with questions', async () => {
        const input = `# Heading

            <Quiz>
                <ChoiceAnswer correct={[5]}>
                    > In welchem Jahr war 2024?
                    
                    1. 1965
                    2. 1983
                    3. 1991
                    4. 2000
                    5. 2024
                </ChoiceAnswer>
            </Quiz>
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <Quiz questionCount={1}>
            <ChoiceAnswer correct={[5]} numOptions={true} questionIndex={true} inQuiz={true}>
              <ChoiceAnswer.Before>
                > In welchem Jahr war 2024?
              </ChoiceAnswer.Before>

              <ChoiceAnswer.Options>
                <ChoiceAnswer.Option optionIndex={0}>
                  1965
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={1}>
                  1983
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={2}>
                  1991
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={3}>
                  2000
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={4}>
                  2024
                </ChoiceAnswer.Option>
              </ChoiceAnswer.Options>
            </ChoiceAnswer>
          </Quiz>
          "
        `);
    });
});
