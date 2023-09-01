import {showModal} from '@superdesk/common';
import {authoringReactEnabledUserSelection, toggleAuthoringReact} from 'appConfig';
import {gettext} from 'core/utils';
import React from 'react';
import {Modal, Button} from 'superdesk-ui-framework/react';

export class AuthoringSwitch extends React.Component {
    render(): React.ReactNode {
        return (
            <Button
                icon="settings"
                shape="round"
                style="hollow"
                size="small"
                type="highlight"
                text={gettext('Switch authoring')}
                onClick={() => {
                    showModal(({closeModal}) => {
                        return (
                            <Modal
                                visible
                                zIndex={2020}
                                position="top"
                                size="small"
                                headerTemplate={gettext('Switch authoring?')}
                                footerTemplate={(
                                    <>
                                        <Button
                                            type="primary"
                                            onClick={() => {
                                                toggleAuthoringReact(!authoringReactEnabledUserSelection);
                                                window.location.reload();
                                            }}
                                            text={gettext('Confirm')}
                                        />
                                        <Button
                                            onClick={() => {
                                                closeModal();
                                            }}
                                            text={gettext('Cancel')}
                                        />
                                    </>
                                )}
                            >
                                {gettext('To switch the authoring the page needs to be reloaded, reload it now?')}
                            </Modal>
                        );
                    });
                }}
            />
        );
    }
}
