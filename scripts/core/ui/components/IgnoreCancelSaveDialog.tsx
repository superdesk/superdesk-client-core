import * as React from 'react';
import {IIgnoreCancelSaveProps, IIgnoreCancelSaveResponse} from 'superdesk-api';
import {gettext} from 'core/utils';
import {showModal} from '@superdesk/common';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';

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
            <Modal
                visible
                zIndex={1050}
                size="small"
                position="top"
                onHide={this.respond.cancel}
                headerTemplate={this.props.title}
                footerTemplate={
                    (
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
                    )
                }
            >
                {this.props.body}
            </Modal>
        );
    }
}
