import React, {Component} from 'react';
import PropTypes from 'prop-types';
import BlockStyleButtons from './BlockStyleButtons';
import InlineStyleButtons from './InlineStyleButtons';
import TableControls from './TableControls';
import {SelectionButton} from './SelectionButton';
import {IconButton} from './IconButton';
import {ToolbarPopup} from './ToolbarPopup';
import {connect} from 'react-redux';
import {LinkToolbar} from '../links';
import classNames from 'classnames';
import * as actions from '../../actions';

/**
 * @typedef PopupMeta
 * @property {PopupTypes} type Popup type
 * @property {Object} data Information required by this popup type (for example
 * a selection for adding the comment or annotation too)
 */

export const PopupTypes = {
    Hidden: 'NONE',
    Annotation: 'ANNOTATION',
    Comment: 'COMMENT',
    Link: 'LINK',
    Embed: 'EMBED'
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
                {/* Styles */}
                <BlockStyleButtons />
                <InlineStyleButtons />

                {/* Formatting options */}
                {has('anchor') &&
                    <SelectionButton
                        onClick={this.showPopup(PopupTypes.Link)}
                        iconName="link"
                        tooltip={gettext('Link')}
                    />
                }
                {has('embed') &&
                    <IconButton
                        onClick={this.showPopup(PopupTypes.Embed)}
                        iconName="code"
                        tooltip="Embed"
                    />
                }
                {has('picture') &&
                    <IconButton
                        onClick={insertImages}
                        tooltip={gettext('Media')}
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
                {allowsHighlights &&
                    <SelectionButton
                        onClick={this.showPopup(PopupTypes.Comment)}
                        key="comment-button"
                        iconName="comment"
                        tooltip={gettext('Comment')}
                    />
                }
                {allowsHighlights && has('annotation') &&
                    <SelectionButton
                        onClick={this.showPopup(PopupTypes.Annotation)}
                        key="annotation-button"
                        iconName="pencil"
                        tooltip={gettext('Annotation')}
                    />
                }

                <ToolbarPopup onCancel={this.hidePopup} type={popup.type} data={popup.data} />

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
    addTable: PropTypes.func,
    insertImages: PropTypes.func,
    editorNode: PropTypes.object,
    scrollContainer: PropTypes.string
};

const mapStateToProps = ({editorFormat, activeCell, allowsHighlights}) => ({
    editorFormat, activeCell, allowsHighlights
});

const mapDispatchToProps = (dispatch) => ({
    insertImages: () => dispatch(actions.insertImages()),
    addTable: () => dispatch(actions.addTable(1, 2))
});

const Toolbar = connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);

export default Toolbar;
