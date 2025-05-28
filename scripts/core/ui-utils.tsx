import React from 'react';
import {showModal} from '@superdesk/common';
import {Modal} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';
import {gettext} from './utils';
import {PromptModal} from './prompt-modal';
import {IPromptOptions} from 'superdesk-api';

export const ui = {
    alert: (message: string) => (
        showModal(({closeModal}) => {
            return (
                <Modal
                    position="top"
                    visible
                    onHide={closeModal}
                >
                    {message}
                </Modal>
            );
        })
    ),
    prompt: (options: IPromptOptions): Promise<string> => {
        return new Promise((resolve) => {
            showModal(({closeModal}) => {
                return (
                    <PromptModal
                        closeModal={({value}) => {
                            closeModal();

                            if (value != null) {
                                resolve(value);
                            }
                        }}
                        label={options.inputLabel}
                        okButtonText={options.okButtonText}
                        cancelButtonText={options.cancelButtonText}
                    />
                );
            });
        });
    },
    confirm: (message: string, title?: string) => new Promise((resolve) => {
        ng.get('modal').confirm(message, title ?? gettext('Confirm'))
            .then(() => resolve(true))
            .catch(() => resolve(false));
    }),
};
