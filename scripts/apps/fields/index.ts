
import {extensions} from 'core/extension-imports.generated';
import {ICustomFieldType} from 'superdesk-api';

type ICustomFieldTypeMap = {[id: string]: ICustomFieldType};

export function getFields(): ICustomFieldTypeMap {
    const fields: ICustomFieldTypeMap = {};

    Object.values(extensions).map(({activationResult}) => {
        if (activationResult.contributions && activationResult.contributions.customFieldTypes) {
            activationResult.contributions.customFieldTypes.forEach((customType) => {
                fields[customType.id] = customType;
            });
        }
    });

    return fields;
};