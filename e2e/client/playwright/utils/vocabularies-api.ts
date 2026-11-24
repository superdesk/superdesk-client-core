import {assertOk, withApiContext} from './api';

// the app reads vocabularies once on load, so call this before navigating
export function addVocabularyItem(vocabularyId: string, item: Record<string, unknown>): Promise<void> {
    return withApiContext(async (api) => {
        const current = await api.get(`vocabularies/${vocabularyId}`);

        await assertOk(current, `fetching the "${vocabularyId}" vocabulary`);

        const {_etag, items} = await current.json();
        const response = await api.patch(`vocabularies/${vocabularyId}`, {
            headers: {'If-Match': _etag},
            data: {items: [...items, item]},
        });

        await assertOk(response, `adding an item to the "${vocabularyId}" vocabulary`);
    });
}

// the app reads vocabularies once on load, so call this before navigating
export function createVocabulary(
    vocabulary: {_id: string; display_name: string; items: Array<Record<string, unknown>>},
): Promise<void> {
    return withApiContext(async (api) => {
        const response = await api.post('vocabularies', {data: {type: 'manageable', ...vocabulary}});

        await assertOk(response, `creating the "${vocabulary._id}" vocabulary`);
    });
}
