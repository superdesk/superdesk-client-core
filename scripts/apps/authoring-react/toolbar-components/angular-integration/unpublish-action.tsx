import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, Modal, Spacer} from 'superdesk-ui-framework/react';
import {showModal} from '@sourcefabric/common';
import {gettext, getArticleLabel} from 'core/utils';
import {sdApi} from 'api';
import {inlineToolbarContext} from './inline-toolbar-context';

export const UnpublishActionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        tooltip={gettext('Unpublish')}
        text={'UP'}
        style="filled"
        type="primary"
        onClick={() => {
            showModal(({closeModal}) => (
                <Modal
                    visible
                    size="small"
                    position="center"
                    onHide={closeModal}
                    headerTemplate={gettext('Confirm Unpublishing')}
                    footerTemplate={(
                        <Spacer h gap="4" justifyContent="end" noGrow>
                            <Button
                                onClick={closeModal}
                                text={gettext('Cancel')}
                                style="filled"
                                type="default"
                            />
                            <Button
                                onClick={() => {
                                    closeModal();
                                    sdApi.article.publishItem(
                                        entity,
                                        inlineToolbarContext.exposed?.getLatestItem(),
                                        'unpublish',
                                    );
                                }}
                                text={gettext('Confirm')}
                                style="filled"
                                type="primary"
                            />
                        </Spacer>
                    )}
                >
                    {gettext(
                        'Are you sure you want to unpublish item "{{label}}"?',
                        {label: getArticleLabel(entity)},
                    )}
                </Modal>
            ));
        }}
    />
);
