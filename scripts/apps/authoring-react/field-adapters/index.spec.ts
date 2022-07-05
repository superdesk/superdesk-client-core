// import {mockAuthoringStorage} from 'test-data/mock-authoring-storage';
import {testArticle} from 'test-data/test-article';
import {getBaseFieldsAdapter} from '.';

describe('field adapters', () => {
    beforeEach(() => {
        // mockAuthoringStorage(); // FINISH:
    });

    it('dropdown adapters can handle `null` as value', () => {
        const baseAdapter = getBaseFieldsAdapter();
        const dropdownAdapters =
            Object.values(baseAdapter)
                .filter((adapter) => {
                    const fieldAdapter = adapter.getFieldV2({}, {});

                    /**
                     * Subject only works in multi-select mode,
                     * thus `null` would never be passed to it.
                     */
                    const skipField = fieldAdapter.id === 'subject';

                    return fieldAdapter.fieldType === 'dropdown' && skipField !== true;
                });

        for (const dropdownAdapter of dropdownAdapters) {
            if (dropdownAdapter.storeValue != null) {
                expect(() => {
                    dropdownAdapter.storeValue(null, testArticle, {});
                }).not.toThrow();
            }
        }
    });
});
