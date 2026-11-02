export interface PackageDocsExtension {
    watchPaths: string[];
    sync: (destination: string) => Promise<void>;
}
