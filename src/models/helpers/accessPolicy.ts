import { Access } from '@tdev-api/document';

/**
 * NOTE: keep in sync with the backend
 */

export const NoneAccess = new Set<Access | undefined>([
    Access.None_DocumentRoot,
    Access.None_User,
    Access.None_StudentGroup
]);
export const RWAccess = new Set<Access | undefined>([
    Access.RW_DocumentRoot,
    Access.RW_User,
    Access.RW_StudentGroup
]);
export const ROAccess = new Set<Access | undefined>([
    Access.RO_DocumentRoot,
    Access.RO_User,
    Access.RO_StudentGroup
]);

export const AccessLevels = new Map<Access, number>([
    [Access.RO_DocumentRoot, 0],
    [Access.RW_DocumentRoot, 1],
    [Access.None_DocumentRoot, 2],
    [Access.RO_StudentGroup, 3],
    [Access.RW_StudentGroup, 4],
    [Access.None_StudentGroup, 5],
    [Access.RO_User, 6],
    [Access.RW_User, 7],
    [Access.None_User, 8]
]);

const AccessLevelsInverse = new Map<number, Access>([
    [0, Access.RO_DocumentRoot],
    [1, Access.RW_DocumentRoot],
    [2, Access.None_DocumentRoot],
    [3, Access.RO_StudentGroup],
    [4, Access.RW_StudentGroup],
    [5, Access.None_StudentGroup],
    [6, Access.RO_User],
    [7, Access.RW_User],
    [8, Access.None_User]
]);

const DocumentRootAccessLevels = new Map<
    Access,
    Access.None_DocumentRoot | Access.RW_DocumentRoot | Access.RO_DocumentRoot
>([
    [Access.None_DocumentRoot, Access.None_DocumentRoot],
    [Access.RW_DocumentRoot, Access.RW_DocumentRoot],
    [Access.RO_DocumentRoot, Access.RO_DocumentRoot],
    [Access.None_StudentGroup, Access.None_DocumentRoot],
    [Access.RW_StudentGroup, Access.RW_DocumentRoot],
    [Access.RO_StudentGroup, Access.RO_DocumentRoot],
    [Access.None_User, Access.None_DocumentRoot],
    [Access.RW_User, Access.RW_DocumentRoot],
    [Access.RO_User, Access.RO_DocumentRoot]
]);

export const asDocumentRootAccess = (access?: Access) => {
    if (!access) {
        return Access.RW_DocumentRoot;
    }
    return AccessLevelsInverse.get(AccessLevels.get(access)! % 3)!;
};

export const asStudentGroupAccess = (access: Access) => {
    return AccessLevelsInverse.get((AccessLevels.get(access)! % 3) + 3)!;
};

export const asUserAccess = (access: Access) => {
    return AccessLevelsInverse.get((AccessLevels.get(access)! % 3) + 6)!;
};

export const highestUserAccess = (permissions: Set<Access>): Access => {
    if (permissions.size === 0) {
        return Access.RO_DocumentRoot;
    }
    return [...permissions].sort((a, b) => AccessLevels.get(b)! - AccessLevels.get(a)!)[0];
};

export const highestAccess = (permissions: Set<Access>, maxAccess?: Access): Access => {
    const userAccess = highestUserAccess(permissions);
    if (!maxAccess) {
        return userAccess;
    }
    if (AccessLevels.get(userAccess)! < AccessLevels.get(maxAccess)!) {
        return userAccess;
    }
    return maxAccess;
};

export const sharedAccess = (userPermission: Access, sharedAccess: Access, isAuthor: boolean): Access => {
    if (isAuthor) {
        return userPermission;
    }
    return highestAccess(
        new Set([DocumentRootAccessLevels.get(sharedAccess)!]),
        DocumentRootAccessLevels.get(userPermission)
    );
};
