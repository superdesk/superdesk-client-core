import React, {Component} from 'react';
import PropTypes from 'prop-types';
import BlockStyleButtons from './BlockStyleButtons';
import InlineStyleButtons from './InlineStyleButtons';
import TableControls from './TableControls';
import {SelectionButton} from './SelectionButton';
import {IconButton} from './IconButton';
import {LinkInput} from '../links';
import {EmbedButton} from '../embeds';
import {connect} from 'react-redux';
import {LinkToolbar} from '../links';
import {CommentInput} from '../comments';
import classNames from 'classnames';
import * as actions from '../../actions';

/**
 * @typedef PopupMeta
 * @property {PopupTypes} type Popup type
 * @property {Object} data Information required by this popup type (for example
 * a selection for adding the comment or annotation too)
 */

const PopupTypes = {
    Hidden: 'NONE',
    Annotation: 'ANNOTATION',
    Comment: 'COMMENT',
    Link: 'LINK'
};

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {boolean} disabled Disables clicking on the toolbar, if true.
 * @description Holds the editor's toolbar.
 */
class ToolbarComponent extends Component {
    constructor(props) {
        super(props);

        this.scrollContainer = $(props.scrollContainer || window);

        this.onScroll = this.onScroll.bind(this);
        this.showPopup = this.showPopup.bind(this);
        this.hidePopup = this.hidePopup.bind(this);

        this.state = {
            // Displays the pop-up of the given type, if set to a value different than
            // PopupTypes.Hidden. The state object value is of type PopupMeta (described
            // at the top of the file).
            popup: {type: PopupTypes.Hidden},

            // When true, the toolbar is floating at the top of the item. This
            // helps the toolbar continue to be visible when it goes out of view
            // because of scrolling.
            floating: false
        };
    }

    /**
     * @ngdoc method
     * @name Toolbar#onScroll
     * @description Triggered when the authoring page is scrolled. It adjusts toolbar
     * style, based on the location of the editor within the scroll container.
     */
    onScroll(e) {
        const editorRect = this.props.editorNode.getBoundingClientRect();
        const pageRect = this.scrollContainer[0].getBoundingClientRect();

        if (!editorRect || !pageRect) {
            return;
        }

        const isToolbarOut = editorRect.top < pageRect.top + 50;
        const isBottomOut = editorRect.bottom < pageRect.top + 60;
        const floating = isToolbarOut && !isBottomOut;

        if (floating !== this.state.floating) {
            this.setState({floating});
        }
    }

    /**
     * @ngdoc method
     * @name Toolbar#showPopup
     * @param {PopupTypes} type The type of pop-up to show.
     * @description Returns a handler function which creates the popup of the given type.
     * The function optionally expects as a parameter information to be passed onto the
     * popup.
     * @return {Function}
     */
    showPopup(type) {
        return (data) => {
            this.setState({popup: {type, data}});
        };
    }

    /**
     * @ngdoc method
     * @name Toolbar#hidePopup
     * @description Hides any visible pop-up.
     */
    hidePopup() {
        this.setState({popup: PopupTypes.Hidden});
    }

    componentDidMount() {
        this.scrollContainer.on('scroll', this.onScroll);
    }

    componentWillUnmount() {
        this.scrollContainer.off('scroll', this.onScroll);
    }

    render() {
        const {floating} = this.state;
        const {
            disabled,
            editorFormat,
            activeCell,
            applyLink,
            editorState,
            applyComment,
            applyAnnotation,
            addTable,
            insertImages,
            allowsHighlights,
        } = this.props;

        const {popup} = this.state;
        const has = (opt) => editorFormat.indexOf(opt) > -1;

        const cx = classNames({
            'Editor3-controls': true,
            'floating-toolbar': floating,
            disabled: disabled
        });

        return activeCell !== null ? <TableControls /> :
            <div className={cx}>
                <BlockStyleButtons />
                <InlineStyleButtons />

                {has('anchor') &&
                    <SelectionButton
                        onClick={this.showPopup(PopupTypes.Link)}
                        iconName="link"
                        tooltip={gettext('Link')}
                    />
                }
                {has('embed') &&
                    <EmbedButton />
                }
                {has('picture') &&
                    <IconButton
                        onClick={insertImages}
                        tooltip={gettext('Image')}
                        iconName="picture"
                    />
                }
                {has('table') &&
                    <IconButton
                        onClick={addTable}
                        tooltip={gettext('Table')}
                        iconName="table"
                    />
                }
                {allowsHighlights && [
                    <SelectionButton
                        onClick={this.showPopup(PopupTypes.Comment)}
                        key="comment-button"
                        iconName="comment"
                        tooltip={gettext('Add comment')}
                    />,
                    <SelectionButton
                        onClick={this.showPopup(PopupTypes.Annotation)}
                        key="annotation-button"
                        iconName="pencil"
                        tooltip={gettext('Add annotation')}
                    />
                ]}

                {/* TODO: Perhaps it would be cleaner to have popups in a separate component */}
                {popup.type === PopupTypes.Link &&
                    <LinkInput
                        editorState={editorState}
                        onSubmit={applyLink}
                        onCancel={this.hidePopup}
                        value={popup.data} />}

                {popup.type === PopupTypes.Comment &&
                    <CommentInput
                        onSubmit={(msg) => applyComment(popup.data, {msg})}
                        onCancel={this.hidePopup} />}

                {popup.type === PopupTypes.Annotation &&
                    <CommentInput
                        onSubmit={(msg) => applyAnnotation(popup.data, {msg})}
                        onCancel={this.hidePopup} />}

                {/* LinkToolbar must be the last node. */}
                <LinkToolbar onEdit={this.showPopup(PopupTypes.Link)} />
            </div>;
    }
}

ToolbarComponent.propTypes = {
    disabled: PropTypes.bool,
    allowsHighlights: PropTypes.bool,
    editorFormat: PropTypes.array,
    activeCell: PropTypes.any,
    applyLink: PropTypes.func,
    addTable: PropTypes.func,
    insertImages: PropTypes.func,
    applyComment: PropTypes.func,
    applyAnnotation: PropTypes.func,
    editorState: PropTypes.object,
    editorNode: PropTypes.object,
    scrollContainer: PropTypes.string
};

const mapStateToProps = ({editorFormat, editorState, activeCell, allowsHighlights}) => ({
    editorFormat, editorState, activeCell, allowsHighlights
});

const mapDispatchToProps = (dispatch) => ({
    applyLink: (link, entity = null) => dispatch(actions.applyLink({link, entity})),
    applyComment: (sel, msg) => dispatch(actions.applyComment(sel, msg)),
    applyAnnotation: (sel, msg) => dispatch(actions.applyAnnotation(sel, msg)),
    insertImages: () => dispatch(actions.insertImages()),
    addTable: () => dispatch(actions.addTable(1, 2))
});

const Toolbar = connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);

export default Toolbar;
