const requestFileHandle = async (
    parentDir: FileSystemDirectoryHandle,
    filePath: string,
    mode: FileSystemPermissionMode = 'read',
    create: boolean = false
) => {
    if (/^\.\.\//.test(filePath)) {
        throw new Error('Invalid file path: cannot access parent directories');
    }
    // expect filePath to be relative to the `parentDir` directory
    const parts = filePath.replace(/^\//, '').split('/');
    const fileName = parts.pop();

    if (!fileName) {
        throw new Error('Invalid file path: no file name provided');
    }
    let currentDir: FileSystemDirectoryHandle = parentDir;
    for (const part of parts) {
        try {
            currentDir = await currentDir.getDirectoryHandle(part, { create: false });
        } catch (err) {
            throw new Error(`Directory "${part}" does not exist in the path "${filePath}"`);
        }
    }
    const file = await currentDir.getFileHandle(fileName, { create: create });
    if (mode) {
        const permission = await file.queryPermission({ mode });
        if (permission !== 'granted') {
            const grantedPermission = await file.requestPermission({ mode });
            if (grantedPermission !== 'granted') {
                throw new Error(`Permission "${mode}" not granted for file "${fileName}"`);
            }
        }
    }
    return { fileHandle: file, parentDir: currentDir };
};
export default requestFileHandle;
