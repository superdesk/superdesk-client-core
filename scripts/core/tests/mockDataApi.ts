import {dataApi} from 'core/helpers/CrudManager';
import {
    IDataApi,
    IBaseRestApiResponse,
    ISortOption,
    ICrudManagerFilters,
    IVocabulary,
} from 'superdesk-api';

const testBaseApiResponse: IBaseRestApiResponse = {
    _created: '2020-01-01T00:00:00+0000',
    _updated: '2020-01-01T00:00:00+0000',
    _etag: 'abc',
    _links: {},
    _id: 'id',
};

const dataApiForTesting: IDataApi = {
    findOne: <T>(endpoint, id) => {
        if (endpoint === 'vocabularies') {
            const vocabulary: IVocabulary = {
                ...testBaseApiResponse,
                _deleted: false,
                display_name: 'test vocabulary',
                type: '',
                items: [],
                service: {},
                unique_field: '',
                schema: {},
                field_type: 'text',
            };

            return Promise.resolve(vocabulary as unknown as T);
        } else {
            return Promise.resolve({} as T);
        }
    },
    create: <T>(endpoint, item) => Promise.resolve({} as T),
    query: <T>(
        endpoint: string,
        page: number,
        sortOption: ISortOption,
        filterValues: ICrudManagerFilters = {},
        max_results?: number,
        formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
    ) => Promise.resolve({} as T),
    patch: <T>(endpoint, item1, item2) => Promise.resolve({} as T),
    patchRaw: <T>(endpoint, id, etag, patch) => Promise.resolve({} as T),
    delete: (endpoint, item) => Promise.resolve(),
};

export function mockDataApi() {
    spyOn(dataApi, 'findOne').and.callFake(dataApiForTesting.findOne);
    spyOn(dataApi, 'create').and.callFake(dataApiForTesting.create);
    spyOn(dataApi, 'query').and.callFake(dataApiForTesting.query);
    spyOn(dataApi, 'patch').and.callFake(dataApiForTesting.patch);
    spyOn(dataApi, 'patchRaw').and.callFake(dataApiForTesting.patchRaw);
    spyOn(dataApi, 'delete').and.callFake(dataApiForTesting.delete);
}
