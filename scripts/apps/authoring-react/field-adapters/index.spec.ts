import {mockAuthoringStorage} from 'test-data/mock-authoring-storage';
import {testArticle} from 'test-data/test-article';
import {getBaseFieldsAdapter} from '.';

describe('field adapters', () => {
    beforeEach(() => {
        mockAuthoringStorage();
    });

    it('dropdown adapters can handle `null` as value', () => {
        const baseAdapter = getBaseFieldsAdapter();
        const dropdownAdapters =
            Object.values(baseAdapter)
                .filter((adapter) => adapter.getFieldV2({}, {}).fieldType === 'dropdown');

        for (const dropdownAdapter of dropdownAdapters) {
            if (dropdownAdapter.storeValue != null) {
                expect(() => {
                    dropdownAdapter.storeValue(null, testArticle, {});
                }).not.toThrow();
            }
        }
    });
});
