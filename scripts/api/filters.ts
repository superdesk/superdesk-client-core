import {IVocabularyItem} from 'superdesk-api';

function mergeArrayToString(
    array: Array<IVocabularyItem>,
    propertyName?: string,
    schemeName?: string,
    returnArray?: boolean,
): string | Array<string> {
    let subjectMerged = [];

    array.forEach((item) => {
        const value = propertyName == null ? item : item[propertyName];

        if (value) {
            subjectMerged.push(value);

            if ((schemeName?.length ?? 0) && item.scheme !== schemeName) {
                subjectMerged.pop();
            }
        }
    });

    if (returnArray) {
        return subjectMerged;
    }

    return subjectMerged.join(', ');
}

interface IFiltersApi {
    mergeArrayToString(
        array: Array<IVocabularyItem>,
        propertyName?: string,
        schemeName?: string,
        returnArray?: boolean,
    ): string | Array<string>;
}

export const filters: IFiltersApi = {
    mergeArrayToString,
};
