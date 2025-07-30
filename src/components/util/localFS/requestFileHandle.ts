const requestFileHandle = async (
    parentDir: FileSystemDirectoryHandle,
    filePath: string,
    mode: FileSystemPermissionMode = 'read',
    create: boolean = false
) => {
    if (/^\.\.\//.test(filePath)) {
        throw new Error('Invalid file path: cannot access parent directories');
    }
    const parts = filePath.replace(/^\//, '').split('/');
    // map static paths to the static directory
    if (filePath.startsWith('/')) {
        parts.splice(0, 0, 'static');
    }
    console.log(filePath, parts);
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
