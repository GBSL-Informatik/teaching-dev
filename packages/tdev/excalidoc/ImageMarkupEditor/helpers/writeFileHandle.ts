/**
 * Write data to a FileSystemFileHandle using the writable stream API.
 */
const writeFileHandle = async (fileHandle: FileSystemFileHandle, data: FileSystemWriteChunkType) => {
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
};

export default writeFileHandle;
