import { OnBrokenMarkdownImagesFunction } from '@docusaurus/types';
import { logger } from '@docusaurus/logger';
import path from 'path';
import { NEW_EXCALIDRAW_DRAWING, VALID_EXPORT_EXTENSIONS } from './helpers/constants';
import { ensureDir } from './helpers/ensureDir';
import { promises as fs } from 'fs';

const reportBrokenImage = (params: Parameters<OnBrokenMarkdownImagesFunction>[0]) => {
    const cwd = process.cwd();
    const message = `Broken image link found: ${cwd}/${params.sourceFilePath}:${params.node.position?.start.line}:${params.node.position?.start.column}`;
    logger.error(message);
    return params.url;
};

const isNewExcalidrawSketch = (url: string): boolean => {
    return url.endsWith('.new') || url.endsWith('.newExcalidraw');
};

export const onNewExcalidrawSketchPromise = async (params: Parameters<OnBrokenMarkdownImagesFunction>[0]) => {
    if (!isNewExcalidrawSketch(params.url)) {
        return params.url;
    }
    const url = params.url.replace(/\.new(Excalidraw)?$/, '');
    const ext = path.extname(url).toLowerCase();
    if (!VALID_EXPORT_EXTENSIONS.has(ext)) {
        logger.warn(
            `Invalid extension for new image detected: ${params.url} (resolved extension: ${ext}). Valid extensions are: ${Array.from(VALID_EXPORT_EXTENSIONS).join(', ')}`
        );
        return reportBrokenImage(params);
    }
    await ensureDir(path.join(path.dirname(params.sourceFilePath), url));
    const sketchFilePath = path.join(path.dirname(params.sourceFilePath), url);
    switch (ext) {
        case '.png':
            await fs.copyFile(
                require.resolve('../Component/Preview/images/excalidraw-logo.png'),
                sketchFilePath
            );
            break;
        case '.jpg':
        case '.jpeg':
            await fs.copyFile(
                require.resolve('../Component/Preview/images/excalidraw-logo.jpg'),
                sketchFilePath
            );
            break;
        case '.svg':
            await fs.copyFile(
                require.resolve('../Component/Preview/images/excalidraw-logo.svg'),
                sketchFilePath
            );
            break;
        case '.webp':
            await fs.copyFile(
                require.resolve('@tdev/excalidoc/Component/Preview/images/excalidraw-logo.webp'),
                sketchFilePath
            );
            break;
    }
    await fs.writeFile(sketchFilePath + '.excalidraw', JSON.stringify(NEW_EXCALIDRAW_DRAWING, null, 2), {
        encoding: 'utf-8'
    });

    // replace the url to point to the newly created file
    const mdxContent = await fs.readFile(params.sourceFilePath, { encoding: 'utf-8' });
    await fs.writeFile(params.sourceFilePath, mdxContent.replace(params.url, url), { encoding: 'utf-8' });
    logger.success(`Created new Excalidraw Sketch at "${logger.green(sketchFilePath)}"`);
    params.node.url = url;
    return url;
};

const onNewExcalidrawSketch: OnBrokenMarkdownImagesFunction = (params) => {
    if (!isNewExcalidrawSketch(params.url)) {
        reportBrokenImage(params);
        return params.url;
    }
    onNewExcalidrawSketchPromise(params);
    return params.url;
};

export default onNewExcalidrawSketch;
