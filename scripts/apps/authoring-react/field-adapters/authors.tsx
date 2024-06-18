/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import ng from 'core/services/ng';
import {IArticle, IAuthor, IAuthoringFieldV2, IFieldAdapter, IUser, IDropdownTreeConfig} from 'superdesk-api';
import {gettext} from 'core/utils';
import {arrayToTree} from 'core/helpers/tree';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {Spacer} from 'core/ui/components/Spacer';

function isAuthorRole(x: IUserOption | IAuthorRole): x is IAuthorRole {
    return Array.isArray(x._id);
}

function valueTemplate({item}) {
    return (
        <span>{item.name}: {item.sub_label}</span>
    );
}

function optionTemplate({item}: {item: IUserOption | IAuthorRole}) {
    if (isAuthorRole(item)) {
        return (
            <span>{item.name}</span>
        );
    } else {
        return (
            <Spacer h gap="8" justifyContent="start" noGrow>
                <UserAvatar user={item.user} size="small" displayAdministratorIndicator />
                {item.name}
            </Spacer>
        );
    }
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

export const authors: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IDropdownTreeConfig = {
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
            optionTemplate: optionTemplate,
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
