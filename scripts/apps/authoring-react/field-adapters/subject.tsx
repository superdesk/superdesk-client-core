import {mapValues, memoize} from 'lodash';
import {IArticle, IAuthoringFieldV2, IFieldAdapter, IDropdownTreeConfig, ITreeWithLookup} from 'superdesk-api';
import {gettext} from 'core/utils';
import {arrayToTree, sortTree} from 'core/helpers/tree';
import {store} from 'core/data';

type ISubjectCode = {qcode: string; name: string; parent?: string};

export function getSubjectAdapter(): IFieldAdapter<IArticle> {
    const getItems: () => ITreeWithLookup<ISubjectCode> = memoize(() => {
        const subjectCodes = store.getState().subjectCodes;

        return ({
            nodes: sortTree(
                arrayToTree(
                    Object.values(subjectCodes),
                    (item) => item.qcode,
                    (item) => item.parent ?? null,
                ).result,
                (a, b) => a.name.localeCompare(b.name),
            ),
            lookup: mapValues(subjectCodes, (value) => ({value})),
        });
    });

    return {
        getFieldV2: (fieldEditor, fieldSchema) => {
            const fieldConfig: IDropdownTreeConfig = {
                source: 'dropdown-tree',
                getItems,
                getLabel: (item: ISubjectCode) => item.name,
                getId: (item: ISubjectCode) => item.qcode,
                canSelectBranchWithChildren: () => true,
                multiple: true,
            };

            const fieldV2: IAuthoringFieldV2 = {
                id: 'subject',
                name: gettext('Subject'),
                fieldType: 'dropdown',
                fieldConfig,
            };

            return fieldV2;
        },
        retrieveStoredValue: (article): Array<ISubjectCode> => {
            return (article.subject ?? [])
                .filter(({scheme}) => scheme == null) // filter out custom vocabulary data
                .map(({qcode, name, parent}) => ({qcode, name, parent}));
        },
        storeValue: (val: Array<ISubjectCode>, article) => {
            interface IStorageFormat {
                qcode: string;
                name: string;
                parent?: string;
                scheme: string;
            }

            return {
                ...article,
                subject: val.map(({qcode, name, parent}) => {
                    var itemToStore: IStorageFormat = {qcode, name, parent, scheme: null};

                    if (parent != null) {
                        itemToStore.parent = parent;
                    }

                    return itemToStore;
                }),
            };
        },
    };
}
