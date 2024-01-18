/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {gettext} from 'core/utils';
import {Label} from 'core/ui/components/Form/Label';
import {Input} from 'core/ui/components/Form/Input';
import {TextArea} from 'core/ui/components/Form/TextArea';
import {IAttachment} from 'superdesk-api';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';

interface IProps {
    attachment: IAttachment;

    saveAttachment: (original: IAttachment, updates: Partial<IAttachment>) => void;
    closeEdit: () => void;
}

type IState = Partial<IAttachment>;

export class AttachmentsEditorModal extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {title: props.attachment.title, description: props.attachment.description};
        this.update = this.update.bind(this);
    }

    update(key: string, val: string) {
        const updates = {};

        updates[key] = val;
        this.setState(updates);
    }

    render() {
        return (
            <Modal
                visible
                zIndex={1050}
                size="small"
                position="top"
                onHide={this.props.closeEdit}
                headerTemplate={gettext('Edit Attachment')}
                footerTemplate={
                    (
                        <ButtonGroup align="end">
                            <Button
                                text={gettext('Cancel')}
                                type="default"
                                onClick={this.props.closeEdit}
                            />
                            <Button
                                text={gettext('Update')}
                                type="primary"
                                onClick={() => this.props.saveAttachment(this.props.attachment, this.state)}
                                disabled={!this.state.title}
                            />
                        </ButtonGroup>
                    )
                }
            >
                <div className="sd-line-input">
                    <Label text={gettext('Title')} />
                    <Input
                        field="title"
                        value={this.state.title}
                        onChange={this.update}
                        required
                    />
                </div>

                <div className="sd-line-input">
                    <Label text={gettext('Description')} />
                    <TextArea
                        field="description"
                        value={this.state.description}
                        onChange={this.update}
                    />
                </div>
            </Modal>
        );
    }
}
