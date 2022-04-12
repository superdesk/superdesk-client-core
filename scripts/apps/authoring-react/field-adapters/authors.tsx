import * as React from 'react';
import ng from 'core/services/ng';
import {IAuthor, IAuthoringFieldV2, IUser} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldAdapter} from '.';
import {IDropdownTreeConfig} from '../fields/dropdown';
import {arrayToTree} from 'core/helpers/tree';

function valueTemplate({item}) {
    return (
        <span>{item.name}: {item.sub_label}</span>
    );
}

const getId = (item) => typeof item._id === 'string' ? item._id : JSON.stringify(item._id);

interface IUserOption {
    _id: IUser['_id'];
    name: string;
    user: IUser;
}

interface IAuthorRole extends IAuthor {
    parent: IUser['_id'];
}

function isAuthorRole(x: IUserOption | IAuthorRole): x is IAuthorRole {
    return Array.isArray(x._id);
}

export const authors: IFieldAdapter = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IDropdownTreeConfig = {
            readOnly: fieldEditor.readonly,
            required: fieldEditor.required,
            getItems: () => {
                const metadata = ng.get('metadata');

                const authorsTree = arrayToTree(
                    metadata.values.authors as Array<IUserOption | IAuthorRole>,
                    (item) => getId(item),
                    (item) => {
                        if (isAuthorRole(item)) {
                            return item.parent;
                        } else {
                            return null;
                        }
                    },
                );

                return ({
                    nodes: authorsTree.result,
                    lookup: {},
                });
            },
            canSelectBranchWithChildren: () => false,
            getLabel: (item: IUserOption | IAuthorRole) => item.name,
            valueTemplate: valueTemplate,
            getId: (item) => getId(item),
            source: 'dropdown-tree',
            multiple: true,
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'authors',
            name: gettext('Authors'),
            fieldType: 'dropdown',
            fieldConfig,
        };

        return fieldV2;
    },
    retrieveStoredValue: (article) => {
        return article.authors;
    },
    storeValue: (val: Array<IAuthor>, article) => {
        return {...article, authors: val};
    },
};
