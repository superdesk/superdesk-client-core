import * as React from 'react';

import {IIgnoreCancelSaveProps, IIgnoreCancelSaveResponse} from 'superdesk-api';

import {gettext} from 'core/utils';

import {showModal} from '@superdesk/common';
import {Button, ButtonGroup, Icon} from 'superdesk-ui-framework/react';

import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';

interface IProps extends IIgnoreCancelSaveProps {
    closeModal(response: IIgnoreCancelSaveResponse): void;
}

export function showIgnoreCancelSaveDialog(modalProps: IIgnoreCancelSaveProps): Promise<IIgnoreCancelSaveResponse> {
    return new Promise((resolve) => {
        showModal(
            (props) => (
                <IgnoreCancelSaveDialog
                    closeModal={(response) => {
                        props.closeModal();
                        resolve(response);
                    }}
                    {...modalProps}
                />
            ),
        );
    });
}

class IgnoreCancelSaveDialog extends React.PureComponent<IProps> {
    respond: {
        ignore(): void;
        cancel(): void;
        save(): void;
    };

    constructor(props) {
        super(props);

        this.respond = {
            ignore: () => this.props.closeModal('ignore'),
            cancel: () => this.props.closeModal('cancel'),
            save: () => this.props.closeModal('save'),
        };
    }

    render() {
        return (
            <Modal>
                <ModalHeader onClose={this.respond.cancel}>
                    {this.props.title}
                </ModalHeader>
                <ModalBody>
                    {this.props.body}
                </ModalBody>
                <ModalFooter flex={true}>
                    <ButtonGroup align="end">
                        {this.props.hideIgnore ? null : (
                            <Button
                                text={gettext('Ignore')}
                                style="hollow"
                                onClick={this.respond.ignore}
                            />
                        )}
                        {this.props.hideCancel ? null : (
                            <Button
                                text={gettext('Cancel')}
                                style="hollow"
                                onClick={this.respond.cancel}
                            />
                        )}
                        {this.props.hideSave ? null : (
                            <Button
                                text={gettext('Save')}
                                type="primary"
                                onClick={this.respond.save}
                            />
                        )}
                    </ButtonGroup>
                </ModalFooter>
            </Modal>
        );
    }
}
