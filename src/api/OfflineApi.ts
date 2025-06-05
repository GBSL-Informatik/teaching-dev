import { AxiosPromise } from 'axios';
import { Role, User } from './user';
import { Access, Document } from './document';
import { v4 as uuidv4 } from 'uuid';
import { DocumentRoot } from './documentRoot';
import { GroupPermission, Permissions, UserPermission } from './permission';
import { StudentGroup } from './studentGroup';
import { AiTemplate } from './admin';

const TIME_NOW = new Date().toISOString();
const LOG_REQUESTS = true;

let OfflineUser: User = {
    id: 'c23c0238-4aeb-457f-9a2c-3d2d5d8931c0',
    email: 'offline.user@tdev.ch',
    firstName: 'Offline',
    lastName: 'User',
    role: Role.ADMIN,
    createdAt: TIME_NOW,
    updatedAt: TIME_NOW
};

const documents: Map<string, Document<any>> = new Map();

const documentsBy = (documentRootId?: string) => {
    if (!documentRootId) {
        return [];
    }
    return Array.from(documents.values()).filter((doc) => doc.documentRootId === documentRootId);
};

const resolveResponse = <T>(data: T, statusCode: number = 200, statusText: string = ''): AxiosPromise<T> => {
    return Promise.resolve({
        data,
        status: statusCode,
        statusText: statusText,
        config: {} as any,
        headers: {},
        request: {}
    });
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

const upsertDocumentRecord = (data: Partial<Document<any>>, _rootId?: string): Document<any> => {
    const rootId = _rootId || data.documentRootId || uuidv4();
    const tNow = new Date().toISOString();
    return {
        createdAt: tNow,
        updatedAt: tNow,
        authorId: OfflineUser.id,
        documentRootId: rootId,
        id: uuidv4(),
        ...data
    } as Document<any>;
};

const upsertStudentGroupRecord = (data: Partial<StudentGroup>, _id?: string): StudentGroup => {
    const id = _id || data.id || uuidv4();
    return {
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
};

const upsertAiTemplateRecord = (data: Partial<AiTemplate>, _id?: string): AiTemplate => {
    const id = _id || data.id || uuidv4();
    console.log('id', _id, data.id, id);
    return {
        id: id,
        name: 'Offline Template',
        description: 'Offline Template Description',
        content: 'This is an offline template content.',
        createdAt: TIME_NOW,
        updatedAt: TIME_NOW,
        authorId: OfflineUser.id,
        ...data
    } as AiTemplate;
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
    constructor() {
        if (LOG_REQUESTS) {
            console.log('OfflineApi: created');
        }
    }
    // Method to handle POST requests
    async post<T = any>(url: string, data: T, ...config: any): AxiosPromise<T> {
        const { model, id } = urlParts(url);
        log('post', url, data);
        switch (model) {
            case 'admin':
                if (url.startsWith('/admin/aiTemplates')) {
                    const template = upsertAiTemplateRecord(data as Partial<AiTemplate>);
                    return resolveResponse(template as unknown as T);
                }
                return resolveResponse(data as unknown as T);
            case 'cms':
                return resolveResponse({} as unknown as T);
            case 'documents':
                const rootId = (data as Partial<Document<any>>).documentRootId;
                const document = upsertDocumentRecord(data as Partial<Document<any>>, rootId);

                documents.set(document.id, document);
                return resolveResponse(document as unknown as T);
            case 'documentRoots':
                return resolveResponse({
                    access: Access.RW_DocumentRoot,
                    sharedAccess: Access.RW_DocumentRoot,
                    userPermissions: [],
                    groupPermissions: [],
                    documents: documentsBy(id),
                    id: id
                } as DocumentRoot as unknown as T);
            case 'permissions':
                if (id === 'user') {
                    return resolveResponse({
                        id: uuidv4(),
                        ...(data as Omit<UserPermission, 'id'>)
                    } as T);
                }
                return resolveResponse({
                    id: uuidv4(),
                    ...(data as Omit<GroupPermission, 'id'>)
                } as T);
            case 'studentGroups':
                if (!id) {
                    return resolveResponse(
                        upsertStudentGroupRecord(data as Partial<StudentGroup>) as unknown as T
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
                return resolveResponse([OfflineUser] as unknown as T);
            case 'admin':
                return resolveResponse([] as unknown as T);
            case 'allowedActions':
                return resolveResponse([] as unknown as T);
            case 'checklogin':
                return resolveResponse({ user: OfflineUser } as unknown as T, 200, 'ok');
            case 'documents':
                if (id) {
                    if (documents.has(id)) {
                        return resolveResponse(documents.get(id) as unknown as T);
                    }
                    return resolveResponse(null);
                }
                if (query.has('ids')) {
                    const ids = query.getAll('ids');
                    const filteredDocuments = ids
                        .map((id) => documents.get(id))
                        .filter((doc) => doc !== undefined);
                    return resolveResponse(filteredDocuments as unknown as T);
                }
                if (query.has('rids')) {
                    const rids = query.getAll('rids');
                    const filteredDocuments = rids
                        .flatMap((id) => documentsBy(id))
                        .filter((doc) => doc !== undefined);
                    return resolveResponse(filteredDocuments as unknown as T);
                }
                return resolveResponse(Array.from(documents.values()).flat() as unknown as T);
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
                        documents: documentsBy(id)
                    } satisfies DocumentRoot) as unknown as AxiosPromise<T>;
                }
                const ids = query.getAll('ids');
                if (ids.length > 0) {
                    const roots = ids.map((id) => {
                        return {
                            id: id,
                            access: Access.RW_DocumentRoot,
                            sharedAccess: Access.RW_DocumentRoot,
                            userPermissions: [],
                            groupPermissions: [],
                            documents: documentsBy(id)
                        } satisfies DocumentRoot;
                    });
                    return resolveResponse(roots as unknown as T);
                }
                return resolveResponse([] as unknown as T);
            case 'studentGroups':
                return resolveResponse([] as unknown as T);
            case 'cms':
                return resolveResponse({} as unknown as T);
            case 'aiTemplates':
                return resolveResponse([] as unknown as T);
        }
        return resolveResponse(null);
    }

    // Method to handle PUT requests
    async put<T = any>(url: string, data: Partial<T>, ...config: any): AxiosPromise<T | null> {
        const { model, id, parts } = urlParts(url);
        log('put', url, data);
        switch (model) {
            case 'documents':
                if (documents.has(id)) {
                    const document = documents.get(id)!;
                    if (parts[0] === 'linkTo') {
                        documents.set(id, {
                            ...document,
                            documentRootId: parts[1],
                            updatedAt: new Date().toISOString()
                        });
                    } else {
                        documents.set(id, {
                            ...document,
                            ...(data as Partial<Document<any>>),
                            updatedAt: new Date().toISOString()
                        });
                    }
                    return resolveResponse(documents.get(id) as unknown as T);
                }

            case 'permissions':
                return rejectResponse({} as T, 400, 'Not implemented');
            case 'studentGroups':
                return resolveResponse(
                    upsertStudentGroupRecord(data as Partial<StudentGroup>, id) as unknown as T
                );
            case 'users':
                return resolveResponse(data as unknown as T);
        }
        return resolveResponse(null);
    }

    async delete<T = any>(url: string, ...config: any): AxiosPromise<T | null> {
        log('delete', url);
        return rejectResponse({} as T, 400, 'Not implemented');
    }
}
