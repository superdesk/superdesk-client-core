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
import {PopupTypes, changeCase, undo, redo} from '../../actions';
import {getHighlightsConfig} from '../../highlightsConfig';
import {gettext} from 'core/utils';

interface IState {
    // When true, the toolbar is floating at the top of the item. This
    // helps the toolbar continue to be visible when it goes out of view
    // because of scrolling.
    floating: boolean;

    width: string | number;
}

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {boolean} disabled Disables clicking on the toolbar, if true.
 * @description Holds the editor's toolbar.
 */
class ToolbarComponent extends React.Component<any, IState> {
    static propTypes: any;
    static defaultProps: any;

    scrollContainer: any;
    toolbarNode: any;

    constructor(props) {
        super(props);

        this.onScroll = this.onScroll.bind(this);

        this.computeState = this.computeState.bind(this);

        this.state = this.computeState();

        this.toolbarNode = React.createRef();
    }

    computeState(): IState {
        const defaultState = {
            floating: false,
            width: 'auto',
        };

        if (this.props.editorNode?.current == null || this.toolbarNode?.current == null) {
            return defaultState;
        }

        const editorRect = this.props.editorNode.current.getBoundingClientRect();
        const pageRect = this.scrollContainer[0].getBoundingClientRect();

        if (!editorRect || !pageRect) {
            return defaultState;
        }

        const isToolbarOut = editorRect.top < pageRect.top + 80;
        const isBottomOut = editorRect.bottom < pageRect.top + 70;

        const isContentLarger = this.props.editorNode.current.clientHeight < this.toolbarNode.current.clientHeight;

        const floating = !isContentLarger && isToolbarOut && !isBottomOut;
        const width = floating ? editorRect.width : 'auto';

        return {floating, width};
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.popup.type === 'NONE' && this.props.popup.type !== 'NONE') {
            // restoring editor focus after closing the popup

            const scrollableElement = document.querySelector('.page-content-container--scrollable');

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

                    // eslint-disable-next-line no-self-assign
                    scrollableElement.scrollTop = scrollableElement.scrollTop;

                    // eslint-disable-next-line no-self-assign
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
        this.setState(this.computeState());
    }

    componentDidMount() {
        this.scrollContainer = $(this.props.scrollContainer || window);
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
            removeAllFormat,
            dispatch,
        } = this.props;

        const has = (opt) => editorFormat.indexOf(opt) > -1;
        const showPopup = (type) => (data) => this.props.showPopup(type, data);

        const cx = classNames({
            'Editor3-controls': true,
            'floating-toolbar': floating,
            disabled: disabled && activeCell === null,
        });

        return activeCell !== null ? <TableControls className={cx} /> : (
            <div
                className={cx}
                style={{
                    width: this.state.width,
                    backgroundColor: this.props.uiTheme == null
                        ? undefined
                        : this.props.uiTheme.backgroundColorSecondary,
                    color: this.props.uiTheme == null ? undefined : this.props.uiTheme.textColor,
                }}
                ref={this.toolbarNode}
            >
                {/* Styles */}
                <BlockStyleButtons uiTheme={this.props.uiTheme} />
                <InlineStyleButtons uiTheme={this.props.uiTheme} />

                {/* Formatting options */}
                {has('link') && (
                    <SelectionButton
                        uiTheme={this.props.uiTheme}
                        onClick={showPopup(PopupTypes.Link)}
                        iconName="link"
                        tooltip={gettext('Link')}
                    />
                )}
                {has('embed') && (
                    <IconButton
                        uiTheme={this.props.uiTheme}
                        onClick={showPopup(PopupTypes.Embed)}
                        iconName="code"
                        tooltip="Embed"
                    />
                )}
                {has('media') && (
                    <IconButton
                        uiTheme={this.props.uiTheme}
                        onClick={insertMedia}
                        tooltip={gettext('Media')}
                        iconName="picture"
                    />
                )}
                {has('table') && (
                    <IconButton
                        uiTheme={this.props.uiTheme}
                        onClick={addTable}
                        tooltip={gettext('Table')}
                        iconName="table"
                    />
                )}
                {has('remove format') && (
                    <SelectionButton
                        uiTheme={this.props.uiTheme}
                        onClick={removeFormat}
                        precondition={!suggestingMode}
                        key="remove-format-button"
                        iconName="clear-format"
                        tooltip={gettext('Remove formatting')}
                    />
                )}
                {has('remove all format') && (
                    <IconButton
                        uiTheme={this.props.uiTheme}
                        onClick={removeAllFormat}
                        key="remove-all-format-button"
                        iconName="clear-all"
                        tooltip={gettext('Remove all formatting')}
                    />
                )}
                {has('comments') && (
                    <SelectionButton
                        uiTheme={this.props.uiTheme}
                        onClick={showPopup(PopupTypes.Comment)}
                        precondition={
                            this.props.highlightsManager.canAddHighlight(getHighlightsConfig().COMMENT.type)
                        }
                        key="comment-button"
                        iconName="comment"
                        tooltip={gettext('Comment')}
                    />
                )}
                {has('annotation') && (
                    <SelectionButton
                        uiTheme={this.props.uiTheme}
                        onClick={showPopup(PopupTypes.Annotation)}
                        precondition={
                            this.props.highlightsManager.canAddHighlight(getHighlightsConfig().ANNOTATION.type)
                        }
                        key="annotation-button"
                        iconName="edit-line"
                        tooltip={gettext('Annotation')}
                    />
                )}

                {has('suggestions') && (
                    <StyleButton
                        uiTheme={this.props.uiTheme}
                        active={suggestingMode}
                        label={'suggestions'}
                        style={'suggestions'}
                        onToggle={toggleSuggestingMode}
                    />
                )}

                {has('formatting marks') && (
                    <StyleButton
                        uiTheme={this.props.uiTheme}
                        active={invisibles}
                        label={'invisibles'}
                        style={'invisibles'}
                        onToggle={toggleInvisibles}
                    />
                )}

                {has('uppercase') && (
                    <SelectionButton
                        uiTheme={this.props.uiTheme}
                        onClick={({selection}) => dispatch(changeCase('uppercase', selection))}
                        precondition={!suggestingMode}
                        key="uppercase-button"
                        iconName="to-uppercase"
                        tooltip={gettext('Convert text to uppercase')}
                    />
                )}

                {has('lowercase') && (
                    <SelectionButton
                        uiTheme={this.props.uiTheme}
                        onClick={({selection}) => dispatch(changeCase('lowercase', selection))}
                        precondition={!suggestingMode}
                        key="lowercase-button"
                        iconName="to-lowercase"
                        tooltip={gettext('Convert text to lowercase')}
                    />
                )}

                {has('undo') && (
                    <IconButton
                        uiTheme={this.props.uiTheme}
                        onClick={() => {
                            this.props.dispatch(undo());
                        }}
                        tooltip={gettext('Undo') + ' (ctrl + z)'}
                        iconName="undo"
                    />
                )}

                {has('redo') && (
                    <IconButton
                        uiTheme={this.props.uiTheme}
                        onClick={() => {
                            this.props.dispatch(redo());
                        }}
                        tooltip={gettext('Redo') + ' (ctrl + y)'}
                        iconName="redo"
                    />
                )}

                <ToolbarPopup
                    uiTheme={this.props.uiTheme}
                    type={popup.type}
                    data={popup.data}
                    editorState={this.props.editorState}
                    highlightsManager={this.props.highlightsManager}
                />

                {/* LinkToolbar must be the last node. */}
                <LinkToolbar onEdit={showPopup(PopupTypes.Link)} />
            </div>
        );
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
    removeAllFormat: () => dispatch(actions.removeAllFormat()),
    dispatch: dispatch,
});

const Toolbar = connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);

export default Toolbar;
