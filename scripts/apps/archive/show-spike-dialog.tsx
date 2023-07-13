/* eslint-disable indent */

import React from 'react';
import {onSpikeMiddlewareResult} from 'superdesk-api';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import {applyDefault} from 'core/helpers/typescript-helpers';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';

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
                        <Modal
                            visible
                            zIndex={1050}
                            size="small"
                            position="top"
                            headerTemplate={
                                gettext('Confirm')
                            }
                            footerTemplate={
                                (
                                    <ButtonGroup align="end">
                                        <Button
                                            type="default"
                                            text={gettext('Cancel')}
                                            onClick={closeModal}
                                        />
                                        <Button
                                            type="primary"
                                            text={gettext('Spike')}
                                            onClick={() => {
                                                doSpike();
                                                closeModal();
                                            }}
                                        />
                                    </ButtonGroup>
                                )
                            }
                        >
                            <div>{promptForConfirmationMessage}</div>
                            {
                                warnings.length < 1 ? null : (
                                    <ul style={{listStyle: 'initial', paddingLeft: 40}}>
                                        {
                                            warnings.map(({text}, i) => <li key={i}>{text}</li>)
                                        }
                                    </ul>
                                )
                            }
                        </Modal>,
                    );
                });
        }
    });
}
