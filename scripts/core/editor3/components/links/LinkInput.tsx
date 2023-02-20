import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {EditorState, EntityInstance} from 'draft-js';
import {getSelectedEntity} from './entityUtils';
import {Dropdown, NavTabs} from 'core/ui/components';
import {AttachmentList} from './AttachmentList';
import {
    applyLink,
    hidePopups,
    createLinkSuggestion,
    changeLinkSuggestion,
    applyLinkToMuliLineQuote,
} from '../../actions';
import {connectPromiseResults} from 'core/helpers/ReactRenderAsync';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {IEditorStore} from 'core/editor3/store';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name LinkInput
 * @param {Object} editorState The editor state object.
 * @param {string} data The default value for the input.
 * @description This components holds the input form for entering a new URL.
 */

const linkTypes = {
    href: 'href',
    attachement: 'attachement',
};

interface IProps extends Partial<IEditorStore> {
    applyLink(link, entity: EntityInstance): void,
    hidePopups(): void,
    data: any,
    item: any,
    createLinkSuggestion(link): void,
    changeLinkSuggestion(link, entity): void,
    localDomains?: Array<string>,
}

export class LinkInputComponent extends React.Component<IProps, any> {
    static propTypes: any;
    static defaultProps: any;

    entity: any;
    tabs: any;
    activeTab: any;
    inputElement: any;

    constructor(props) {
        super(props);

        // when non-null, holds the entity whos URL is being edited
        this.entity = null;

        this.tabs = [
            {label: gettext('URL'), render: this.renderURL.bind(this)},
        ];

        if (props.item) {
            this.tabs.push(
                {label: gettext('Attachment'), render: this.renderAttachment.bind(this)},
            );
        }

        this.activeTab = 0;

        let selectedAttachment;

        if (props.data) {
            // if a value has been passed, it is safe to assume that it
            // is coming from the currently selected entity
            this.entity = getSelectedEntity(props.editorState);

            if (props.data.attachment) {
                this.activeTab = 1;
                selectedAttachment = props.data.attachment;
            }
        }

        const initialValue = '';

        this.state = {
            url: this.props.data ? this.props.data.href || initialValue : initialValue,
            selected: selectedAttachment,
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.selectAttachment = this.selectAttachment.bind(this);
    }

    /**
     * @ngdoc method
     * @name LinkInput#onSubmit
     * @description Callback when submitting the form.
     */
    onSubmit(linkType) {
        let link;
        const {suggestingMode, localDomains} = this.props;
        const _createLinkSuggestion = this.props.createLinkSuggestion;
        const _applyLink = this.props.applyLink;
        const _changeLinkSuggestion = this.props.changeLinkSuggestion;

        if (linkType === linkTypes.href) {
            const url = this.state.url;
            const isLocalDomain = (localDomains || []).some((item) => url.includes(item.domain));

            link = {href: url};
            if (!isLocalDomain && localDomains != null) {
                link.target = '_blank';
            }
        } else if (linkType === linkTypes.attachement) {
            link = {attachment: this.state.selected};
        } else {
            throw new Error('link type not recognized');
        }

        if (!link.href && !link.attachment) {
            return;
        }

        if (suggestingMode) {
            if (this.entity) {
                _changeLinkSuggestion(link, this.entity);
            } else {
                _createLinkSuggestion(link);
            }
        } else {
            _applyLink(link, this.entity);
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
        if (this.inputElement != null) {
            this.inputElement.focus();

            const savedValue = this.inputElement.value;

            // re-apply the value so cursor is at the end, not the start
            // related https://stackoverflow.com/q/511088/1175593
            this.inputElement.value = '';
            this.inputElement.value = savedValue;
        }
    }

    selectAttachment(file) {
        this.setState({selected: file._id});
    }

    render() {
        return (
            <Dropdown open={true} className="dropdown--link-input">
                <NavTabs tabs={this.tabs} active={this.activeTab} />
            </Dropdown>
        );
    }

    renderURL() {
        return (
            <form
                onSubmit={() => {
                    this.onSubmit(linkTypes.href);
                }}
                className="link-input"
                onKeyUp={this.onKeyUp}
            >
                <div style={{padding: '3.2rem 1.6rem'}}>
                    <input
                        type="url"
                        ref={(el) => {
                            this.inputElement = el;
                        }}
                        className="sd-line-input__input"
                        value={this.state.url}
                        onChange={(e) => {
                            this.setState({url: e.target.value});
                        }}
                        placeholder={'https://'}
                    />
                </div>
                <div className="dropdown__menu-footer dropdown__menu-footer--align-right">
                    <div className="button-group button-group--end button-group--comfort" role="group">
                        <button
                            className="btn btn--cancel"
                            onClick={this.props.hidePopups}
                        >
                            {gettext('Cancel')}
                        </button>
                        <button className="btn btn--primary" type="submit" disabled={this.state.url.length < 1}>
                            {gettext('Insert')}
                        </button>
                    </div>
                </div>
            </form>
        );
    }

    renderAttachment() {
        return (
            <div>
                <div style={{height: '24rem', overflowY: 'scroll'}}>
                    <AttachmentList
                        item={this.props.item}
                        onClick={this.selectAttachment}
                        selected={this.state.selected}
                    />
                </div>
                <div className="dropdown__menu-footer dropdown__menu-footer--align-right">
                    <button
                        className="btn btn--cancel"
                        onClick={this.props.hidePopups}
                    >
                        {gettext('Cancel')}
                    </button>
                    <button
                        className="btn btn--primary"
                        disabled={this.state.selected == null}
                        onClick={() => {
                            this.onSubmit(linkTypes.attachement);
                        }}
                    >
                        {gettext('Insert')}
                    </button>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    item: state.item,
    editorState: state.editorState,
    suggestingMode: state.suggestingMode,
});

const LinkInputComponentWithDependenciesLoaded = connectPromiseResults<IProps>(() => ({
    localDomains: ng.get('metadata').initialize()
        .then(() => ng.get('metadata').values.local_domains),
}))(LinkInputComponent);

export const LinkInput = connect(mapStateToProps, {
    applyLink,
    hidePopups,
    createLinkSuggestion,
    changeLinkSuggestion,
})(LinkInputComponentWithDependenciesLoaded);

const mapStateToPropsNoEditorState = (state) => ({
    item: state.item,
    suggestingMode: state.suggestingMode,
});

export const LinkInputMultiLineQuote = connect(mapStateToPropsNoEditorState, {
    applyLink: applyLinkToMuliLineQuote,
    hidePopups,
    createLinkSuggestion,
    changeLinkSuggestion,
})(LinkInputComponentWithDependenciesLoaded);
