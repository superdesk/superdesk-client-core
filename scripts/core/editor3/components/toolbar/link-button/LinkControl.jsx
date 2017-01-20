import React, {Component} from 'react';
import {Entity} from 'draft-js';
import classNames from 'classnames';
import LinkPopover from './LinkPopover';
import LinkInput from './LinkInput';
import * as common from '../../../common';
import * as actions from '../../../actions';
import {connect} from 'react-redux';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name LinkControlComponent
 * @param {Object} editorState The editor state object.
 * @param {Object} editorRect Absolute position in pixels (top, left) of the editor.
 * state changes
 * @description This component holds the link button for the toolbar and the small
 * link editing popover that displays when clicking a link.
 */
class LinkControlComponent extends Component {
    /**
     * @ngdoc method
     * @name LinkControlComponent#getDecorator
     * @static
     * @returns {Object} decorator object
     * @description Returns an object to be passed to the composite decorator
     * that contains the strategy and component to be used when decorating links.
     */
    static getDecorator() {
        return {
            strategy: LinkStrategy,
            component: (props) => {
                const {url} = Entity.get(props.entityKey).getData();

                return <a href={url} title={url}>{props.children}</a>;
            }
        };
    }

    constructor(props) {
        super(props);

        this.showInput = this.showInput.bind(this);
        this.hideInput = this.hideInput.bind(this);
        this.removeLink = this.removeLink.bind(this);

        this.state = {showInput: null};
    }


    /**
     * @ngdoc method
     * @name LinkControlComponent#showInput
     * @param {string=} url The URL to show in the input, when editing an already
     * existing link.
     * @description Shows the URL input box.
     */
    showInput(url = '') {
        const isNewLink = url === '';
        const isCollapsed = this.props.editorState.getSelection().isCollapsed();

        // only add new links if there is a selection
        if (isNewLink && isCollapsed) {
            return;
        }

        this.setState({showInput: url});
    }

    /**
     * @ngdoc method
     * @name LinkControlComponent#hideInput
     * @description Hides the URL input.
     */
    hideInput() {
        this.setState({showInput: null});
    }

    /**
     * @ngdoc method
     * @name LinkControlComponent#removeLink
     * @description Calls the link removal action.
     */
    removeLink() {
        this.props.removeLink();
        this.hideInput();
    }

    render() {
        const {editorState, editorRect, applyLink} = this.props;
        const entityType = common.getSelectedEntityType(editorState);
        const {url} = common.getSelectedEntityData(editorState);
        const isEditing = typeof this.state.showInput === 'string';
        const isCollapsed = editorState.getSelection().isCollapsed();

        const cx = classNames({
            'link-button': true,
            inactive: isCollapsed
        });

        return (
            <div className="Editor3-styleButton">
                <span className={cx} onClick={this.showInput.bind(this, '')}>link</span>

                {entityType === 'LINK' ?
                    <LinkPopover
                        url={url}
                        editorRect={editorRect}
                        onEdit={this.showInput}
                        onRemove={this.removeLink} /> : null}

                {isEditing ?
                    <LinkInput
                        editorState={editorState}
                        onSubmit={applyLink}
                        onCancel={this.hideInput}
                        value={this.state.showInput} /> : null}
            </div>
        );
    }
}

function LinkStrategy(contentBlock, callback) {
    contentBlock.findEntityRanges(
        (character) => {
            const entityKey = character.getEntity();

            return entityKey !== null && Entity.get(entityKey).getType() === 'LINK';
        },
        callback
    );
}

LinkControlComponent.propTypes = {
    editorState: React.PropTypes.object.isRequired,
    editorRect: React.PropTypes.object.isRequired,
    applyLink: React.PropTypes.func.isRequired,
    removeLink: React.PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    options: state.editorFormat
});

const mapDispatchToProps = (dispatch) => ({
    applyLink: (url, entity = null) => dispatch(actions.applyLink({url, entity})),
    removeLink: () => dispatch(actions.removeLink())
});

const LinkControl = connect(mapStateToProps, mapDispatchToProps)(LinkControlComponent);

export default LinkControl;
