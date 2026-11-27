import {
    IArticle,
    IAuthoringFieldV2,
    IFieldAdapter,
    IDropdownConfigVocabulary,
    IDropdownValue,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {sdApi} from 'api';

export const COMPANY_CODES_VOCABULARY_ID = 'company_codes';

const FINANCE_CATEGORY = 'f';
const FINANCE_SUBJECTS = ['04000000', '04006018', '04019000'];

function toArray(value: IDropdownValue): Array<unknown> {
    if (value == null) {
        return [];
    } else if (Array.isArray(value)) {
        return value;
    } else {
        return [value];
    }
}

/**
 * Same rule as angular's `shouldDisplayCompanyCodes`: the field is offered when the item already carries
 * company codes, or has the finance category or a finance subject. Values are the qcodes held in `fieldsData`.
 */
export function shouldOfferCompanyCodes(
    companyCodes: IDropdownValue,
    categories: IDropdownValue,
    subjects: IDropdownValue,
): boolean {
    return toArray(companyCodes).length > 0
        || toArray(categories).includes(FINANCE_CATEGORY)
        || toArray(subjects).some((qcode) => FINANCE_SUBJECTS.includes(String(qcode)));
}

export const company_codes: IFieldAdapter<IArticle> = {
    getFieldV2: () => {
        const fieldConfig: IDropdownConfigVocabulary = {
            source: 'vocabulary',
            vocabularyId: COMPANY_CODES_VOCABULARY_ID,
            multiple: true,
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'company_codes',
            name: gettext('Company Codes'),
            fieldType: 'dropdown',
            fieldConfig,
        };

        return fieldV2;
    },
    retrieveStoredValue: (article) => {
        return (article.company_codes ?? []).map(({qcode}) => qcode);
    },
    storeValue: (val: Array<string>, article) => {
        const items = sdApi.vocabularies.getAll().get(COMPANY_CODES_VOCABULARY_ID)?.items ?? [];

        return {
            ...article,
            company_codes: (val ?? []).map((qcode) => {
                const item = items.find((vocabularyItem) => vocabularyItem.qcode === qcode);

                return {qcode, name: item?.name, security_exchange: item?.['security_exchange']};
            }),
        };
    },
};
