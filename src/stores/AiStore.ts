import { action, observable } from 'mobx';
import { RootStore } from '@tdev-stores/rootStore';
import _ from 'lodash';
import { computedFn } from 'mobx-utils';
import iStore from '@tdev-stores/iStore';
import AiRequest from '@tdev-models/Ai/AiRequest';
import AiTemplate from '@tdev-models/Ai/AiTemplate';
import { AiTemplate as AiTemplateProps } from '@tdev-api/admin';
import { createAiRequest, allAiRequests } from '@tdev-api/aiRequest';
import { createAiTemplate, updateAiTemplate, deleteAiTemplate, getAllAiTemplates } from '@tdev-api/admin';

export class AiStore extends iStore<`update-${string}` | `fetch-${string}`> {
    readonly root: RootStore;

    aiRequests = observable<AiRequest>([]);
    aiTemplates = observable<AiTemplate>([]);

    constructor(root: RootStore) {
        super();
        this.root = root;
    }

    findRequest = computedFn(
        function <T>(this: AiStore, id?: string): AiRequest<T> | undefined {
            if (!id) {
                return;
            }
            return this.aiRequests.find((d) => d.id === id) as AiRequest<T> | undefined;
        },
        { keepAlive: true }
    );

    byTemplateId = computedFn(
        function <T>(this: AiStore, templateId?: string): AiRequest<T>[] {
            if (!templateId) {
                return [];
            }
            return this.aiRequests.filter((d) => d.aiTemplateId === templateId) as AiRequest<T>[];
        },
        { keepAlive: true }
    );

    createRequest(templateId: string, request: string): Promise<AiRequest> {
        return this.withAbortController(`create-${templateId}`, async (ct) => {
            return createAiRequest(templateId, request, ct.signal).then(
                action((res) => {
                    const newRequest = new AiRequest(res.data, this);
                    this.aiRequests.push(newRequest);
                    return newRequest;
                })
            );
        });
    }

    @action
    createTemplate(template: Partial<AiTemplateProps>): Promise<AiTemplate> {
        const data = { ...template } as AiTemplateProps;
        delete (data as any).id; // Ensure id is not included
        delete (data as any).createdAt; // Ensure createdAt is not included
        delete (data as any).updatedAt; // Ensure updatedAt is not included
        return this.withAbortController(`create-template`, async (ct) => {
            return createAiTemplate(data, ct.signal).then(
                action((res) => {
                    const newTemplate = new AiTemplate(res.data, this);
                    this.aiTemplates.push(newTemplate);
                    return newTemplate;
                })
            );
        });
    }

    @action
    updateTemplate(template: AiTemplate): Promise<AiTemplate> {
        if (!template.isDirty) {
            return Promise.resolve(template);
        }
        return this.withAbortController(`update-${template.id}`, async (ct) => {
            return updateAiTemplate(template.id, template.dirtyProps, ct.signal).then(
                action((res) => {
                    const updatedTemplate = new AiTemplate(res.data, this);
                    this.aiTemplates.replace([
                        ...this.aiTemplates.filter((t) => t.id !== updatedTemplate.id),
                        updatedTemplate
                    ]);
                    return updatedTemplate;
                })
            );
        });
    }

    @action
    deleteTemplate(template: AiTemplate): Promise<void> {
        return this.withAbortController(`destroy-${template.id}`, async (ct) => {
            return deleteAiTemplate(template.id, ct.signal).then(
                action(() => {
                    this.aiTemplates.remove(template);
                })
            );
        });
    }

    @action
    apiAllTemplates(): Promise<AiTemplate[]> {
        if (!this.root.userStore.current?.hasElevatedAccess) {
            return Promise.resolve([]);
        }
        return this.withAbortController(`fetch-templates`, async (ct) => {
            return getAllAiTemplates(ct.signal).then(
                action((res) => {
                    const templates = res.data.map((d) => new AiTemplate(d, this));
                    this.aiTemplates.replace(templates);
                    return templates;
                })
            );
        });
    }
    @action
    apiAllRequests(templateId: string): Promise<AiRequest[]> {
        return this.withAbortController(`fetch-requests-${templateId}`, async (ct) => {
            return allAiRequests(templateId, ct.signal).then(
                action((res) => {
                    const existingRequest = this.aiRequests.slice();
                    res.data
                        .map((d) => new AiRequest(d, this))
                        .forEach((request) => {
                            const existing = existingRequest.findIndex((r) => r.id === request.id);
                            if (existing !== -1) {
                                existingRequest[existing] = request;
                            } else {
                                existingRequest.push(request);
                            }
                        });
                    this.aiRequests.replace(existingRequest);
                    return existingRequest;
                })
            );
        });
    }

    @action
    load() {
        return this.apiAllTemplates();
    }

    @action
    cleanup() {
        this.aiRequests.clear();
        this.aiTemplates.clear();
    }
}
