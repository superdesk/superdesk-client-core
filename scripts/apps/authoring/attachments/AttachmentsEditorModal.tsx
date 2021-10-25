/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {gettext} from 'core/utils';

import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {Label} from 'core/ui/components/Form/Label';
import {Input} from 'core/ui/components/Form/Input';
import {TextArea} from 'core/ui/components/Form/TextArea';

import {IAttachment} from 'superdesk-api';

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
            <Modal>
                <ModalHeader onClose={this.props.closeEdit}>
                    {gettext('Edit Attachment')}
                </ModalHeader>

                <ModalBody>
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
                </ModalBody>

                <ModalFooter>
                    <button
                        className="btn btn--primary pull-right"
                        onClick={() => this.props.saveAttachment(this.props.attachment, this.state)}
                        disabled={!this.state.title}
                    >{gettext('Update')}</button>
                    <button
                        className="btn pull-right"
                        onClick={this.props.closeEdit}
                    >{gettext('Cancel')}</button>
                </ModalFooter>
            </Modal>
        );
    }
}
