import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { DB_NAME } from '@tdev-api/config';
import { AxiosPromise } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Access, type Document, type DocumentType, type UniquenessConstraints } from '../document';
import { DocumentRoot } from '../documentRoot';
import { GroupPermission, Permissions, UserPermission } from '../permission';
import { StudentGroup } from '../studentGroup';
import { Role, User } from '../user';
import { DbAdapter } from './Adapter';
import IndexedDbAdapter from './Adapter/IndexedDb';
import MemoryDbAdapter from './Adapter/MemoryDb';
import {
    assertUniqueDocument,
    cleanDocument,
    consolidateDocuments,
    deleteDocumentTree,
    matchingConstraint,
    OfflineDocumentError,
    sameDocumentScope
} from './documents';

const TIME_NOW = new Date().toISOString();
const LOG_REQUESTS = true;

export const DEFAULT_OFFLINE_USER: User = {
    id: 'c23c0238-4aeb-457f-9a2c-3d2d5d8931c0',
    email: 'offline.user@tdev.ch',
    name: 'Offline User',
    firstName: 'Offline',
    lastName: 'User',
    role: process.env.NODE_ENV === 'production' ? Role.STUDENT : Role.ADMIN,
    createdAt: TIME_NOW,
    updatedAt: TIME_NOW
};

const UserStore = () => {
    let user: User = { ...DEFAULT_OFFLINE_USER };
    return {
        getUser: () => user,
        setUser: (newUser: User) => {
            user = { ...newUser };
        },
        reset: () => {
            user = { ...DEFAULT_OFFLINE_USER };
        }
    };
};

export const OfflineUser = UserStore();

const DOCUMENTS_STORE = 'documents';
const STUDENT_GROUPS_STORE = 'studentGroups';
const PERMISSIONS_STORE = 'permissions';

const resolveResponse = <T>(data: T, statusCode: number = 200, statusText: string = ''): AxiosPromise<T> => {
    logRes(statusCode, statusText, data);
    return Promise.resolve({
        data,
        status: statusCode,
        statusText: statusText,
        config: {} as any,
        headers: {},
        request: {}
    }) as AxiosPromise<T>;
};
const rejectResponse = <T>(data: T, statusCode: number = 400, statusText: string = ''): AxiosPromise<T> => {
    return Promise.reject({
        data,
        status: statusCode,
        statusText: statusText,
        config: {} as any,
        headers: {},
        request: {}
    });
};

const log = (method: string, url: string, data?: any) => {
    if (!LOG_REQUESTS) {
        return;
    }
    const hasData = Array.isArray(data) ? data.length > 0 : !!data;
    if (hasData) {
        console.log(`[${method}]: ${url}`, data);
    } else {
        console.log(`[${method}]: ${url}`);
    }
};

const logRes = (statusCode: number, statusText: string, data?: any) => {
    if (!LOG_REQUESTS) {
        return;
    }
    if (statusText) {
        console.log(`     [${statusCode}] ${statusText}`, data);
    } else {
        console.log('    ', data);
    }
};

const urlParts = (urlPath: string) => {
    const [path, urlQuery] = urlPath.split('?');
    const query = new URLSearchParams(urlQuery);
    const [_, model, id, ...parts] = path!.split('/');
    return {
        query,
        model,
        id,
        parts
    };
};

export default class OfflineApi {
    dbAdapter: DbAdapter;
    interceptors = {
        request: {
            clear: () => console.log('offline api: clear interceptors'),
            use: (onFulfilled: any, onRejected: any) => {}
        },
        response: {
            clear: () => console.log('offline api: clear interceptors'),
            use: (onFulfilled: any, onRejected: any) => {}
        }
    };
    constructor(mode: boolean | 'memory' | 'indexedDB') {
        if (mode === 'indexedDB' && ExecutionEnvironment.canUseDOM) {
            try {
                this.dbAdapter = new IndexedDbAdapter(DB_NAME, true);
            } catch (error) {
                console.error('Failed to initialize IndexedDB:', error);
                this.dbAdapter = new MemoryDbAdapter();
            }
        } else {
            console.log('setup memory adapter');
            this.dbAdapter = new MemoryDbAdapter();
        }
        if (LOG_REQUESTS) {
            console.log('OfflineApi: created');
        }
    }

    get mode() {
        return this.dbAdapter.mode;
    }

    async documentsBy<T extends DocumentType = any>(
        documentRootId: string | null | undefined
    ): Promise<Document<T>[]> {
        if (!documentRootId) {
            return Promise.resolve([]);
        }
        return (await this.dbAdapter.byDocumentRootId<T>(documentRootId)).map(cleanDocument);
    }

    private async createDocumentRecord<Type extends DocumentType>(
        data: Partial<Document<Type>>,
        onBehalfOf: boolean
    ): Promise<{ document: Document<Type>; exists: boolean }> {
        const actor = OfflineUser.getUser();
        const authorId = onBehalfOf ? (data.authorId ?? actor.id) : actor.id;
        if (authorId !== actor.id && actor.role === Role.STUDENT) {
            throw new OfflineDocumentError('Insufficient access permission');
        }
        if (!data.documentRootId || !data.type) {
            throw new OfflineDocumentError('Missing document root or type', 400);
        }
        const now = new Date().toISOString();
        // Client IDs identify requests; the server independently assigns persisted identities.
        const requested = {
            ...data,
            id: uuidv4(),
            authorId,
            createdAt: now,
            updatedAt: now
        } as Document<Type>;
        return this.dbAdapter.withDocumentsTransaction(async (store) => {
            const all = await store.getAll();
            const documents = all.filter((document) => document.documentRootId === requested.documentRootId);
            const existing = documents.find((document) => matchingConstraint(requested, document));
            if (existing) {
                return { document: cleanDocument(existing as Document<Type>), exists: true };
            }
            if (requested.uniqOnRoot === 'main') {
                const legacy = documents.filter(
                    (document) =>
                        sameDocumentScope(document, requested) &&
                        !document.parentId &&
                        document.uniqOnRoot == null
                );
                if (legacy.length > 0) {
                    const consolidated = consolidateDocuments(documents, legacy);
                    const retainedIds = new Set(consolidated.documents.map((document) => document.id));
                    for (const document of documents) {
                        if (!retainedIds.has(document.id)) {
                            await store.delete(document.id);
                        }
                    }
                    let main: Document<Type> | undefined;
                    for (const document of consolidated.documents) {
                        const updated =
                            document.id === consolidated.id ? { ...document, uniqOnRoot: 'main' } : document;
                        await store.put(updated);
                        if (updated.id === consolidated.id) {
                            main = updated as Document<Type>;
                        }
                    }
                    return { document: cleanDocument(main!), exists: true };
                }
            }
            await store.put(requested);
            return { document: cleanDocument(requested), exists: false };
        });
    }

    async upsertDocumentRecord<Type extends DocumentType = DocumentType>(
        data: Partial<Document<Type>>,
        onBehalfOf: boolean = false
    ): Promise<Document<Type>> {
        return (await this.createDocumentRecord(data, onBehalfOf)).document;
    }

    private async documentResponse<T>(work: () => Promise<T>): AxiosPromise<T> {
        try {
            return resolveResponse(await work());
        } catch (error) {
            if (error instanceof OfflineDocumentError) {
                return rejectResponse({ error: error.message } as T, error.status, error.message);
            }
            throw error;
        }
    }

    async upsertStudentGroupRecord(data: Partial<StudentGroup>, _id?: string): Promise<StudentGroup> {
        const id = _id || data.id || uuidv4();
        const studentGroup: StudentGroup = {
            id: id,
            name: 'Offline Group',
            description: 'Offline Group Description',
            userIds: [OfflineUser.getUser().id],
            adminIds: [OfflineUser.getUser().id],
            parentId: null,
            createdAt: TIME_NOW,
            updatedAt: TIME_NOW,
            ...(data as Partial<StudentGroup>)
        } as StudentGroup;

        await this.dbAdapter.put(STUDENT_GROUPS_STORE, studentGroup);
        return studentGroup;
    }

    // Method to handle POST requests
    async post<T = any>(url: string, data: T, ...config: any): AxiosPromise<T> {
        const { model, id, query, parts } = urlParts(url);
        log('post', url, data);
        switch (model) {
            case 'admin':
                if (id === 'export') {
                    const exportedData = await this.dbAdapter
                        .getAll<Document<any>>(DOCUMENTS_STORE)
                        .then((docs) => docs.filter((d) => d.authorId === OfflineUser.getUser().id));
                    const data = {
                        user: OfflineUser.getUser(),
                        documents: exportedData
                    };
                    return resolveResponse(data as unknown as T);
                }
                return resolveResponse(data as unknown as T);
            case 'cms':
                return resolveResponse({} as unknown as T);
            case 'users':
                if (parts.length === 1 && parts[0] === 'documentRoots') {
                    const { documentRootIds, type } = data as {
                        documentRootIds: string[];
                        type?: DocumentType;
                    };
                    if (documentRootIds.length === 0) {
                        resolveResponse([] as unknown as T);
                    }
                    const documentRootDocs = await Promise.all(
                        documentRootIds.map((id) => this.documentsBy(id))
                    );
                    const filteredDocs = type
                        ? documentRootDocs.map((docs) => docs.filter((doc) => doc.type === type))
                        : documentRootDocs;

                    const documenRoots = documentRootIds.map((rid) => {
                        return {
                            id: rid,
                            access: Access.RW_DocumentRoot,
                            sharedAccess: Access.RW_DocumentRoot,
                            userPermissions: [],
                            groupPermissions: [],
                            documents:
                                filteredDocs.find(
                                    (docs) => docs.length > 0 && docs[0].documentRootId === rid
                                ) || []
                        };
                    }) as unknown as T;
                    log('-> post', url, documenRoots);
                    return resolveResponse(documenRoots);
                }
                return resolveResponse([] as unknown as T);
            case 'documents':
                if (url === '/documents/multiple') {
                    const documentRootIds = new Set((data as { documentRootIds: string[] }).documentRootIds);
                    const allDocuments = await this.dbAdapter.getAll<Document<any>>(DOCUMENTS_STORE);

                    const filteredDocuments = allDocuments.filter((doc) =>
                        documentRootIds.has(doc.documentRootId)
                    );
                    log('-> post', url, filteredDocuments);
                    return resolveResponse(filteredDocuments.map(cleanDocument) as unknown as T);
                }
                try {
                    const result = await this.createDocumentRecord(
                        data as Partial<Document<DocumentType>>,
                        query.get('onBehalfOf') === 'true'
                    );
                    return resolveResponse(result.document as unknown as T, result.exists ? 200 : 201);
                } catch (error) {
                    if (error instanceof OfflineDocumentError) {
                        return rejectResponse({ error: error.message } as T, error.status, error.message);
                    }
                    throw error;
                }
            case 'documentRoots':
                if (id === 'permissions') {
                    const permissions = (data as { documentRootIds: string[] }).documentRootIds.map(
                        (id: string) => {
                            return {
                                id: id,
                                access: Access.RW_DocumentRoot,
                                sharedAccess: Access.None_DocumentRoot,
                                userPermissions: [],
                                groupPermissions: []
                            } satisfies Permissions;
                        }
                    );
                    return resolveResponse(permissions as unknown as T);
                }
                return resolveResponse({
                    access: (data as DocumentRoot).access ?? Access.RW_DocumentRoot,
                    sharedAccess: (data as DocumentRoot).sharedAccess ?? Access.RW_DocumentRoot,
                    userPermissions: [],
                    groupPermissions: [],
                    documents: [], //documentsBy(id), // Fetching is only on GET/PUT, avoid circular dependency
                    id: id
                } as DocumentRoot as unknown as T);
            case 'permissions':
                if (id === 'user') {
                    const userPermission: UserPermission = {
                        id: uuidv4(),
                        ...(data as Omit<UserPermission, 'id'>)
                    };
                    await this.dbAdapter.put(PERMISSIONS_STORE, userPermission);
                    return resolveResponse(userPermission as unknown as T);
                }
                const groupPermission: GroupPermission = {
                    id: uuidv4(),
                    ...(data as Omit<GroupPermission, 'id'>)
                };
                await this.dbAdapter.put(PERMISSIONS_STORE, groupPermission);
                return resolveResponse(groupPermission as unknown as T);
            case 'studentGroups':
                if (!id) {
                    return resolveResponse(
                        (await this.upsertStudentGroupRecord(data as Partial<StudentGroup>)) as unknown as T
                    );
                }
        }
        return resolveResponse(data as unknown as T);
    }

    // Method to handle GET requests
    async get<T = any>(url: string, ...config: any): AxiosPromise<T | null> {
        const { model, id, query, parts } = urlParts(url);
        log('get', url, parts);

        switch (model) {
            case 'user':
                return resolveResponse(OfflineUser.getUser() as unknown as T);
            case 'admin':
                return resolveResponse([] as unknown as T);
            case 'allowedActions':
                return resolveResponse([] as unknown as T);
            case 'documents':
                if (id) {
                    const document = await this.dbAdapter.get<Document<any>>(DOCUMENTS_STORE, id);
                    if (document) {
                        return resolveResponse(cleanDocument(document) as unknown as T);
                    }
                    return resolveResponse(null);
                }
                // TODO: is this needed/used at all?
                if (query.has('ids')) {
                    const ids = query.getAll('ids');
                    const filteredDocuments: Document<any>[] = [];
                    for (const docId of ids) {
                        const doc = await this.dbAdapter.get<Document<any>>(DOCUMENTS_STORE, docId);
                        if (doc) {
                            filteredDocuments.push(doc);
                        }
                    }
                    return resolveResponse(filteredDocuments.map(cleanDocument) as unknown as T);
                }

                return resolveResponse(
                    (await this.dbAdapter.getAll<Document<any>>(DOCUMENTS_STORE)).map(
                        cleanDocument
                    ) as unknown as T
                );
            case 'users':
                return resolveResponse([OfflineUser.getUser()] as unknown as T);
            case 'documentRoots':
                if (parts[0] === 'permissions') {
                    return resolveResponse({
                        id: id,
                        access: Access.RW_DocumentRoot,
                        sharedAccess: Access.None_DocumentRoot,
                        groupPermissions: [],
                        userPermissions: []
                    } satisfies Permissions as unknown as T);
                }
                if (id) {
                    return resolveResponse({
                        id: id,
                        access: Access.RW_DocumentRoot,
                        sharedAccess: Access.RW_DocumentRoot,
                        userPermissions: [],
                        groupPermissions: [],
                        documents: [] //documentsBy(id) // fetching documents happens on document endpoint
                    } satisfies DocumentRoot) as unknown as AxiosPromise<T>;
                }

                const ids = query.getAll('ids');
                if (ids.length > 0) {
                    const roots = await Promise.all(
                        ids.map(async (id) => {
                            const documents = await this.documentsBy(id);
                            return {
                                id: id,
                                access: Access.RW_DocumentRoot,
                                sharedAccess: Access.RW_DocumentRoot,
                                userPermissions: [],
                                groupPermissions: [],
                                documents: documents as Document<any>[]
                            } satisfies DocumentRoot;
                        })
                    );
                    return resolveResponse(roots as unknown as T);
                }
                return resolveResponse([] as unknown as T);
            case 'studentGroups':
                return resolveResponse(
                    (await this.dbAdapter.getAll<StudentGroup>(STUDENT_GROUPS_STORE)) as unknown as T
                );
            case 'cms':
                return resolveResponse({} as unknown as T);
        }
        return resolveResponse(null);
    }

    // Method to handle PUT requests
    async put<T = any>(url: string, data: Partial<T>, ...config: any): AxiosPromise<T | null> {
        const { model, id, parts } = urlParts(url);
        log('put', url, data);

        switch (model) {
            case 'documents':
                return this.documentResponse(async () => {
                    const updated = await this.dbAdapter.withDocumentsTransaction(async (store) => {
                        const document = await store.get(id);
                        if (!document) {
                            throw new OfflineDocumentError('Document not found', 404);
                        }
                        let changes: Partial<Document<DocumentType>>;
                        if (parts[0] === 'constraints') {
                            if (document.authorId !== OfflineUser.getUser().id) {
                                throw new OfflineDocumentError('Not authorized');
                            }
                            const input = (data as { data?: UniquenessConstraints }).data;
                            const constraints: UniquenessConstraints = {};
                            for (const key of ['uniqOnRoot', 'uniqOnParent'] as const) {
                                const value = input?.[key];
                                if (value === null || (typeof value === 'string' && value.length > 0)) {
                                    constraints[key] = value;
                                }
                            }
                            if (Object.keys(constraints).length === 0) {
                                throw new OfflineDocumentError('No valid constraints to update');
                            }
                            changes = constraints;
                        } else if (parts[0] === 'linkTo') {
                            const parent = await store.get(parts[1]);
                            if (!parent || parent.documentRootId !== document.documentRootId) {
                                throw new OfflineDocumentError('Parent document not found', 404);
                            }
                            changes = { parentId: parent.id };
                        } else {
                            changes = {
                                data: (data as Partial<Document<DocumentType>>).data ?? document.data
                            };
                        }
                        const result = { ...document, ...changes, updatedAt: new Date().toISOString() };
                        assertUniqueDocument(await store.getAll(), result);
                        await store.put(result);
                        return cleanDocument(result);
                    });
                    return updated as unknown as T;
                });

            case 'permissions':
                return rejectResponse({} as T, 400, 'Not implemented');
            case 'studentGroups':
                return resolveResponse(
                    (await this.upsertStudentGroupRecord(
                        (data as unknown as { data: Partial<StudentGroup> }).data,
                        id
                    )) as unknown as T
                );
            case 'users':
                return resolveResponse(data as unknown as T);
        }
        return resolveResponse(null);
    }

    async delete<T = any>(url: string, ...config: any): AxiosPromise<T | null> {
        log('delete', url);
        const { model, id } = urlParts(url);

        switch (model) {
            case 'documents':
                await this.dbAdapter.withDocumentsTransaction(async (store) => {
                    const documents = await store.getAll();
                    const retained = new Set(
                        deleteDocumentTree(documents, [id]).map((document) => document.id)
                    );
                    for (const document of documents) {
                        if (!retained.has(document.id)) {
                            await store.delete(document.id);
                        }
                    }
                });
                return resolveResponse(null);
            case 'documentRoots':
                await this.dbAdapter.withDocumentsTransaction(async (store) => {
                    for (const document of await store.getAll()) {
                        if (document.documentRootId === id) {
                            await store.delete(document.id);
                        }
                    }
                });
                return resolveResponse(null);
            case 'permissions':
                await this.dbAdapter.delete(PERMISSIONS_STORE, id);
                return resolveResponse(null);
            case 'studentGroups':
                await this.dbAdapter.delete(STUDENT_GROUPS_STORE, id);
                return resolveResponse(null);
        }
        return rejectResponse({} as T, 400, 'Not implemented');
    }

    async destroyDb(): Promise<void> {
        if (LOG_REQUESTS) {
            console.log('OfflineApi: destroy');
        }
        await this.dbAdapter.destroyDb();
    }
}
