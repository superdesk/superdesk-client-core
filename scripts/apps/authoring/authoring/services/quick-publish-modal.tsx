import React from 'react';

import {gettext, gettextPlural} from 'core/utils';
import {showModal} from '@superdesk/common';

import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {Button} from 'core/ui/components';
import {IArticle} from 'superdesk-api';
import {isScheduled, scheduledFormat} from 'core/datetime/datetime';

interface IProps {
    closeModal(): void;
}

/**
 * In case publish is triggered by quick buttons, show confirmation dialog
 */
export function confirmPublish(items: Array<IArticle>): Promise<void> {
    return new Promise((resolve) => {
        class ConfirmPublishModal extends React.PureComponent<IProps> {
            render() {
                return (
                    <Modal>
                        <ModalHeader onClose={this.props.closeModal}>
                            {gettext('Publishing')}
                        </ModalHeader>
                        <ModalBody>
                            <p>
                                <strong>
                                    {
                                        gettextPlural(
                                            items.length,
                                            'Do you want to publish the article?',
                                            'Do you want to publish {{number}} articles?',
                                            {number: items.length},
                                        )
                                    }
                                </strong>
                            </p>

                            <div>
                                {
                                    items.map((item) => {
                                        return (
                                            <div key={item._id} className="quick-publish--item">
                                                <div className="quick-publish--line">
                                                    <div className="field--slugline">{item.slugline}</div>
                                                    <div>{item.headline}</div>
                                                </div>

                                                {
                                                    isScheduled(item) ? (
                                                        <span className="quick-publish--scheduled">
                                                            <strong>{gettext('Scheduled:')}</strong>
                                                            {' '}
                                                            {scheduledFormat(item).short}
                                                        </span>
                                                    ) : null
                                                }
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="default" onClick={this.props.closeModal}>
                                {gettext('Cancel')}
                            </Button>
                            <Button
                                color="primary"
                                onClick={() => {
                                    resolve();
                                    this.props.closeModal();
                                }}
                            >
                                {gettext('Publish')}
                            </Button>
                        </ModalFooter>
                    </Modal>
                );
            }
        }

        showModal(ConfirmPublishModal);
    });
}
