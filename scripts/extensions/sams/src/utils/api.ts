// External Modules
import {generate} from 'json-merge-patch';

// Types
import {IBaseRestApiResponse} from 'superdesk-api';

export function generatePatch<T extends IBaseRestApiResponse>(original: T, updates: Partial<T>): Partial<T> {
    let patch = (generate(original, updates) || {}) as Partial<T>;

    // due to the use of "projections"(partial entities) updates is sometimes missing fields which original has
    // which is triggering patching algorithm to think we want to set those missing fields to null
    // the below code enforces that in order to patch to contain null,
    // updates must explicitly send nulls instead of missing fields
    for (const key in patch) {
        if (patch[key] === null && updates[key] !== null) {
            delete patch[key];
        }
    }

    // remove IBaseRestApiResponse fields
    delete patch['_created'];
    delete patch['_updated'];
    delete patch['_id'];
    delete patch['_etag'];
    delete patch['_links'];

    return patch;
}

export function hasItemChanged<T extends IBaseRestApiResponse>(original: T, updates: Partial<T>): boolean {
    return Object.keys(generatePatch(original, updates)).length > 0;
}
