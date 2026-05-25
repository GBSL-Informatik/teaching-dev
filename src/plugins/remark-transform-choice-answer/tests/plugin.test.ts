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

// TODO: add test for nested quizzes - `transformQuiz` will likely fail since no depth is respected.

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

          <Quiz questionIds={[]} />
          "
        `);
    });
    it('handles quiz with questions', async () => {
        const input = `# Heading

            <Quiz id="8ec64fe7-d9f7-4b91-a9b1-b46a6d4246a7">
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

          <Quiz id="8ec64fe7-d9f7-4b91-a9b1-b46a6d4246a7" questionIds={["q1"]}>
            <ChoiceAnswer correct={[5]} optionsCount={5} qid="q1">
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
    it('handles quiz with multiple questions', async () => {
        const input = `# Heading

            <Quiz id="8ec64fe7-d9f7-4b91-a9b1-b46a6d4246a7">
                <ChoiceAnswer correct={[5]}>
                    > In welchem Jahr war 2024?
                    
                    1. 1965
                    2. 1983
                    3. 1991
                    4. 2000
                    5. 2024
                </ChoiceAnswer>
                

                <ChoiceAnswer correct={[2, 3]} scoring={points(2)}>
                    > Wählen Sie eine korrekte Aussage aus.

                    1. Wenn Daten in der Cloud (z.B. OneDrive) gespeichert werden, ist kein Backup mehr nötig.
                    2. Cloud-Dienste wie OneDrive erlauben es uns, Dateien mit anderen Personen zu teilen.
                    3. Cloud-Dienste machen es einfacher, Dateien zwischen verschiedenen Geräten zu synchronisieren.
                    4. Das Abspeichern sensibler Daten auf Cloud-Diensten ist immer unproblematisch, da diese ja sicher sind.
                    5. Alle der oben genannten Aussagen sind korrekt.
                </ChoiceAnswer>

                <TrueFalseAnswer correct={false} scoring={points(0.5, -0.25, 0)} title="Kann man das so sagen?">
                    > HTML ist eine Programmiersprache.
                </TrueFalseAnswer>
                
                <ChoiceAnswer correct={[1, 3]} scoring={multipleChoicePoints(2, 1)} multiple>
                    > Welche der folgenden Protokolle werden für die Übertragung von E-Mails verwendet?
                    
                    1. SMTP
                    2. FTP
                    3. IMAP
                    4. HTTP
                </ChoiceAnswer>

                <ChoiceAnswer correct={[1, 2, 3, 4, 5]} scoring={noPoints()}>
                    > Wann ist der Sinn des Lebens?
                    
                    1. Immer im März
                    2. 42
                    3. Das Bundeshaus
                    4. Nein
                    5. Ja, aber nur manchmal
                </ChoiceAnswer>
            </Quiz>
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <Quiz id="8ec64fe7-d9f7-4b91-a9b1-b46a6d4246a7" questionIds={["q1","q2","q3","q4","q5"]}>
            <ChoiceAnswer correct={[5]} optionsCount={5} qid="q1">
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

            <ChoiceAnswer correct={[2, 3]} scoring={points(2)} optionsCount={5} qid="q2">
              <ChoiceAnswer.Before>
                > Wählen Sie eine korrekte Aussage aus.
              </ChoiceAnswer.Before>

              <ChoiceAnswer.Options>
                <ChoiceAnswer.Option optionIndex={0}>
                  Wenn Daten in der Cloud (z.B. OneDrive) gespeichert werden, ist kein Backup mehr nötig.
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={1}>
                  Cloud-Dienste wie OneDrive erlauben es uns, Dateien mit anderen Personen zu teilen.
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={2}>
                  Cloud-Dienste machen es einfacher, Dateien zwischen verschiedenen Geräten zu synchronisieren.
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={3}>
                  Das Abspeichern sensibler Daten auf Cloud-Diensten ist immer unproblematisch, da diese ja sicher sind.
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={4}>
                  Alle der oben genannten Aussagen sind korrekt.
                </ChoiceAnswer.Option>
              </ChoiceAnswer.Options>
            </ChoiceAnswer>

            <TrueFalseAnswer correct={false} scoring={points(0.5, -0.25, 0)} title="Kann man das so sagen?" numOptions={true} qid="q3">
              <ChoiceAnswer.Before>
                > HTML ist eine Programmiersprache.
              </ChoiceAnswer.Before>
            </TrueFalseAnswer>

            <ChoiceAnswer correct={[1, 3]} scoring={multipleChoicePoints(2, 1)} multiple optionsCount={4} qid="q4">
              <ChoiceAnswer.Before>
                > Welche der folgenden Protokolle werden für die Übertragung von E-Mails verwendet?
              </ChoiceAnswer.Before>

              <ChoiceAnswer.Options>
                <ChoiceAnswer.Option optionIndex={0}>
                  SMTP
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={1}>
                  FTP
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={2}>
                  IMAP
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={3}>
                  HTTP
                </ChoiceAnswer.Option>
              </ChoiceAnswer.Options>
            </ChoiceAnswer>

            <ChoiceAnswer correct={[1, 2, 3, 4, 5]} scoring={noPoints()} optionsCount={5} qid="q5">
              <ChoiceAnswer.Before>
                > Wann ist der Sinn des Lebens?
              </ChoiceAnswer.Before>

              <ChoiceAnswer.Options>
                <ChoiceAnswer.Option optionIndex={0}>
                  Immer im März
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={1}>
                  42
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={2}>
                  Das Bundeshaus
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={3}>
                  Nein
                </ChoiceAnswer.Option>

                <ChoiceAnswer.Option optionIndex={4}>
                  Ja, aber nur manchmal
                </ChoiceAnswer.Option>
              </ChoiceAnswer.Options>
            </ChoiceAnswer>
          </Quiz>
          "
        `);
    });

    it('handles quiz with explicit set question ids and enumerates the remaining questions', async () => {
        const input = `# Heading

            <Quiz id="8ec64fe7-d9f7-4b91-a9b1-b46a6d4246a7">
                <ChoiceAnswer />
                <ChoiceAnswer qid="custom-id" />
                <ChoiceAnswer qid="q4" />
                <ChoiceAnswer />
                <ChoiceAnswer qid={'expression-sq'} />
                <ChoiceAnswer qid={"expression-dq"} />
                <ChoiceAnswer />
                <ChoiceAnswer />
            </Quiz>
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <Quiz id="8ec64fe7-d9f7-4b91-a9b1-b46a6d4246a7" questionIds={["q1","custom-id","q4","q2","expression-sq","expression-dq","q3","q5"]}>
            <ChoiceAnswer qid="q1">
              <ChoiceAnswer.Before />
            </ChoiceAnswer>

            <ChoiceAnswer qid="custom-id">
              <ChoiceAnswer.Before />
            </ChoiceAnswer>

            <ChoiceAnswer qid="q4">
              <ChoiceAnswer.Before />
            </ChoiceAnswer>

            <ChoiceAnswer qid="q2">
              <ChoiceAnswer.Before />
            </ChoiceAnswer>

            <ChoiceAnswer qid="expression-sq">
              <ChoiceAnswer.Before />
            </ChoiceAnswer>

            <ChoiceAnswer qid="expression-dq">
              <ChoiceAnswer.Before />
            </ChoiceAnswer>

            <ChoiceAnswer qid="q3">
              <ChoiceAnswer.Before />
            </ChoiceAnswer>

            <ChoiceAnswer qid="q5">
              <ChoiceAnswer.Before />
            </ChoiceAnswer>
          </Quiz>
          "
        `);
    });
});

describe('#standalone question', () => {
    it('transforms standalone question', async () => {
        const input = `# Heading
          <ChoiceAnswer id="96df6c5b-2750-4269-bc97-cd49c2f0911d" correct={[5]}>
              > In welchem Jahr war 2024?
              
              1. 1965
              2. 1983
              3. 1991
              4. 2000
              5. 2024
          </ChoiceAnswer>
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <ChoiceAnswer id="96df6c5b-2750-4269-bc97-cd49c2f0911d" correct={[5]} optionsCount={5}>
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
          "
        `);
    });

    it('transforms standalone question with post content', async () => {
        const input = `# Heading
          <ChoiceAnswer id="96df6c5b-2750-4269-bc97-cd49c2f0911d" correct={[5]}>
              > In welchem Jahr war 2024?
              
              1. 1965
              2. 1983
              3. 1991
              4. 2000
              5. 2024

              Überlege es dir gut, bevor du antwortest!
          </ChoiceAnswer>
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "# Heading

          <ChoiceAnswer id="96df6c5b-2750-4269-bc97-cd49c2f0911d" correct={[5]} optionsCount={5}>
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

            <ChoiceAnswer.After>
              Überlege es dir gut, bevor du antwortest!
            </ChoiceAnswer.After>
          </ChoiceAnswer>
          "
        `);
    });
});
