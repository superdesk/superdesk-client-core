import React from 'react';
import PropTypes from 'prop-types';
import BlockStyleButtons from './BlockStyleButtons';
import InlineStyleButtons from './InlineStyleButtons';
import TableControls from './TableControls';
import StyleButton from './StyleButton';
import {SelectionButton} from './SelectionButton';
import {IconButton} from './IconButton';
import {ToolbarPopup} from './ToolbarPopup';
import {connect} from 'react-redux';
import {LinkToolbar} from '../links';
import classNames from 'classnames';
import * as actions from '../../actions';
import {PopupTypes} from '../../actions';
import {highlightsConfig} from '../../highlightsConfig';
import {gettext} from 'core/utils';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {boolean} disabled Disables clicking on the toolbar, if true.
 * @description Holds the editor's toolbar.
 */
class ToolbarComponent extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    scrollContainer: any;

    constructor(props) {
        super(props);

        this.scrollContainer = $(props.scrollContainer || window);
        this.onScroll = this.onScroll.bind(this);

        this.state = {
            // When true, the toolbar is floating at the top of the item. This
            // helps the toolbar continue to be visible when it goes out of view
            // because of scrolling.
            floating: false,
            width: 'auto',
        };
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.popup.type === 'NONE' && this.props.popup.type !== 'NONE') {
            // restoring editor focus after closing the popup

            const scrollableElement = document.querySelector('.page-content-container');

            setTimeout(() => { // wait for render
                const {editorWrapperElement} = this.props;

                if (editorWrapperElement instanceof Element !== true) {
                    return;
                }

                const draftjsContentEditable = editorWrapperElement.querySelector('.public-DraftEditor-content');

                if (draftjsContentEditable instanceof Element !== true) {
                    return;
                }

                draftjsContentEditable.focus();

                if (scrollableElement != null) {
                    // prevent fousing from changing scroll position
                    scrollableElement.scrollTop = scrollableElement.scrollTop;
                    scrollableElement.scrollLeft = scrollableElement.scrollLeft;
                }
            });
        }

        return true;
    }

    /**
     * @ngdoc method
     * @name Toolbar#onScroll
     * @description Triggered when the authoring page is scrolled. It adjusts toolbar
     * style, based on the location of the editor within the scroll container.
     */
    onScroll(e) {
        if (!this.props.editorNode) {
            return;
        }

        const editorRect = this.props.editorNode.getBoundingClientRect();
        const pageRect = this.scrollContainer[0].getBoundingClientRect();

        if (!editorRect || !pageRect) {
            return;
        }

        const isToolbarOut = editorRect.top < pageRect.top + 50;
        const isBottomOut = editorRect.bottom < pageRect.top + 60;
        const floating = isToolbarOut && !isBottomOut;
        const width = floating ? editorRect.width : 'auto';

        if (floating !== this.state.floating) {
            this.setState({floating, width});
        }
    }

    componentDidMount() {
        this.scrollContainer.on('scroll', this.onScroll);
    }

    componentWillUnmount() {
        this.scrollContainer.off('scroll', this.onScroll);
    }

    /* eslint-disable complexity */
    render() {
        const {floating} = this.state;
        const {
            disabled,
            popup,
            editorFormat,
            activeCell,
            addTable,
            insertMedia,
            suggestingMode,
            toggleSuggestingMode,
            invisibles,
            toggleInvisibles,
            removeFormat,
            dispatch,
        } = this.props;

        const has = (opt) => editorFormat.indexOf(opt) > -1;
        const showPopup = (type) => (data) => this.props.showPopup(type, data);

        const cx = classNames({
            'Editor3-controls': true,
            'floating-toolbar': floating,
            disabled: disabled && activeCell === null,
        });

        return activeCell !== null ? <TableControls className={cx} /> :
            <div className={cx} style={{width: this.state.width}}>
                {/* Styles */}
                <BlockStyleButtons />
                <InlineStyleButtons />

                {/* Formatting options */}
                {has('link') &&
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
                {has('remove format') &&
                    <SelectionButton
                        onClick={removeFormat}
                        precondition={!suggestingMode}
                        key="remove-format-button"
                        iconName="clear-format"
                        tooltip={gettext('Remove format')}
                    />
                }
                {has('comments') &&
                    <SelectionButton
                        onClick={showPopup(PopupTypes.Comment)}
                        precondition={
                            this.props.highlightsManager.canAddHighlight(highlightsConfig.COMMENT.type)
                        }
                        key="comment-button"
                        iconName="comment"
                        tooltip={gettext('Comment')}
                    />
                }
                {has('annotation') &&
                    <SelectionButton
                        onClick={showPopup(PopupTypes.Annotation)}
                        precondition={
                            this.props.highlightsManager.canAddHighlight(highlightsConfig.ANNOTATION.type)
                        }
                        key="annotation-button"
                        iconName="edit-line"
                        tooltip={gettext('Annotation')}
                    />
                }

                {has('suggestions') &&
                    <StyleButton
                        active={suggestingMode}
                        label={'suggestions'}
                        style={'suggestions'}
                        onToggle={toggleSuggestingMode}
                    />
                }

                {has('formatting marks') &&
                    <StyleButton
                        active={invisibles}
                        label={'invisibles'}
                        style={'invisibles'}
                        onToggle={toggleInvisibles}
                    />
                }

                {has('uppercase') &&
                    <SelectionButton
                        onClick={({selection}) => dispatch(actions.changeCase('uppercase', selection))}
                        precondition={!suggestingMode}
                        key="uppercase-button"
                        iconName="edit-line"
                        tooltip={gettext('convert text to uppercase')}
                    />
                }

                {has('lowercase') &&
                    <SelectionButton
                        onClick={({selection}) => dispatch(actions.changeCase('lowercase', selection))}
                        precondition={!suggestingMode}
                        key="lowercase-button"
                        iconName="edit-line"
                        tooltip={gettext('convert text to lowercase')}
                    />
                }

                <ToolbarPopup
                    type={popup.type}
                    data={popup.data}
                    editorState={this.props.editorState}
                    highlightsManager={this.props.highlightsManager}
                />

                {/* LinkToolbar must be the last node. */}
                <LinkToolbar onEdit={showPopup(PopupTypes.Link)} />
            </div>;
    }
}

ToolbarComponent.propTypes = {
    disabled: PropTypes.bool,
    editorFormat: PropTypes.array,
    activeCell: PropTypes.any,
    suggestingMode: PropTypes.bool,
    invisibles: PropTypes.bool,
    addTable: PropTypes.func,
    insertMedia: PropTypes.func,
    showPopup: PropTypes.func,
    toggleSuggestingMode: PropTypes.func,
    toggleInvisibles: PropTypes.func,
    removeFormat: PropTypes.func,
    popup: PropTypes.object,
    editorState: PropTypes.object,
    editorNode: PropTypes.object,
    scrollContainer: PropTypes.string.isRequired,
    highlightsManager: PropTypes.object.isRequired,
    editorWrapperElement: PropTypes.object,
};

const mapStateToProps = ({
    editorFormat,
    activeCell,
    popup,
    editorState,
    suggestingMode,
    invisibles,
}) => ({
    editorFormat,
    activeCell,
    popup,
    editorState,
    suggestingMode,
    invisibles,
});

const mapDispatchToProps = (dispatch) => ({
    insertMedia: () => dispatch(actions.insertMedia()),
    showPopup: (type, data) => dispatch(actions.showPopup(type, data)),
    addTable: () => dispatch(actions.addTable()),
    toggleSuggestingMode: () => dispatch(actions.toggleSuggestingMode()),
    toggleInvisibles: () => dispatch(actions.toggleInvisibles()),
    removeFormat: () => dispatch(actions.removeFormat()),
    dispatch: dispatch,
});

const Toolbar = connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);

export default Toolbar;
