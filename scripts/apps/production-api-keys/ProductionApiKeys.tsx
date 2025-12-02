import React from 'react';
import {getGenericHttpEntityListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {IFormField} from 'superdesk-api';
import {GenericFormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {gettext} from 'core/utils';
import {ProductionApiItem} from './ListItemTemplate';
import {handleClose, getProductionApiKeysFormConfig, IProductionApiKeyConfig} from './utils';

export function getNameField(): IFormField<IProductionApiKeyConfig> {
    return {
        label: gettext('Name'),
        type: GenericFormFieldType.plainText,
        field: 'name',
        required: true,
    };
}

export const ProductionApiKeys = () => {
    const formConfig = getProductionApiKeysFormConfig();

    const ProductionAPIKeysPageComponent =
        getGenericHttpEntityListPageComponent<IProductionApiKeyConfig, never>(
            'auth_server_clients',
            formConfig,
            {field: '_updated', direction: 'descending'},
        );

    return (
        <ProductionAPIKeysPageComponent
            ItemComponent={ProductionApiItem}
            getFormConfig={getProductionApiKeysFormConfig}
            fieldForSearch={getNameField()}
            getId={(item) => item._id}
            beforeClose={handleClose}
            disallowFiltering={true}
            disallowSorting={true}
            defaultSortOption={{field: '_updated', direction: 'descending'}}
        />
    );
};
