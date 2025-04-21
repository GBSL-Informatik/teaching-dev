---
page_id: ee0249eb-8a56-44c0-875c-62cbbed2f0c4
---
# Chapter 6: Database Schema

In the preceding chapters, we've dissected the core entities of the `teaching-project`—the [User](01_user_.md), the [Document](02_document_.md), the [Document Root](03_document_root_.md), and the [Student Group](04_student_group_.md)—and explored how [Access Policy & Permissions](05_access_policy___permissions_.md) govern their interactions. These layers build upon a fundamental structure: the **Database Schema**.

The database schema is the definitive blueprint specifying how all application data is organized, what properties each piece of data has, and critically, how different pieces of data relate to one another. It serves as the contract between the application's backend logic and the persistent data store.

Consider the simple need to store a user's name and email. The schema defines that there's a `users` table, which column holds the email (`email`), which holds the first name (`first_name`), and that the email column must be unique across all records. For experienced developers, this shifts the focus from *how* data is modeled conceptually to *how* it is physically structured and managed in a relational database.

## Concept

The database schema in `teaching-project` is defined using the Prisma Schema Language. This language provides a declarative way to model data, which is then used by the Prisma ORM to generate database migrations (DDL scripts) and a type-safe database client.

Key elements of the schema definition:

*   **Models:** Represent tables in the database. Each field in a model corresponds to a column. Directives like `@id`, `@unique`, `@default`, `@map`, `@db.*` define column constraints, default values, and database-specific types/mappings.
*   **Relationships:** Defined using model names as types (e.g., `User`), array notation for one-to-many (`User[]`), and optional fields for one-to-one or one-to-many relationships (`DocumentRoot?`). The `@relation` directive specifies the linking fields (`fields`) and target fields (`references`) and can define foreign key constraints (`onDelete`). Prisma manages the actual join table for many-to-many relationships unless explicitly modeled.
*   **Enums:** Define a fixed set of allowed values, like the `Access` levels used for permissions.
*   **Views:** The schema includes definitions (`view`) mirroring SQL views created directly in the database. These are primarily used for querying complex relationships efficiently, particularly for permission lookups involving users, groups, documents, and document roots. Prisma allows querying these views as if they were models.
*   **Data Source & Generator:** Configures the database connection (`datasource`) and the Prisma Client generator (`generator`).

## Structure and Relationships

The core of the schema is defined in `teaching-api/prisma/schema.prisma`. Let's examine key parts.

```prisma
// teaching-api\prisma\schema.prisma

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pg_trgm, pgcrypto] // Include PostgreSQL extensions like pg_trgm (for similarity search) and pgcrypto (for gen_random_uuid)
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "views", "relationJoins"]
}

// Defines the permission levels as discussed in Chapter 5
enum Access {
  RO_DocumentRoot
  RW_DocumentRoot
  None_DocumentRoot
  RO_StudentGroup
  RW_StudentGroup
  None_StudentGroup
  RO_User
  RW_User
  None_User
}
```

The `datasource` block configures the connection to PostgreSQL and enables specific extensions useful for the project. The `generator` block configures the Prisma Client and enables relevant features. The `enum Access` definition maps directly to a database enum type.

Next, the models representing the core entities:

```prisma
// teaching-api\prisma\schema.prisma (Core Models)

model User {
  id                              String                            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid // UUID primary key with default generation
  email                           String                            @unique // Enforce unique emails at the DB level
  firstName                       String                            @map("first_name") // Map model field to snake_case column
  lastName                        String                            @map("last_name")
  isAdmin                         Boolean                           @default(false) @map("is_admin")
  createdAt                       DateTime                          @default(now()) @map("created_at")
  updatedAt                       DateTime                          @default(now()) @updatedAt @map("updated_at") // Automatically managed timestamp
  documents                       Document[]                        @relation("documents") // One-to-many: User authors many Documents
  rootUserPermissions             RootUserPermission[]              @relation("root_user_to_user_permission") // One-to-many: User can have many direct permissions on roots
  studentGroups                   StudentGroup[]                    @relation("StudentGroupToUser") // Many-to-many join table handled by Prisma implicitly
  // Links to views for performance
  view_DocumentUserPermissions    view_DocumentUserPermissions[]
  view_AllDocumentUserPermissions view_AllDocumentUserPermissions[]
  cmsSettings                     CmsSettings? // One-to-one optional relation

  @@map("users") // Map model name to database table name
}

model DocumentRoot {
  id                              String                            @id @db.Uuid // UUID primary key
  access                          Access                            @default(RW_DocumentRoot) // Default access level (enum)
  sharedAccess                    Access                            @default(None_DocumentRoot) @map("shared_access")
  documents                       Document[]                        @relation("documents") // One-to-many: Root contains many Documents
  rootGroupPermissions            RootGroupPermission[]             @relation("root_group_to_document_root_permission") // One-to-many: Root can have many group permissions
  rootUserPermissions             RootUserPermission[]              @relation("root_user_to_document_root_permission") // One-to-many: Root can have many user permissions
  // Links to views for performance
  view_DocumentUserPermissions    view_DocumentUserPermissions[]
  view_AllDocumentUserPermissions view_AllDocumentUserPermissions[]

  @@index([id], map: "document_root_id_index")
  @@map("document_roots")
}

model StudentGroup {
  id                              String                            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                            String                            @default("")
  description                     String                            @default("")
  parentId                        String?                           @map("parent_id") @db.Uuid // Optional self-referential parent
  createdAt                       DateTime                          @default(now()) @map("created_at")
  updatedAt                       DateTime                          @default(now()) @updatedAt @map("updated_at")
  rootGroupPermissions            RootGroupPermission[]             @relation("root_group_to_student_group_permission") // One-to-many: Group can have many root permissions
  parent                          StudentGroup?                     @relation("parent_student_group", fields: [parentId], references: [id], onDelete: Cascade) // Self-referential relation
  children                        StudentGroup[]                    @relation("parent_student_group") // Reverse relation
  users                           User[]                            @relation("StudentGroupToUser") // Many-to-many: Group has many users
  // Links to views for performance
  view_DocumentUserPermissions    view_DocumentUserPermissions[]
  view_AllDocumentUserPermissions view_AllDocumentUserPermissions[]

  @@map("student_groups")
}

model Document {
  id               String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  authorId         String     @map("author_id") @db.Uuid
  type             String
  data             Json // PostgreSQL specific Json type
  parentId         String?    @map("parent_id") @db.Uuid // Optional self-referential parent (e.g. for files/dirs)
  documentRootId   String     @map("document_root_id") @db.Uuid
  createdAt        DateTime   @default(now()) @map("created_at")
  updatedAt        DateTime   @default(now()) @updatedAt @map("updated_at")
  author         User         @relation("documents", fields: [authorId], references: [id], onDelete: Cascade) // Defines foreign key constraint to User
  documentRoot   DocumentRoot @relation("documents", fields: [documentRootId], references: [id], onDelete: Cascade) // To DocumentRoot
  parent         Document?    @relation("connected_documents", fields: [parentId], references: [id], onDelete: Cascade) // To parent Document
  children       Document[]   @relation("connected_documents") // Reverse relation
  // Links to views for performance
  view_DocumentUserPermissions    view_DocumentUserPermissions[]
  view_AllDocumentUserPermissions view_AllDocumentUserPermissions[]

  @@index([authorId], map: "document_author_id_index") // Database index for authorId lookup
  @@map("documents")
}
```

These model definitions illustrate how standard relational database concepts (tables, columns, types like `String`, `Boolean`, `DateTime`, `Json`, UUIDs via `@db.Uuid`, foreign keys via `@relation`, indexes via `@@index`, table naming via `@@map`) are expressed in Prisma Schema Language tailored for PostgreSQL (`provider = "postgresql"`). The relationships defined here (`@relation`) are fundamental for how the application's backend models ([Chapter 1-5](#chapter-1-user)--[Chapter 5-access-policy-permissions](#chapter-5-access-policy--permissions)) interact with the database using Prisma Client.

The explicit permission link tables:

```prisma
// teaching-api\prisma\schema.prisma (Permissions Models)

model RootGroupPermission {
  id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  access       Access // Enum type
  studentGroupId String     @map("student_group_id") @db.Uuid
  documentRootId String     @map("document_root_id") @db.Uuid
  documentRoot DocumentRoot @relation("root_group_to_document_root_permission", fields: [documentRootId], references: [id], onDelete: Cascade) // Foreign key to DocumentRoot
  studentGroup StudentGroup @relation("root_group_to_student_group_permission", fields: [studentGroupId], references: [id], onDelete: Cascade)   // Foreign key to StudentGroup

  @@map("root_group_permissions")
}

model RootUserPermission {
  id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  access       Access // Enum type
  userId         String     @map("user_id") @db.Uuid
  documentRootId String     @map("document_root_id") @db.Uuid
  documentRoot DocumentRoot @relation("root_user_to_document_root_permission", fields: [documentRootId], references: [id], onDelete: Cascade) // Foreign key to DocumentRoot
  user         User         @relation("root_user_to_user_permission", fields: [userId], references: [id], onDelete: Cascade) // Foreign key to User

  @@index([documentRootId], map: "root_user_permissions_document_root_id_index")
  @@index([userId], map: "root_user_permissions_user_id_index")
  @@map("root_user_permissions")
}
```

These join tables clearly define the many-to-many relationships between [`DocumentRoot`](03_document_root_.md) and [`StudentGroup`](04_student_group_.md) (`RootGroupPermission`) and between [`DocumentRoot`](03_document_root_.md) and [`User`](01_user_.md) (`RootUserPermission`), carrying the `access` level as an attribute of the relationship itself. This structure directly supports the [Access Policy & Permissions](05_access_policy___permissions_.md) logic.

Finally, the views defined in the schema:

```prisma
// teaching-api\prisma\schema.prisma (Views)

// This view denormalizes permissions to show effective access for each user on each document
// It's complex SQL under the hood, joining users, groups, group memberships,
// document roots, documents, and permissions to determine the highest permission rank
// for every user-document pair.
view view_AllDocumentUserPermissions {
  documentRootId        String               @map("document_root_id") @db.Uuid
  userId                String               @map("user_id") @db.Uuid
  access                Access               @map("access") // The calculated effective access
  documentId            String               @map("document_id") @db.Uuid
  accessRank            Int                  @map("access_rank") // Numerical rank for highest-wins logic

  // Relations defined *on the view* allow navigating from the view results in Prisma queries
  documentRoot          DocumentRoot         @relation(fields: [documentRootId], references: [id])
  user                  User                 @relation(fields: [userId], references: [id])
  document              Document             @relation(fields: [documentId], references: [id])
  rootUserPermission    RootUserPermission?  @relation(fields: [rootUserPermissionId], references: [id])
  rootGroupPermission   RootGroupPermission? @relation(fields: [rootGroupPermissionId], references: [id])
  group                 StudentGroup?        @relation(fields: [groupId], references: [id])

  @@unique([documentRootId, userId, documentId, accessRank]) // Ensure unique rows
  @@map("view__all_document_user_permissions") // Map view name
}

// This view filters view_AllDocumentUserPermissions to return only the *single* highest permission
// for each user-document pair. This is the most commonly used view for permission checks.
view view_DocumentUserPermissions {
  documentRootId        String               @map("document_root_id") @db.Uuid
  userId                String               @map("user_id") @db.Uuid
  access                Access               @map("access") // The final highest access
  documentId            String               @map("document_id") @db.Uuid

  // Relations linked back to base tables
  documentRoot          DocumentRoot         @relation(fields: [documentRootId], references: [id])
  user                  User                 @relation(fields: [userId], references: [id])
  document              Document             @relation(fields: [documentId], references: [id])
  rootUserPermission    RootUserPermission?  @relation(fields: [rootUserPermissionId], references: [id])
  rootGroupPermission   RootGroupPermission? @relation(fields: [rootGroupPermissionId], references: [id])
  group                 StudentGroup?        @relation(fields: [groupId], references: [id])

  @@unique([documentRootId, userId, access, documentId])
  @@map("view__document_user_permissions")
}

// View optimized for fetching DocumentRoots relevant to a specific user,
// including summarized permission data and potentially linked documents.
view view_UsersDocuments {
  userId           String @map("user_id") @db.Uuid
  id               String @db.Uuid // DocumentRoot ID
  access           Access // Calculated access on the root itself
  sharedAccess     Access @map("shared_access") // Shared access on the root
  groupPermissions Json // Aggregated group permissions for this user on this root
  userPermissions  Json // Aggregated user permissions for this user on this root
  documents        Json // Aggregated documents within this root relevant to this user

  @@unique([id, userId])
  @@map("view__users_documents")
}

```

These `view` definitions in Prisma reflect actual database views. They are complex SQL queries defined separately in migration files but represented in the schema to make them queryable via Prisma Client. `view_DocumentUserPermissions` is particularly important, providing a pre-calculated lookup for the effective access level of *any* user on *any* document, significantly optimizing permission checks compared to recalculating this with complex joins on every request. `view_UsersDocuments` is optimized for fetching a set of `DocumentRoot`s *for a specific user*, including related data, to power parts of the frontend UI like the `DocumentRootStore` loading logic.

## Schema Management (Migrations)

Changes to the schema (adding models, fields, relations, etc.) require updating the database structure. Prisma handles this via migrations. When the `schema.prisma` file is modified, the command `npx prisma migrate dev` compares the schema to the current database state and generates a sequence of SQL files (migrations) to apply the changes. These migrations are versioned and applied sequentially in different environments.

For instance, adding a new column or a `view` definition would trigger a migration generation that includes the necessary `ALTER TABLE` or `CREATE VIEW` SQL statements.

The `prisma/reset.ts` script provides a utility to drop all tables and types owned by the database user, useful for starting clean in development or testing environments. This bypasses the migration history.

```typescript
// teaching-api\prisma\reset.ts (Simplified)
import { Prisma } from '@prisma/client';
import prisma from '../src/prisma';

async function main() {
    const { DATABASE_URL } = process.env;
    const user = DATABASE_URL?.split(':')[1].split('//')[1]; // Extract database user
    const dropTableSql = await prisma.$queryRaw<{ query: string }[]>(
        Prisma.sql`... SQL to find and drop tables ... WHERE tableowner = ${user};` // SQL query to get drop table commands
    );
    // Execute drop table commands
    for (let i = 0; i < dropTableSql.length; i++) {
        await prisma.$queryRawUnsafe(dropTableSql[i].query);
        console.log(`Dropped table ...`);
    }
    const dropTypeSql = await prisma.$queryRaw<{ query: string }[]>(
        Prisma.sql`... SQL to find and drop types ... WHERE typowner = (SELECT usesysid FROM pg_user WHERE usename = ${user}) ...` // SQL query to get drop type commands (including enums)
    );
     // Execute drop type commands
    for (let i = 0; i < dropTypeSql.length; i++) {
        await prisma.$queryRawUnsafe(dropTypeSql[i].query);
        console.log(`Dropped type ...`);
    }
}
// ... main() execution and cleanup ...
```
This script uses Prisma's `$queryRaw` or `$queryRawUnsafe` (to execute raw SQL) to query the database's metadata tables (like `pg_tables`, `pg_type`) and programmatically generate and execute `DROP TABLE` and `DROP TYPE` statements. This is a destructive operation used carefully.

## Internal Implementation (Prisma Client Interaction)

The application backend (`teaching-api/src/models`) interacts with the database via generated Prisma Client (`@prisma/client`). The schema definition is compiled by Prisma into this client, providing type-safe access to the models, their fields, and their relationships.

The Prisma Client instance is typically initialized once:

```typescript
// teaching-api\src\prisma.ts (Simplified)
import { Prisma, PrismaClient } from '@prisma/client';

const options: Prisma.PrismaClientOptions & { /* ... log options ... */ } = {} as any;
if (process.env.LOG) {
    options.log = [
        { emit: 'event', level: 'query' }, // Log all queries
        // ... other log levels
    ];
}
const prisma = new PrismaClient(options); // Instantiate client
prisma.$connect(); // Explicitly connect

if (process.env.LOG) {
    prisma.$on('query', (e) => { // Listen for query events if logging is enabled
        console.log(`Query: ${e.query}; ${e.params.slice(0, 120)}; -- ${e.duration}ms`);
    });
}

export default prisma; // Export the client instance
```
This setup in `prisma.ts` creates a single Prisma Client instance (`prisma`) used throughout the backend models. The `$on('query', ...)` listener is a powerful debugging tool to see the actual SQL being executed by Prisma.

Backend model code uses this `prisma` instance to perform CRUD operations. The schema directly dictates the available methods and the structure of the data.

Fetching a user by ID:

```typescript
// teaching-api\src\models\User.ts (Simplified)
// ... imports ...
import prisma from '../prisma'; // Import the client instance

function User(db: PrismaClient['user']) { // Model function receives the specific client delegate
    return Object.assign(db, {
        async findModel(id: string): Promise<DbUser | null> {
            // Uses findUnique method provided by Prisma Client based on schema definition
            return db.findUnique({ where: { id } });
        },
        // ... other methods ...
    });
}

export default User(prisma.user); // Initialize with the 'user' delegate
```
The `findModel` method wraps the Prisma Client's auto-generated `db.findUnique`. Prisma Client provides methods like `findUnique`, `findMany`, `create`, `update`, `delete` for each model defined in the schema.

Creating a new document:

```typescript
// teaching-api\src\models\Document.ts (Simplified)
// ... imports ...
import prisma from '../prisma';

function Document(db: PrismaClient['document']) {
    return Object.assign(db, {
       async createModel(
           actor: User, // User performing creation (for authorization)
           data: Pick<Partial<DbDocument>, 'type' | 'data' | 'parentId'>,
           documentRootId: string
       ) {
           // Authorization check...

           // Use the create method with data matching schema fields + foreign keys
           const model = await db.create({
               data: {
                   ...data,
                   authorId: actor.id,       // Set authorId via foreign key field
                   documentRootId: documentRootId // Set documentRootId
               }
           });
           return model;
       },
        // ... other methods ...
    });
}

export default Document(prisma.document);
```
The `createModel` method uses `db.create`, providing `data` that matches the `Document` model's fields, including the foreign key fields `authorId` and `documentRootId` to establish relationships.

Updating a document's data and demonstrating relationship inclusion:

```typescript
// teaching-api\src\models\Document.ts (Simplified updateModel snippet)
async updateModel(actor: User, id: string, docData: JsonObject, _onBehalfOf = false) {
    // Authorization check (calls findModel which includes relations) ...

    // Perform update
    const model = await db.update({
        where: { id: id },
        data: { data: docData }, // Update only the 'data' field
        // Use 'include' to load related DocumentRoot and its permissions for post-update logic (e.g. Socket.IO notification)
        include: {
            documentRoot: {
                 include: {
                      rootGroupPermissions: { select: { access: true, studentGroupId: true } },
                      rootUserPermissions: { select: { access: true, userId: true }}
                 }
            }
        }
    });
    return model; // Returns the updated document object with included relations
}
```
The `updateModel` uses `db.update`. Crucially, the `include` option is used to fetch related `documentRoot` data *along with* the updated document record. This allows the controller to access relationship data (like permissions on the root) without a separate database query, which is necessary for determining which users/groups to notify via Socket.IO. Relationship inclusion (`include`) and selection (`select`) mirror the structure defined in `schema.prisma`.

Querying the `view_UsersDocuments` view:

```typescript
// teaching-api\src\models\DocumentRoot.ts (Simplified findManyModels snippet)
async findManyModels(
    actorId: string,
    ids: string[],
    ignoreMissingRoots: boolean = false
): Promise<ApiDocumentRoot[] | null> {
     // Query the view directly via prisma.view_UsersDocuments
    const documentRoots = (await prisma.view_UsersDocuments.findMany({
        where: {
            id: { in: ids }, // Filter the view results by requested root IDs
            userId: actorId // FILTER THE VIEW BY THE TARGET USER ID
         },
        relationLoadStrategy: 'query' // Hint for Prisma query optimization
    })) as unknown as ApiDocumentRoot[]; // Cast to expected shape based on view's output
    // ... handle missing roots ...
    return documentRoots;
}
```
This snippet shows how a database `view` represented in `schema.prisma` becomes queryable via `prisma.view_UsersDocuments`. Filtering by `userId` directly in the `where` clause is highly efficient because the view is structured to have one row per user-document-permission combination, allowing the database to quickly return only the relevant pre-calculated permissions for the target user.

## Conclusion

The database schema, defined using Prisma Schema Language, is the backbone of the `teaching-project`, dictating the structure and relationships of all persistent data. It models core entities like `User`, `Document`, `DocumentRoot`, and `StudentGroup`, explicitly defines permission links via `RootUserPermission` and `RootGroupPermission`, and leverages database views for performance-critical operations like permission checking. The schema is managed via migrations, and the backend interacts with it through the type-safe Prisma Client, enabling efficient and structured data access that reflects the application's conceptual model. Understanding the schema is key to comprehending the capabilities and constraints of the application's data layer.

The next chapter will explore how data is moved between the frontend and backend, detailing the [API & Network Communication](07_api___network_communication_.md).

[Next Chapter: API & Network Communication](07_api___network_communication_.md)

---

Generated by [AI Codebase Knowledge Builder](https://github.com/The-Pocket/Tutorial-Codebase-Knowledge)
