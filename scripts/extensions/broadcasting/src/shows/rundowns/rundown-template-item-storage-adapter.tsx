import {convertToRaw} from 'draft-js';
import {
    IEditor3Config,
    IEditor3ValueStorage,
    IStorageAdapter,
} from 'superdesk-api';
import {LANGUAGE} from '../../constants';
import {IRundownItem, IRundownItemTemplateInitial} from '../../interfaces';
import {superdesk} from '../../superdesk';

const {computeEditor3Output, getContentStateFromHtml} = superdesk.helpers;

/**
 * When rundown items are stored in a rundown template,
 * rundown database record is used for storage.
 * Because of this, and different interface, reusing {@link rundownItemStorageAdapter} doesn't work.
 */
export const rundownTemplateItemStorageAdapter: IStorageAdapter<IRundownItemTemplateInitial> = {
    storeValue: (value, fieldId, rundownItem, config, fieldType) => {
        if (fieldType === 'editor3') {
            const editor3Config = config as IEditor3Config;
            const rawState = (value as IEditor3ValueStorage).rawContentState;

            const computed = computeEditor3Output(
                rawState,
                editor3Config,
                LANGUAGE,
            );

            const fieldsMetaCurrent: IRundownItem['fields_meta'] = (rundownItem.data.fields_meta ?? {});
            const fieldsDataNext: IRundownItem['fields_meta'] = editor3Config.readOnly === true
                ? fieldsMetaCurrent
                : {
                    ...fieldsMetaCurrent,
                    [fieldId]: {
                        draftjsState: [rawState],
                        annotations: computed.annotations,
                    },
                };

            return {
                ...rundownItem,
                data: {
                    ...(rundownItem.data ?? {}),
                    [fieldId]: computed.stringValue,
                    fields_meta: fieldsDataNext,
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

export const rundownItemStorageAdapter: IStorageAdapter<IRundownItem> = {
    storeValue: (value, fieldId, rundownItem, config, fieldType) => {
        if (fieldType === 'editor3') {
            const editor3Config = config as IEditor3Config;
            const rawState = (value as IEditor3ValueStorage).rawContentState;

            const computed = computeEditor3Output(
                rawState,
                editor3Config,
                LANGUAGE,
            );

            const fieldsMetaCurrent: IRundownItem['fields_meta'] = rundownItem.fields_meta ?? {};
            const fieldsMetaNext: IRundownItem['fields_meta'] =
                editor3Config.readOnly === true
                    ? fieldsMetaCurrent
                    : {
                        ...fieldsMetaCurrent,
                        [fieldId]: {
                            draftjsState: [rawState],
                            annotations: computed.annotations,
                        },
                    };

            return {
                ...(rundownItem ?? {}),
                [fieldId]: computed.stringValue,
                fields_meta: fieldsMetaNext,
            };
        } else {
            return {
                ...(rundownItem ?? {}),
                [fieldId]: value,
            };
        }
    },
    retrieveStoredValue: (rundownItem, fieldId, fieldType) => {
        const value = (rundownItem as {[key: string]: any})[fieldId] ?? undefined;

        if (fieldType === 'editor3') {
            const storedDraftJsState = rundownItem?.fields_meta?.[fieldId]?.draftjsState;

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
