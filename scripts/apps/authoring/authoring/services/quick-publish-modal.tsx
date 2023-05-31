import React from 'react';
import {gettext, gettextPlural} from 'core/utils';
import {showModal} from '@superdesk/common';
import {IArticle} from 'superdesk-api';
import {isScheduled, scheduledFormat} from 'core/datetime/datetime';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';

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
                    <Modal
                        visible
                        zIndex={1050}
                        size="small"
                        position="top"
                        onHide={this.props.closeModal}
                        headerTemplate={gettext('Publishing')}
                        footerTemplate={
                            (
                                <ButtonGroup align="end">
                                    <Button
                                        text={gettext('Cancel')}
                                        type="default"
                                        onClick={this.props.closeModal}
                                    />
                                    <Button
                                        text={gettext('Publish')}
                                        type="primary"
                                        onClick={() => {
                                            resolve();
                                            this.props.closeModal();
                                        }}
                                    />
                                </ButtonGroup>
                            )
                        }
                    >
                        <div>
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
                        </div>
                    </Modal>
                );
            }
        }

        showModal(ConfirmPublishModal);
    });
}
