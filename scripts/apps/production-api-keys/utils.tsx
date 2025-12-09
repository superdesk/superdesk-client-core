import React from 'react';
import {showModal} from '@sourcefabric/common';
import {gettext} from 'core/utils';
import {Modal, Button} from 'superdesk-ui-framework/react';
import {IBaseRestApiResponse} from 'superdesk-api';

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
    password: string;
    name: string;
    scope: Array<string>;
}
