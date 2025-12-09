import React from 'react';
import {getGenericHttpEntityListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import type {IFormField} from 'superdesk-api';
import {GenericFormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {gettext} from 'core/utils';
import {ProductionApiItem} from './ProductionApiItem';
import {getProductionApiKeysFormConfig} from './config';
import {handleClose, type IProductionApiKeyConfig} from './utils';

export function getNameField(): IFormField<IProductionApiKeyConfig> {
    return {
        label: gettext('Name'),
        type: GenericFormFieldType.plainText,
        field: 'name',
        required: true,
    };
}

const getId = (item: IProductionApiKeyConfig) => item._id;
const beforeClose = (item: IProductionApiKeyConfig) => item.password ? handleClose() : Promise.resolve(true);

const ProductionAPIKeysPageComponent =
    getGenericHttpEntityListPageComponent<IProductionApiKeyConfig, never>(
        'auth_server_clients',
        getProductionApiKeysFormConfig(),
        {field: '_updated', direction: 'descending'},
    );

export const ProductionApiKeys = () => (
    <ProductionAPIKeysPageComponent
        ItemComponent={ProductionApiItem}
        getFormConfig={getProductionApiKeysFormConfig}
        fieldForSearch={getNameField()}
        getId={getId}
        beforeClose={beforeClose}
        defaultSortOption={{field: '_updated', direction: 'descending'}}
        disallowFiltering={true}
        disallowSorting={true}
        hideItemsCount={true}
    />
);
