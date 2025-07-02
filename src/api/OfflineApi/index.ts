import { AxiosPromise } from 'axios';
import { Role, User } from '../user';
import { Access, Document, DocumentType } from '../document';
import { v4 as uuidv4 } from 'uuid';
import { DocumentRoot } from '../documentRoot';
import { GroupPermission, Permissions, UserPermission } from '../permission';
import { StudentGroup } from '../studentGroup';
import { DbAdapter } from './Adapter';
import IndexedDbAdapter from './Adapter/IndexedDb';
import MemoryDbAdapter from './Adapter/MemoryDb';
import siteConfig from '@generated/docusaurus.config';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import _ from 'lodash';

const TIME_NOW = new Date().toISOString();
const LOG_REQUESTS = false;

let OfflineUser: User = {
    id: 'c23c0238-4aeb-457f-9a2c-3d2d5d8931c0',
    email: 'offline.user@tdev.ch',
    firstName: 'Offline',
    lastName: 'User',
    role: process.env.NODE_ENV === 'production' ? Role.STUDENT : Role.ADMIN,
    createdAt: TIME_NOW,
    updatedAt: TIME_NOW
};

const DB_NAME = `${siteConfig.organizationName ?? 'gbsl'}-${siteConfig.projectName ?? 'tdev'}-db`;
const DOCUMENTS_STORE = 'documents';
const STUDENT_GROUPS_STORE = 'studentGroups';
const PERMISSIONS_STORE = 'permissions';

const resolveResponse = <T>(data: T, statusCode: number = 200, statusText: string = ''): AxiosPromise<T> => {
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
    if (LOG_REQUESTS) {
        console.log(`[${method}]: ${url}`, data);
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
                this.dbAdapter = new IndexedDbAdapter(DB_NAME);
            } catch (error) {
                console.error('Failed to initialize IndexedDB:', error);
                this.dbAdapter = new MemoryDbAdapter();
            }
        } else {
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
        return this.dbAdapter.byDocumentRootId<T>(documentRootId);
    }

    async upsertDocumentRecord<T extends DocumentType = any>(
        data: Partial<Document<T>>,
        uniqueMain: boolean = false
    ): Promise<Document<T>> {
        if (uniqueMain) {
            const savedDocuments = await this.documentsBy<T>(data.documentRootId);
            if (savedDocuments.length > 0) {
                const firstByType = savedDocuments.find((doc) => doc.type === data.type);
                if (firstByType) {
                    return firstByType;
                }
            }
        }
        const tNow = new Date().toISOString();
        const document: Document<T> = {
            createdAt: tNow,
            updatedAt: tNow,
            authorId: OfflineUser.id,
            documentRootId: data.documentRootId,
            id: uuidv4(),
            ...data
        } as Document<T>;

        await this.dbAdapter.put(DOCUMENTS_STORE, document);
        return document;
    }

    async upsertStudentGroupRecord(data: Partial<StudentGroup>, _id?: string): Promise<StudentGroup> {
        const id = _id || data.id || uuidv4();
        const studentGroup: StudentGroup = {
            id: id,
            name: 'Offline Group',
            description: 'Offline Group Description',
            userIds: [OfflineUser.id],
            adminIds: [OfflineUser.id],
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
        const { model, id, query } = urlParts(url);
        log('post', url, data);
        switch (model) {
            case 'admin':
                return resolveResponse(data as unknown as T);
            case 'cms':
                return resolveResponse({} as unknown as T);
            case 'documents':
                const document = await this.upsertDocumentRecord<any>(
                    data as Partial<Document<any>>,
                    query.has('uniqueMain')
                );
                return resolveResponse(document as unknown as T);
            case 'documentRoots':
                return resolveResponse({
                    access: Access.RW_DocumentRoot,
                    sharedAccess: Access.RW_DocumentRoot,
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
                return resolveResponse(OfflineUser as unknown as T);
            case 'users':
                if (parts.length === 1 && parts[0] === 'documentRoots') {
                    const ids = query.getAll('ids');
                    if (ids.length === 0) {
                        resolveResponse([] as unknown as T);
                    }
                    const documentRootDocs = await Promise.all(ids.map((id) => this.documentsBy(id)));
                    const documenRoots = documentRootDocs
                        .filter((docs) => docs.length > 0)
                        .map((docs) => ({
                            id: docs[0].documentRootId,
                            access: Access.RW_DocumentRoot,
                            sharedAccess: Access.RW_DocumentRoot,
                            userPermissions: [],
                            groupPermissions: [],
                            documents: docs
                        })) as unknown as T;
                    return resolveResponse(documenRoots);
                }
                return resolveResponse([OfflineUser] as unknown as T);
            case 'admin':
                return resolveResponse([] as unknown as T);
            case 'allowedActions':
                return resolveResponse([] as unknown as T);
            case 'checklogin':
                return resolveResponse({ user: OfflineUser } as unknown as T, 200, 'ok');
            case 'documents':
                if (id) {
                    const document = await this.dbAdapter.get<Document<any>>(DOCUMENTS_STORE, id);
                    if (document) {
                        return resolveResponse(document as unknown as T);
                    }
                    return resolveResponse(null);
                }
                if (query.has('ids')) {
                    const ids = query.getAll('ids');
                    const filteredDocuments: Document<any>[] = [];
                    for (const docId of ids) {
                        const doc = await this.dbAdapter.get<Document<any>>(DOCUMENTS_STORE, docId);
                        if (doc) {
                            filteredDocuments.push(doc);
                        }
                    }
                    return resolveResponse(filteredDocuments as unknown as T);
                }
                if (query.has('rids')) {
                    const rids = query.getAll('rids');
                    console.log('rids', rids);

                    const allDocuments = await this.dbAdapter.getAll<Document<any>>(DOCUMENTS_STORE);

                    const filteredDocuments = allDocuments.filter((doc) => rids.includes(doc.documentRootId));

                    return resolveResponse(filteredDocuments as unknown as T);
                }

                return resolveResponse(
                    (await this.dbAdapter.getAll<Document<any>>(DOCUMENTS_STORE)) as unknown as T
                );
            case 'documentRoots':
                if (parts[0] === 'permissions') {
                    return resolveResponse({
                        id: id,
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
                let document = await this.dbAdapter.get<Document<any>>(DOCUMENTS_STORE, id);
                if (document) {
                    const updatedAt = new Date().toISOString();

                    if (parts[0] === 'linkTo') {
                        document = {
                            ...document,
                            documentRootId: parts[1],
                            updatedAt: updatedAt
                        };
                    } else {
                        document = {
                            ...document,
                            ...(data as Partial<Document<any>>),
                            updatedAt: updatedAt
                        };
                    }
                    await this.dbAdapter.put(DOCUMENTS_STORE, document);

                    return resolveResponse(document as unknown as T);
                }
                return resolveResponse(null); // or rejectResponse if you prefer

            case 'permissions':
                return rejectResponse({} as T, 400, 'Not implemented');
            case 'studentGroups':
                return resolveResponse(
                    (await this.upsertStudentGroupRecord(data as Partial<StudentGroup>, id)) as unknown as T
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
                await this.dbAdapter.delete(DOCUMENTS_STORE, id);
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
