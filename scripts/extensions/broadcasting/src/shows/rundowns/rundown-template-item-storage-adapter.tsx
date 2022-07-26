import {convertToRaw} from 'draft-js';
import {
    IEditor3Config,
    IEditor3ValueStorage,
    IStorageAdapter,
} from 'superdesk-api';
import {LANGUAGE} from '../../constants';
import {IRundownItemTemplateInitial} from '../../interfaces';
import {superdesk} from '../../superdesk';

const {computeEditor3Output, getContentStateFromHtml} = superdesk.helpers;

export const rundownTemplateItemStorageAdapter: IStorageAdapter<IRundownItemTemplateInitial> = {
    storeValue: (value, fieldId, rundownItem, config, fieldType) => {
        if (fieldType === 'editor3' && ((config as IEditor3Config).singleLine) === true) {
            return {
                ...rundownItem,
                data: {
                    ...(rundownItem.data ?? {}),
                    [fieldId]: computeEditor3Output(
                        (value as IEditor3ValueStorage).rawContentState,
                        config as IEditor3Config,
                        LANGUAGE,
                    ).stringValue,
                },
            };
        } else {
            return {
                ...rundownItem,
                data: {
                    ...(rundownItem.data ?? {}),
                    [fieldId]: value,
                },
            };
        }
    },
    retrieveStoredValue: (rundownItem, fieldId, fieldType) => {
        const value = (rundownItem.data as {[key: string]: any})[fieldId] ?? null;

        if (fieldType === 'editor3') {
            const returnValue: IEditor3ValueStorage = typeof value === 'string'
                ? {rawContentState: convertToRaw(getContentStateFromHtml(value))}
                : value;

            return returnValue;
        } else {
            return value;
        }
    },
};
