import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {getSelectedEntity} from './entityUtils';

import {Dropdown, DropdownMenuDivider, NavTabs} from 'core/ui/components';
import {AttachmentList} from './AttachmentList';

/**
 * @ngdoc React
 * @module superdesk.core.editor3 * @name LinkInput
 * @param {Object} editorState The editor state object.
 * @param {Function} onSubmit Function to call when submitting the form.
 * @param {Function} onCancel Function to call when cancelling submission.
 * @param {string} value The default value for the input.
 * @description This components holds the input form for entering a new URL.
 */
export class LinkInputComponent extends Component {
    constructor(props) {
        super(props);

        // when non-null, holds the entity whos URL is being edited
        this.entity = null;

        this.tabs = [
            {label: gettext('URL'), render: this.renderURL.bind(this)},
            {label: gettext('Attachment'), render: this.renderAttachment.bind(this)}
        ];

        this.activeTab = 0;
        this.state = {};

        if (props.value) {
            // if a value has been passed, it is safe to assume that it
            // is coming from the currently selected entity
            this.entity = getSelectedEntity(props.editorState);

            if (props.value.attachment) {
                this.activeTab = 1;
                this.state = {selected: props.value.attachment};
            }
        }

        this.onSubmit = this.onSubmit.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.selectAttachment = this.selectAttachment.bind(this);
    }

    /**
     * @ngdoc method
     * @name LinkInput#onSubmit
     * @description Callback when submitting the form.
     */
    onSubmit() {
        let val;

        if (this.input) {
            val = {href: this.input.value};
        } else {
            val = {attachment: this.state.selected};
        }

        if (!val.href && !val.attachment) {
            return;
        }

        this.props.onSubmit(val, this.entity);
        this.props.onCancel();
    }

    /**
     * @ngdoc method
     * @name LinkInput#onKeyUp
     * @description Handles key up events in the editor. Cancells input when
     * Esc is pressed.
     */
    onKeyUp(e) {
        if (e.key === 'Escape') {
            this.props.onCancel();
        }
    }

    componentDidMount() {
        if (this.refs.input) {
            this.refs.input.focus();
        }
    }

    selectAttachment(file) {
        this.setState({selected: file._id});
    }

    render() {
        return (
            <Dropdown open={true}>
                <NavTabs tabs={this.tabs} active={this.activeTab} />
                <DropdownMenuDivider />
                <div className="pull-right">
                    <button className="btn btn--cancel"
                        onClick={this.props.onCancel}>{gettext('Cancel')}</button>
                    <button className="btn btn--primary"
                        onClick={this.onSubmit}>{gettext('Insert')}</button>
                </div>
            </Dropdown>
        );
    }

    renderURL() {
        const setInput = (input) => {
            this.input = input;
        };

        return (
            <form onSubmit={this.onSubmit} className="link-input" onKeyUp={this.onKeyUp}>
                <div className="sd-line-input">
                    <input type="url"
                        ref={setInput}
                        className="sd-line-input__input"
                        defaultValue={this.props.value ? this.props.value.href : null}
                        placeholder={gettext('Insert URL')}
                    />
                </div>
            </form>
        );
    }

    renderAttachment() {
        this.input = null;
        return <AttachmentList item={this.props.item} onClick={this.selectAttachment} selected={this.state.selected} />;
    }
}

LinkInputComponent.propTypes = {
    editorState: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    value: PropTypes.object,
    item: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
    item: state.item
});

export const LinkInput = connect(mapStateToProps)(LinkInputComponent);
