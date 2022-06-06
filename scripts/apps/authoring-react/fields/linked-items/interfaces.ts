import {IArticle, ICommonFieldConfig} from 'superdesk-api';

interface ILinkedItem {
    id: IArticle['_id'];

    // type is only needed for compatibility with angular based authoring
    type: IArticle['type'];
}

export type ILinkedItemsValueOperational = Array<ILinkedItem>;
export type ILinkedItemsValueStorage = ILinkedItemsValueOperational;
export type ILinkedItemsUserPreferences = never;
export type ILinkedItemsConfig = ICommonFieldConfig;
