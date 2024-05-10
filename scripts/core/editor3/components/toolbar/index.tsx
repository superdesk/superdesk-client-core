import React from 'react';
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
import {MultiLineQuoteControls} from './MultiLineQuoteControls';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IEditorStore} from 'core/editor3/store';
import {IEditorComponentProps, RICH_FORMATTING_OPTION} from 'superdesk-api';

interface IState {
    // When true, the toolbar is floating at the top of the item. This
    // helps the toolbar continue to be visible when it goes out of view
    // because of scrolling.
    floating: boolean;

    width: string | number;
}

interface IProps extends Partial<IEditorStore> {
    toggleSuggestingMode(): void;
    showPopup(type, data): void;
    addMultiLineQuote(): void;
    addCustomBlock(): void;
    toggleInvisibles(): void;
    removeAllFormat(): void;
    dispatch(fn: any): void;
    removeFormat(): void;
    insertMedia(): void;
    addTable(): void;
    editorWrapperElement: any;
    scrollContainer: string;
    highlightsManager: any;
    editorNode: any;
    disabled: boolean;
    popup: any;
    uiTheme: IEditorComponentProps<unknown, unknown, unknown>['uiTheme'];
}

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {boolean} disabled Disables clicking on the toolbar, if true.
 * @description Holds the editor's toolbar.
 */
class ToolbarComponent extends React.Component<IProps, IState> {
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
            customToolbarStyle,
            suggestingMode,
            editorFormat,
            invisibles,
            activeCell,
            disabled,
            popup,
            toggleSuggestingMode,
            addMultiLineQuote,
            addCustomBlock,
            toggleInvisibles,
            removeAllFormat,
            removeFormat,
            insertMedia,
            addTable,
            dispatch,
            editorState,
        } = this.props;

        const has = (opt: RICH_FORMATTING_OPTION) => editorFormat.indexOf(opt) > -1;
        const showPopup = (type) => (data) => this.props.showPopup(type, data);
        const cx = classNames({
            'Editor3-controls': true,
            'floating-toolbar': floating,
            disabled: disabled && activeCell === null,
        });

        if (activeCell == null) {
            return (
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
                    <BlockStyleButtons />
                    <InlineStyleButtons />

                    {/* Formatting options */}
                    {has('link') && (
                        <SelectionButton
                            onClick={showPopup(PopupTypes.Link)}
                            iconName="link"
                            tooltip={gettext('Link (Ctrl+K)')}
                            uiTheme={this.props.uiTheme}
                        />
                    )}
                    {has('embed') && (
                        <IconButton
                            onClick={showPopup(PopupTypes.Embed)}
                            iconName="code"
                            tooltip="Embed"
                            uiTheme={this.props.uiTheme}
                        />
                    )}
                    {has('media') && (
                        <IconButton
                            onClick={insertMedia}
                            tooltip={gettext('Media')}
                            iconName="picture"
                            uiTheme={this.props.uiTheme}
                        />
                    )}
                    {has('table') && (
                        <IconButton
                            onClick={addTable}
                            tooltip={gettext('Table')}
                            iconName="table"
                            uiTheme={this.props.uiTheme}
                        />
                    )}
                    {has('multi-line quote') && (
                        <IconButton
                            onClick={() => {
                                addMultiLineQuote();
                            }}
                            tooltip={gettext('Multi-line quote')}
                            iconName="text-block"
                            uiTheme={this.props.uiTheme}
                        />
                    )}
                    {has('custom blocks') && (
                        <IconButton
                            onClick={() => {
                                addCustomBlock();
                            }}
                            tooltip={gettext('Custom block')}
                            iconName="plus-large"
                            uiTheme={this.props.uiTheme}
                        />
                    )}
                    {has('remove format') && (
                        <SelectionButton
                            onClick={removeFormat}
                            precondition={!suggestingMode}
                            key="remove-format-button"
                            iconName="clear-format"
                            tooltip={gettext('Remove formatting')}
                            uiTheme={this.props.uiTheme}
                        />
                    )}
                    {(has('remove all format') && !suggestingMode) && (
                        <IconButton
                            onClick={removeAllFormat}
                            key="remove-all-format-button"
                            iconName="clear-all"
                            tooltip={gettext('Remove all formatting')}
                            uiTheme={this.props.uiTheme}
                        />
                    )}
                    {has('comments') && (
                        <SelectionButton
                            onClick={showPopup(PopupTypes.Comment)}
                            precondition={
                                this.props.highlightsManager.canAddHighlight(getHighlightsConfig().COMMENT.type)
                            }
                            key="comment-button"
                            iconName="comment"
                            tooltip={gettext('Comment')}
                            uiTheme={this.props.uiTheme}
                        />
                    )}
                    {has('annotation') && (
                        <SelectionButton
                            onClick={showPopup(PopupTypes.Annotation)}
                            precondition={
                                this.props.highlightsManager.canAddHighlight(getHighlightsConfig().ANNOTATION.type)
                            }
                            key="annotation-button"
                            iconName="edit-line"
                            tooltip={gettext('Annotation')}
                            uiTheme={this.props.uiTheme}
                        />
                    )}

                    {has('suggestions') && (
                        <StyleButton
                            active={suggestingMode}
                            label={'suggestions'}
                            style={'suggestions'}
                            onToggle={toggleSuggestingMode}
                            uiTheme={this.props.uiTheme}
                        />
                    )}

                    {has('formatting marks') && (
                        <StyleButton
                            active={invisibles}
                            label={'invisibles'}
                            style={'invisibles'}
                            onToggle={toggleInvisibles}
                            uiTheme={this.props.uiTheme}
                        />
                    )}

                    {has('uppercase') && (
                        <SelectionButton
                            onClick={({selection}) => dispatch(changeCase('uppercase', selection))}
                            precondition={!suggestingMode}
                            key="uppercase-button"
                            iconName="to-uppercase"
                            tooltip={gettext('Convert text to uppercase')}
                            uiTheme={this.props.uiTheme}
                        />
                    )}

                    {has('lowercase') && (
                        <SelectionButton
                            onClick={({selection}) => dispatch(changeCase('lowercase', selection))}
                            precondition={!suggestingMode}
                            key="lowercase-button"
                            iconName="to-lowercase"
                            tooltip={gettext('Convert text to lowercase')}
                            uiTheme={this.props.uiTheme}
                        />
                    )}

                    {has('undo') && (
                        <IconButton
                            onClick={() => {
                                this.props.dispatch(undo());
                            }}
                            tooltip={gettext('Undo') + ' (ctrl + z)'}
                            iconName="undo"
                            uiTheme={this.props.uiTheme}
                        />
                    )}

                    {has('redo') && (
                        <IconButton
                            onClick={() => {
                                this.props.dispatch(redo());
                            }}
                            tooltip={gettext('Redo') + ' (ctrl + y)'}
                            iconName="redo"
                            uiTheme={this.props.uiTheme}
                        />
                    )}

                    <ToolbarPopup
                        type={popup.type}
                        data={popup.data}
                        editorState={this.props.editorState}
                        highlightsManager={this.props.highlightsManager}
                        uiTheme={this.props.uiTheme}
                    />

                    {/* LinkToolbar must be the last node. */}
                    <LinkToolbar editorState={editorState} onEdit={showPopup(PopupTypes.Link)} />
                </div>
            );
        } else if (customToolbarStyle === 'multiLineQuote') {
            return <MultiLineQuoteControls className={cx} />;
        } else if (activeCell || customToolbarStyle === 'table') {
            return <TableControls className={cx} />;
        } else {
            assertNever(customToolbarStyle);
        }
    }
}

const mapStateToProps = ({
    editorFormat,
    activeCell,
    popup,
    editorState,
    suggestingMode,
    invisibles,
    customToolbarStyle,
}) => ({
    editorFormat,
    activeCell,
    popup,
    editorState,
    suggestingMode,
    invisibles,
    customToolbarStyle,
});

const mapDispatchToProps = (dispatch: (fn: any) => void) => ({
    insertMedia: () => dispatch(actions.insertMedia()),
    showPopup: (type, data) => dispatch(actions.showPopup(type, data)),
    addTable: () => dispatch(actions.addTable()),
    addMultiLineQuote: () => dispatch(actions.addMultiLineQuote()),
    addCustomBlock: () => dispatch(actions.addCustomBlock()),
    toggleSuggestingMode: () => dispatch(actions.toggleSuggestingMode()),
    toggleInvisibles: () => dispatch(actions.toggleInvisibles()),
    removeFormat: () => dispatch(actions.removeFormat()),
    removeAllFormat: () => dispatch(actions.removeAllFormat()),
    dispatch: dispatch,
});

const Toolbar = connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);

export default Toolbar;
