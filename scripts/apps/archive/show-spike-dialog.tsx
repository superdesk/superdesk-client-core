/* eslint-disable indent */

import React from 'react';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {onSpikeMiddlewareResult} from 'superdesk-api';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import {applyDefault} from 'core/helpers/typescript-helpers';

export function showSpikeDialog<T>(
    modal: any,
    doSpike: () => void,
    promptForConfirmationMessage: string,
    middlewares: Array<(value: T) => Promise<onSpikeMiddlewareResult>>,
    middlewareArgument: T,
) {
    var warnings: Array<{text: string}> = [];
    const initialValue: Promise<onSpikeMiddlewareResult> = Promise.resolve({});
    const skipConfirmationPrompt = !applyDefault(appConfig.confirm_spike, true);

    middlewares.reduce(
        (current, next) => {
            return current.then((result) => {
                if (result.warnings != null) {
                    warnings = warnings.concat(result.warnings);
                }
                return next(middlewareArgument);
            });
        },
        initialValue,
    )
    .then((result) => { // last result isn't processed by `reduce`
        if (result.warnings != null) {
            warnings = warnings.concat(result.warnings);
        }

        return result;
    })
    .then(() => {
        if (skipConfirmationPrompt && warnings.length < 1) {
            doSpike();
        } else {
            modal.createCustomModal()
                .then(({openModal, closeModal}) => {
                    openModal(
                        <Modal>
                            <ModalHeader>{gettext('Confirm')}</ModalHeader>
                            <ModalBody>
                                <div>{promptForConfirmationMessage}</div>
                                {
                                    warnings.length < 1 ? null : (
                                        <ul style={{listStyle: 'initial', paddingInlineStart: 40}}>
                                            {
                                                warnings.map(({text}, i) => <li key={i}>{text}</li>)
                                            }
                                        </ul>
                                    )
                                }
                            </ModalBody>
                            <ModalFooter>
                                <button className="btn" onClick={closeModal}>{gettext('Cancel')}</button>
                                <button
                                    className="btn btn--primary"
                                    onClick={() => {
                                        doSpike();
                                        closeModal();
                                    }}
                                >
                                    {gettext('Spike')}
                                </button>
                            </ModalFooter>
                        </Modal>,
                    );
                });
        }
    });
}
