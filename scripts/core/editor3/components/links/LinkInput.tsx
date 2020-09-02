import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {EditorState} from 'draft-js';
import {getSelectedEntity} from './entityUtils';
import {Dropdown, NavTabs} from 'core/ui/components';
import {AttachmentList} from './AttachmentList';
import {applyLink, hidePopups, createLinkSuggestion, changeLinkSuggestion} from '../../actions';
import {connectPromiseResults} from 'core/helpers/ReactRenderAsync';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';

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


export class LinkInputComponent extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    entity: any;
    tabs: any;
    activeTab: any;
    inputElement: any;
    blaElement: any;
    titleElement: any;
    authToken: String = null;


    constructor(props) {
        super(props);


        // when non-null, holds the entity whos URL is being edited
        this.entity = null;

        this.authToken = localStorage.getItem("sess:token");

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

        const initialValue = 'https://';

        this.state = {
            //the external url
            url: this.props.data.newUrl === false ? this.props.data.href : "",
            //the text input of the internal links
            newrl: this.props.data.newUrl === true ? this.props.data.newrl : "",
            //the familyId of the internal link article
            familyId: this.props.data.newUrl === true ? this.props.data.href : "",
            selected: selectedAttachment,
            title: (this.props.data && this.props.data.title !== undefined) ? this.props.data.title : "",
            openIn: (this.props.data && this.props.data.openIn !== undefined) ? this.props.data.openIn : "0",
            valid: this.props.data.newUrl === true !== "" ? 1 : 0,
            checkbox: (this.props.data && this.props.data.nofollow !== undefined) ? this.props.data.nofollow : false,

            check: false,

            upToDate: false,
            nextGuid: "",
            nextUN: "",
            updatedUniqueName: "",
            lock: true

        };


        //this.updateUniqueName = this.updateUniqueName.bind(this);


        this.onSubmit = this.onSubmit.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.selectAttachment = this.selectAttachment.bind(this);


        // this.updateUniqueName(this.state.newrl);


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

            const url = this.state.url.replace(/\s/g, "");
            const newrl = this.state.newrl;
            const openIn = this.state.openIn;
            const title = this.state.title;
            const familyId = this.state.familyId;
            const nofollow = this.state.checkbox ? "nofollow" : "";

            if (this.state.newrl.length !== 0) {

                link = {href: familyId, newUrl: true, openIn: openIn, title: title, newrl: newrl, nofollow: nofollow};
            } else {
                link = {href: url, newUrl: false, openIn: openIn, title: title, nofollow: nofollow};
            }


            if (openIn === "1") {
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


    handleInternalLink(e) {

        if (this.authToken !== null) {

            let searchedArticle = e.target.value;
            var path = window.location.protocol + '//' + window.location.host;

            const searchResult = fetch(path+'/api/publish_queue?max_results=25&page=1&where={"$and":[{"$or":[{"headline":{"$regex":"'+encodeURIComponent('#') + searchedArticle+'","$options":"-i"}},{"unique_name":"'+encodeURIComponent('#') + searchedArticle +'"}]}]}',
                {
                    method: 'get',
                    headers: new Headers({
                        'Authorization': this.authToken,
                        'Content-Type': 'application/json, text/plain, */*'
                    })
                }).then((r) => {
                return r.json()
            });


            searchResult.then((result) => {

                if (result._items.length !== 0) {
                    this.setState({familyId: result._items["0"].item_id});
                    this.setState({valid: 1});

                } else {
                    this.setState({familyId: ""});
                    this.setState({valid: 0});
                }

            });

            this.setState({newrl: e.target.value});

        }
    }

    handleLinkTitle(e) {
        this.setState({title: e.target.value});
    }

    handleOpenInChange(e) {

        this.setState({openIn: e.target.value});
    }

    handleExternalLink(e) {
        this.setState({url: e.target.value});
    }

    componentDidMount() {
        if (this.inputElement != null && this.blaElement != null) {
            // this.inputElement.focus();

            const savedValue = this.inputElement.value;

            // re-apply the value so cursor is at the end, not the start
            // related https://stackoverflow.com/q/511088/1175593
            this.inputElement.value = '';
            this.inputElement.value = savedValue;

            const bb = this.blaElement.value;

            // re-apply the value so cursor is at the end, not the start
            // related https://stackoverflow.com/q/511088/1175593
            this.blaElement.value = '';
            this.blaElement.value = bb;


            const cc = this.titleElement.value;

            // re-apply the value so cursor is at the end, not the start
            // related https://stackoverflow.com/q/511088/1175593
            this.titleElement.value = '';
            this.titleElement.value = cc;
        }

    }

    selectAttachment(file) {
        this.setState({selected: file._id});
    }

    handleNoFollow(e) {
        this.setState({checkbox: !this.state.checkbox});

    }

    render() {


        return (
            <Dropdown open={true} className="dropdown--link-input">
                <NavTabs tabs={this.tabs} active={this.activeTab}/>
            </Dropdown>
        );
    }

    renderURL() {
        let validity = "";

        if (this.state.valid === 0) {

            const validStyle = {
                color: 'red',
                fontSize: 12,
                paddingLeft: 6,
            };

            validity = "Article is not valid";

        } else if (this.state.valid === 1) {

            const validStyle = {
                color: 'green',
                fontSize: 12,
                paddingLeft: 6,
            };

            validity = "Article is valid";

        }


        return (
            <form
                onSubmit={() => {
                    this.onSubmit(linkTypes.href);
                }}
                className="link-input" onKeyUp={this.onKeyUp}>
                <div style={{padding: '3.4rem 2rem'}}>


                    <label>
                        External Link
                    </label>

                    <input type="url"
                           ref={(el) => {
                               this.inputElement = el;
                           }}
                           className="sd-line-input__input"
                           value={this.state.url}
                           onChange={(e) => this.handleExternalLink(e)}
                           placeholder={gettext('Insert URL')}
                           disabled={this.state.newrl.length > 0 ? true : false}
                    />


                    <label className="LinkLabels">
                        Internal Link
                    </label>

                    {
                        this.state.newrl !== ""
                            ?
                            <span
                                style={validStyle}
                            >{validity}</span>
                            :
                            ""
                    }


                    <input type="text"
                           ref={(el) => {
                               this.blaElement = el;
                           }}
                           className="sd-line-input__input"
                           value={this.state.newrl}
                           onChange={(e) => this.handleInternalLink(e)}
                           placeholder="Insert Article ID"

                           disabled={this.state.url.length > 0 ? true : false}
                    />


                    <label className="LinkLabels">
                        Open In
                    </label>

                    <select value={this.state.openIn} onChange={(e) => this.handleOpenInChange(e)}>
                        <option value="0">Current Window</option>
                        <option value="1">New Window</option>
                    </select>


                    <label className="LinkLabels">
                        Link Title
                    </label>

                    <input type="text"
                           ref={(el) => {
                               this.titleElement = el;
                           }}
                           className="sd-line-input__input"
                           value={this.state.title}
                           onChange={(e) => this.handleLinkTitle(e)}
                           placeholder="Insert Link Title"
                    />

                    <label className="LinkLabels">
                        No Follow
                    </label>
                    <input type="checkbox"
                           className="sd-line-input__input"
                           defaultChecked={this.state.checkbox}
                           onChange={(e) => this.handleNoFollow(e)}
                    />


                </div>
                <div className="dropdown__menu-footer dropdown__menu-footer--align-right">
                    <button className="btn btn--cancel"
                            onClick={this.props.hidePopups}>{gettext('Cancel')}</button>
                    <button className="btn btn--primary" type="submit"
                            disabled={(this.state.url.length < 1 && this.state.newrl.length < 1) || (this.state.newrl.length > 1 && this.state.valid === 0)}>
                        {gettext('Insert')}
                    </button>
                </div>
            </form>
        );
    }

    renderAttachment() {
        return (
            <div>
                <AttachmentList item={this.props.item} onClick={this.selectAttachment} selected={this.state.selected}/>
                <div className="dropdown__menu-footer dropdown__menu-footer--align-right">
                    <button className="btn btn--cancel"
                            onClick={this.props.hidePopups}>{gettext('Cancel')}</button>
                    <button
                        className="btn btn--primary"
                        disabled={this.state.selected == null}
                        onClick={() => {
                            this.onSubmit(linkTypes.attachement);
                        }}>
                        {gettext('Insert')}
                    </button>
                </div>
            </div>
        );
    }
}

LinkInputComponent.propTypes = {
    editorState: PropTypes.instanceOf(EditorState).isRequired,
    applyLink: PropTypes.func.isRequired,
    hidePopups: PropTypes.func.isRequired,
    data: PropTypes.object,
    item: PropTypes.object,
    suggestingMode: PropTypes.bool,
    createLinkSuggestion: PropTypes.func,
    changeLinkSuggestion: PropTypes.func,
    localDomains: PropTypes.array,
};

const mapStateToProps = (state) => ({
    item: state.item,
    editorState: state.editorState,
    suggestingMode: state.suggestingMode,
});

const LinkInputComponentWithDependenciesLoaded = connectPromiseResults(() => ({
    localDomains: ng.get('metadata').initialize()
        .then(() => ng.get('metadata').values.local_domains),
}))(LinkInputComponent);

export const LinkInput: any = connect(mapStateToProps, {
    applyLink,
    hidePopups,
    createLinkSuggestion,
    changeLinkSuggestion,
})(LinkInputComponentWithDependenciesLoaded);