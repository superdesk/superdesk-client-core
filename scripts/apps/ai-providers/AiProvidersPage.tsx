import React from 'react';
import {getGenericHttpEntityListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {AiProviderItem} from './AiProviderItem';
import {getAiProviderFormConfig, getNameField} from './form-config';
import type {IAIProvider} from './interfaces';

const defaultSortOption = {field: 'name', direction: 'ascending'} as const;

const AiProvidersListPage = getGenericHttpEntityListPageComponent<IAIProvider, never>(
    'ai_providers',
    getAiProviderFormConfig(),
    defaultSortOption,
);

/*
    Filtering and sorting are disallowed because the generic list page derives the filter form
    and the sort options from the form config built without an item, which is the create form
    and therefore carries `api_key`. Neither a filter nor a sort can work on a field the server
    never returns.
*/
export const AiProvidersPage = () => (
    <div data-test-id="ai-providers-page" style={{display: 'contents'}}>
        <AiProvidersListPage
            ItemComponent={AiProviderItem}
            getFormConfig={getAiProviderFormConfig}
            fieldForSearch={getNameField()}
            getId={(item) => item._id}
            defaultSortOption={defaultSortOption}
            disallowFiltering={true}
            disallowSorting={true}
        />
    </div>
);
