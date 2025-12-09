import {GenericFormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {gettext} from 'core/utils';
import type {IFormGroup} from 'superdesk-api';
import type {IProductionApiKeyConfig} from './utils';

export function getProductionApiKeysFormConfig(): IFormGroup<IProductionApiKeyConfig> {
    return {
        direction: 'vertical',
        type: 'inline',
        form: [
            {
                label: gettext('Name'),
                type: GenericFormFieldType.plainText,
                field: 'name',
                required: true,
            },
            {
                label: gettext('Scopes'),
                type: GenericFormFieldType.selectMultiple,
                field: 'scope',
                component_parameters: {
                    items: [
                        {id: 'ARCHIVE_READ', label: gettext('Archive')},
                        {id: 'DESKS_READ', label: gettext('Desks')},
                        {id: 'USERS_READ', label: gettext('Users')},
                        {id: 'CONTACTS_READ', label: gettext('Contacts')},
                        {id: 'PLANNING_READ', label: gettext('Planning')},
                        {id: 'EVENTS_READ', label: gettext('Events')},
                        {id: 'ASSIGNMENTS_READ', label: gettext('Assignments')},
                    ],
                },
            },
            {
                field: 'custom_alert',
                type: GenericFormFieldType.alert,
                component_parameters: {
                    style: 'warning',
                },
                value: gettext(
                    'Your Client ID and Client Secret will be generated when you save. '
                    + 'Make sure to copy the Client Secret immediately. '
                    + 'It will only be shown once and it cannot be retrieved later.',
                ),
            },
            {
                direction: 'vertical',
                type: {
                    label: gettext('Credentials'),
                    openByDefault: true,
                },
                form: [
                    {
                        label: gettext('Client ID'),
                        type: GenericFormFieldType.readonlyCopyableText,
                        field: '_id',
                    },
                    {
                        label: gettext('Client Secret'),
                        type: GenericFormFieldType.readonlyCopyableText,
                        field: 'password',
                        component_parameters: {
                            defaultAfterCreation: '* * * * * * * *',
                        },
                    },
                ],
            },
        ],
    };
}
