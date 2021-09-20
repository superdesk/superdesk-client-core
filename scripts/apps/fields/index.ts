
import {logger} from 'core/services/logger';
import {extensions} from 'appConfig';
import {ICustomFieldType} from 'superdesk-api';

type ICustomFieldTypeMap = {[id: string]: ICustomFieldType<unknown, unknown>};

export function getFields(): ICustomFieldTypeMap {
    const fields: ICustomFieldTypeMap = {};

    Object.values(extensions).forEach(({activationResult}) => {
        if (activationResult.contributions && activationResult.contributions.customFieldTypes) {
            activationResult.contributions.customFieldTypes.forEach((customType) => {
                fields[customType.id] = customType;
            });
        }
    });

    return fields;
}

export function getField(customFieldTypeId: ICustomFieldType<unknown, unknown>['id']): ICustomFieldType<unknown, unknown> | null {
    const fields = getFields();
    const fieldType = fields[customFieldTypeId];

    if (!fieldType) {
        logger.warn('unknown custom type', customFieldTypeId);
        return null;
    }

    return fieldType;
}
