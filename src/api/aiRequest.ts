import api from './base';
import { AxiosPromise } from 'axios';
// prisma schema for AiRequest model
// model AiRequest {
//   id     String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
//   user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
//   userId String @map("user_id") @db.Uuid

//   aiTemplate   AiTemplate @relation(fields: [aiTemplateId], references: [id], onDelete: Cascade)
//   aiTemplateId String     @map("ai_template_id") @db.Uuid

//   status     String @default("pending") // pending, completed, failed
//   statusCode Int?   @map("status_code")

//   request  String
//   response Json

//   createdAt DateTime @default(now()) @map("created_at")
//   updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

//   @@map("ai_requests")
// }

export interface AiRequest<T = any> {
    id: string;
    userId: string;
    aiTemplateId: string;
    status: 'pending' | 'completed' | 'failed';
    statusCode?: number;
    request: string;
    response: T;
    createdAt: Date;
    updatedAt: Date;
}

export function createAiRequest<T>(
    aiTemplateId: string,
    request: string,
    signal: AbortSignal
): AxiosPromise<AiRequest<T>> {
    return api.post(`/aiTemplates/${aiTemplateId}/requests`, { request: request }, { signal });
}
export function getAiRequest<T>(
    aiTemplateId: string,
    id: string,
    signal: AbortSignal
): AxiosPromise<AiRequest<T>> {
    return api.get(`/aiTemplates/${aiTemplateId}/requests/${id}`, { signal });
}
export function allAiRequests<T>(aiTemplateId: string, signal: AbortSignal): AxiosPromise<AiRequest<T>[]> {
    return api.get(`/aiTemplates/${aiTemplateId}/requests`, { signal });
}
