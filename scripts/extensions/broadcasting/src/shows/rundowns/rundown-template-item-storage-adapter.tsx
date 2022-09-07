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
        if (fieldType === 'editor3') {
            const rawState = (value as IEditor3ValueStorage).rawContentState;

            const computed = computeEditor3Output(
                rawState,
                config as IEditor3Config,
                LANGUAGE,
            );

            return {
                ...rundownItem,
                data: {
                    ...(rundownItem.data ?? {}),
                    [fieldId]: computed.stringValue,
                    fields_meta: {
                        ...(rundownItem.data.fields_meta ?? {}),
                        [fieldId]: {
                            ...(rundownItem.data.fields_meta?.[fieldId] ?? {}),
                            draftjsState: [rawState],
                            annotations: computed.annotations,
                        },
                    },
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
        const value = (rundownItem.data as {[key: string]: any})[fieldId] ?? undefined;

        if (fieldType === 'editor3') {
            const storedDraftJsState = rundownItem.data?.fields_meta?.[fieldId]?.draftjsState;

            if (storedDraftJsState != null) {
                const val: IEditor3ValueStorage = {
                    rawContentState: storedDraftJsState[0],
                };

                return val;
            } else {
                const returnValue: IEditor3ValueStorage
                    = {rawContentState: convertToRaw(getContentStateFromHtml(value ?? ''))};

                return returnValue;
            }
        } else {
            return value;
        }
    },
};
