import {
    IArticle,
    IAuthoringFieldV2,
    IFieldAdapter,
    ISubjectCode,
    IDropdownConfigManualSource,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {store} from 'core/data';

export function getSubjectAdapter(): IFieldAdapter<IArticle> {
    return {
        getFieldV2: () => {
            const fieldConfig: IDropdownConfigManualSource = {
                source: 'manual-entry',
                options: Object.values(store.getState().subjectCodes)
                    .map((x) => ({id: x.qcode, label: x.name, parent: x.parent})),
                roundCorners: true,
                type: 'text',
                canSelectBranchWithChildren: true,
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
        retrieveStoredValue: (article): Array<ISubjectCode['qcode']> => {
            return (article.subject ?? []).map((x) => x.qcode);
        },
        storeValue: (val: Array<ISubjectCode['qcode']>, article) => {
            return {
                ...article,
                subject: Object.values(store.getState().subjectCodes).filter((x) => val.includes(x.qcode)),
            };
        },
    };
}
