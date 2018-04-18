import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {EditorState} from 'draft-js';
import {getSelectedEntity} from './entityUtils';
import {Dropdown, NavTabs} from 'core/ui/components';
import {AttachmentList} from './AttachmentList';
import {applyLink, hidePopups, createLinkSuggestion} from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name LinkInput
 * @param {Object} editorState The editor state object.
 * @param {string} data The default value for the input.
 * @description This components holds the input form for entering a new URL.
 */
export class LinkInputComponent extends Component {
    constructor(props) {
        super(props);

        // when non-null, holds the entity whos URL is being edited
        this.entity = null;

        this.tabs = [
            {label: gettext('URL'), render: this.renderURL.bind(this)},
        ];

        if (props.item) {
            this.tabs.push(
                {label: gettext('Attachment'), render: this.renderAttachment.bind(this)}
            );
        }

        this.activeTab = 0;
        this.state = {};

        if (props.data) {
            // if a value has been passed, it is safe to assume that it
            // is coming from the currently selected entity
            this.entity = getSelectedEntity(props.editorState);

            if (props.data.attachment) {
                this.activeTab = 1;
                this.state = {selected: props.data.attachment};
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
        const {suggestingMode} = this.props;

        if (this.input) {
            val = {href: this.input.value};
        } else {
            val = {attachment: this.state.selected};
        }

        if (!val.href && !val.attachment) {
            return;
        }

        if (suggestingMode) {
            this.props.createLinkSuggestion(val);
        } else {
            this.props.applyLink(val, this.entity);
        }

        this.props.hidePopups();
    }

    /**
     * @ngdoc method
     * @name LinkInput#onKeyUp
     * @description Handles key up events in the editor. Cancells input when
     * Esc is pressed.
     */
    onKeyUp(e) {
        if (e.key === 'Escape') {
            this.props.hidePopups();
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
            <Dropdown open={true} className="dropdown--link-input">
                <NavTabs tabs={this.tabs} active={this.activeTab} />
                <div className="dropdown__menu-footer dropdown__menu-footer--align-right">
                    <button className="btn btn--cancel"
                        onClick={this.props.hidePopups}>{gettext('Cancel')}</button>
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
                        defaultValue={this.props.data ? this.props.data.href : null}
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
    editorState: PropTypes.instanceOf(EditorState).isRequired,
    applyLink: PropTypes.func.isRequired,
    hidePopups: PropTypes.func.isRequired,
    data: PropTypes.object,
    item: PropTypes.object,
    createLinkSuggestion: PropTypes.func,
    suggestingMode: PropTypes.bool
};

const mapStateToProps = (state) => ({
    item: state.item,
    editorState: state.editorState,
    suggestingMode: state.suggestingMode
});

export const LinkInput = connect(mapStateToProps, {
    applyLink,
    hidePopups,
    createLinkSuggestion
})(LinkInputComponent);
