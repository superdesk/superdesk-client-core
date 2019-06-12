
import {logger} from 'core/services/logger';
import {extensions} from 'core/extension-imports.generated';
import {ICustomFieldType} from 'superdesk-api';

type ICustomFieldTypeMap = {[id: string]: ICustomFieldType};

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

export function getField(customFieldTypeId: ICustomFieldType['id']): ICustomFieldType | null {
    const fields = getFields();
    const fieldType = fields[customFieldTypeId];

    if (!fieldType) {
        logger.warn('unknown custom type', customFieldTypeId);
        return null;
    }

    return fieldType;
}
