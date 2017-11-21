import React, {Component} from 'react';
import {SelectionState} from 'draft-js';
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
import {PopupTypes} from '../../actions';
import {getHighlights} from '../../reducers/highlights';
import {selectionsOverlap} from '../../reducers/highlights/styles';

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
        this.canAnnotate = this.canAnnotate.bind(this);

        this.state = {
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

    componentDidMount() {
        this.scrollContainer.on('scroll', this.onScroll);
    }

    componentWillUnmount() {
        this.scrollContainer.off('scroll', this.onScroll);
    }

    /**
     * @ngdoc method
     * @name Toolbar#canAnnotate
     * @description canAnnotate is called as a precondition to the SelectionButton for creating
     * an annotation. It returns true if the current selection does not overlap any annotation.
     */
    canAnnotate() {
        const {editorState} = this.props;
        const content = editorState.getCurrentContent();

        return !getHighlights(content).some((highlight, rawSelection) => {
            if (highlight.type !== 'ANNOTATION') {
                return false;
            }
            return selectionsOverlap(
                content,
                editorState.getSelection(),
                new SelectionState(JSON.parse(rawSelection))
            );
        });
    }

    render() {
        const {floating} = this.state;
        const {
            disabled,
            popup,
            editorFormat,
            activeCell,
            addTable,
            insertMedia,
            allowsHighlights,
        } = this.props;

        const has = (opt) => editorFormat.indexOf(opt) > -1;
        const showPopup = (type) => (data) => this.props.showPopup(type, data);

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
                        onClick={showPopup(PopupTypes.Link)}
                        iconName="link"
                        tooltip={gettext('Link')}
                    />
                }
                {has('embed') &&
                    <IconButton
                        onClick={showPopup(PopupTypes.Embed)}
                        iconName="code"
                        tooltip="Embed"
                    />
                }
                {has('media') &&
                    <IconButton
                        onClick={insertMedia}
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
                {allowsHighlights && has('comments') &&
                    <SelectionButton
                        onClick={showPopup(PopupTypes.Comment)}
                        key="comment-button"
                        iconName="comment"
                        tooltip={gettext('Comment')}
                    />
                }
                {allowsHighlights && has('annotation') &&
                    <SelectionButton
                        onClick={showPopup(PopupTypes.Annotation)}
                        precondition={this.canAnnotate()}
                        key="annotation-button"
                        iconName="pencil"
                        tooltip={gettext('Annotation')}
                    />
                }

                <ToolbarPopup type={popup.type} data={popup.data} />

                {/* LinkToolbar must be the last node. */}
                <LinkToolbar onEdit={showPopup(PopupTypes.Link)} />
            </div>;
    }
}

ToolbarComponent.propTypes = {
    disabled: PropTypes.bool,
    allowsHighlights: PropTypes.bool,
    editorFormat: PropTypes.array,
    activeCell: PropTypes.any,
    addTable: PropTypes.func,
    insertMedia: PropTypes.func,
    showPopup: PropTypes.func,
    popup: PropTypes.object,
    editorState: PropTypes.object,
    editorNode: PropTypes.object,
    scrollContainer: PropTypes.string
};

const mapStateToProps = ({editorFormat, activeCell, allowsHighlights, popup, editorState}) => ({
    editorFormat, activeCell, allowsHighlights, popup, editorState
});

const mapDispatchToProps = (dispatch) => ({
    insertMedia: () => dispatch(actions.insertMedia()),
    showPopup: (type, data) => dispatch(actions.showPopup(type, data)),
    addTable: () => dispatch(actions.addTable())
});

const Toolbar = connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);

export default Toolbar;
