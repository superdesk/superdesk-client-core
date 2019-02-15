import React from 'react';
import {connect} from 'react-redux';
import {gettext} from 'core/utils';

import {
    saveFile,
    closeEdit,
} from './actions';

import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {Label} from 'core/ui/components/Form/Label';
import {Input} from 'core/ui/components/Form/Input';
import {TextArea} from 'core/ui/components/Form/TextArea';

import {IAttachment} from '.';

interface IProps {
    file: IAttachment;

    saveFile: (file: IAttachment, updates: IAttachment) => void;
    closeEdit: () => void;
}

interface IState {
    title: string;
    description: string;
}

class AttachmentsEditorModal extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {title: props.file.title, description: props.file.description};
        this.update = this.update.bind(this);
    }

    update(key: string, val: string) {
        const updates = {};

        updates[key] = val;
        this.setState(updates);
    }

    render() {
        return (
            <React.Fragment>
                <ModalHeader onClose={this.props.closeEdit}>
                    {gettext('Edit Attachment')}
                </ModalHeader>

                <ModalBody>
                    <div className="sd-line-input">
                        <Label text={gettext('Title')} />
                        <Input field="title"
                            value={this.state.title}
                            onChange={this.update}
                            required />
                    </div>

                    <div className="sd-line-input">
                        <Label text={gettext('Description')} />
                        <TextArea
                            field="description"
                            value={this.state.description}
                            onChange={this.update}
                            required />
                    </div>
                </ModalBody>

                <ModalFooter>
                    <button className="btn btn--primary pull-right"
                        onClick={() => this.props.saveFile(this.props.file, this.state)}
                        disabled={!this.state.title || !this.state.description}
                    >{gettext('Update')}</button>
                    <button className="btn pull-right"
                        onClick={this.props.closeEdit}
                    >{gettext('Cancel')}</button>
                </ModalFooter>
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => ({
    file: state.attachments.edit,
});

const mapDispatchToProps = {
    saveFile,
    closeEdit,
};

export default connect(mapStateToProps, mapDispatchToProps)(AttachmentsEditorModal);
