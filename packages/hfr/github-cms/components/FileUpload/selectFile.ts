// GitHub warns about files larger than 50 MB and rejects files larger than 100 MB, see
// https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
export const MAX_FILE_SIZE_MB = 50;

export interface Selection {
    file?: File;
    /** why the selected files can't be uploaded */
    error?: string;
}

/**
 * Selects the file to upload, only single files are uploaded.
 * @param accept the allowed file types, like the `accept` attribute of `<input type="file">`
 */
export const selectFile = (files: File[], accept?: string): Selection => {
    if (files.length !== 1) {
        return { error: 'Bitte genau eine Datei auswählen.' };
    }
    const [file] = files;
    if (accept && !isAccepted(file, accept)) {
        return { error: `Dieser Dateityp ist hier nicht erlaubt: ${file.name}` };
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return { error: `Die Datei ist grösser als ${MAX_FILE_SIZE_MB} MB: ${file.name}` };
    }
    return { file };
};

/** e.g. `accept = 'image/*,.pdf'` */
const isAccepted = (file: File, accept: string) => {
    const types = accept.split(',').map((type) => type.trim().toLowerCase());
    return types.some((type) => {
        if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type);
        }
        if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
    });
};
