import React from 'react';
import {showModal} from '@sourcefabric/common';
import {gettext} from 'core/utils';
import {Modal, Button} from 'superdesk-ui-framework/react';
import {IBaseRestApiResponse, IFormGroup} from 'superdesk-api';
import {GenericFormFieldType} from 'core/ui/components/generic-form/interfaces/form';

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
                field: 'scopes',
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
                        field: 'client_id',
                    },
                    {
                        label: gettext('Client Secret'),
                        type: GenericFormFieldType.readonlyCopyableText,
                        field: 'client_secret',
                    },
                ],
            },
        ],
    };
}

export const handleClose = (): Promise<boolean> => {
    return new Promise((resolve) => {
        showModal(({closeModal}) => {
            return (
                <Modal
                    visible
                    size="small"
                    position="center"
                    onHide={closeModal}
                    headerTemplate={gettext('Close this panel?')}
                    footerTemplate={(
                        <>
                            <Button
                                type="secondary"
                                text={gettext('Close anyway')}
                                onClick={() => {
                                    resolve(true);
                                    closeModal();
                                }}
                            />
                            <Button
                                type="primary"
                                text={gettext('Go back')}
                                onClick={() => {
                                    resolve(false);
                                    closeModal();
                                }}
                            />
                        </>
                    )}
                >
                    {gettext(
                        'Make sure you\'ve saved your Client Secret.'
                        + 'You won\'t be able to access it again after closing',
                    )}
                </Modal>
            );
        });
    });
};

export interface IProductionApiKeyConfig extends IBaseRestApiResponse {
    client_id: string;
    client_secret: string;
    name: string;
    scopes: Array<string>;
}
