import React from 'react';
import {connect} from 'react-redux';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {inlineStyles} from '../../helpers/inlineStyles';
import {getData, getCell} from '../../helpers/table';
import {SelectionButtonCustomEditorState} from './SelectionButton';
import {PopupTypes} from '../../actions';
import {gettext} from 'core/utils';
import {IEditorStore} from 'core/editor3/store';
import {blockStyles} from './BlockStyleButtons';
import {EditorState} from 'draft-js';
import {LinkInputMultiLineQuote} from '../links/LinkInput';
import {LinkToolbarMultiLineQuote} from '../links/LinkToolbar';

interface IProps extends Partial<IEditorStore> {
    className: string;
    toggleTableStyle(): void;
    toggleMultiLineQuoteBlockStyle(style: string): void;
    setMultiLineQuotePopup(popupType: string, payload: any): void;
    popup: any;
}

/**
 * Holds the logic for multi-line quote toolbar operations.
 */
const MultiLineQuoteControlsComponent: React.FunctionComponent<IProps> = ({
    activeCell,
    editorState,
    editorFormat,
    toggleTableStyle,
    className,
    setMultiLineQuotePopup,
    toggleMultiLineQuoteBlockStyle,
    popup,
}) => {
    const {i, j, key, currentStyle, selection} = activeCell;
    const contentState = editorState.getCurrentContent();
    const data = getData(contentState, key);
    const cellEditorState: EditorState = getCell(data, i, j, currentStyle, selection);
    const currentInlineStyle = cellEditorState.getCurrentInlineStyle();
    const blockStyle = cellEditorState
        .getCurrentContent()
        .getBlockForKey(cellEditorState.getSelection().getStartKey())
        .getType();

    return (
        <div className={'table-controls ' + className}>
            {
                editorFormat
                    .filter((type) => type in blockStyles && type !== 'quote')
                    .sort()
                    .map((type) => (
                        <StyleButton
                            key={type}
                            active={blockStyles[type] === blockStyle}
                            label={type}
                            onToggle={() => toggleMultiLineQuoteBlockStyle(blockStyles[type])}
                            style={blockStyles[type]}
                        />
                    ))
            }
            {
                editorFormat
                    .filter((type) => type in inlineStyles)
                    .map((type) => (
                        <StyleButton
                            key={type}
                            active={currentInlineStyle.has(inlineStyles[type])}
                            label={type}
                            onToggle={toggleTableStyle}
                            style={inlineStyles[type]}
                        />
                    ))
            }
            <SelectionButtonCustomEditorState
                editorState={cellEditorState}
                onClick={(payload) => setMultiLineQuotePopup(PopupTypes.Link, payload)}
                iconName="link"
                tooltip={gettext('Link')}
            />
            {
                popup.type === PopupTypes.Link && (
                    <LinkInputMultiLineQuote
                        data={popup.data}
                        editorState={cellEditorState}
                    />
                )
            }
            <LinkToolbarMultiLineQuote
                editorState={cellEditorState}
                onEdit={(payload) => setMultiLineQuotePopup(PopupTypes.Link, payload)}
            />
        </div>
    );
};

const mapDispatchToProps = (dispatch) => ({
    toggleTableStyle: (inlineStyle) => dispatch(actions.toggleTableStyle(inlineStyle)),
    toggleMultiLineQuoteBlockStyle: (style: string) => dispatch(actions.toggleMultiLineQuoteBlockStyle(style)),
    setMultiLineQuotePopup: (type, data) => dispatch(actions.setMultiLineQuotePopup(type, data)),
});

const mapStateToProps = ({
    activeCell,
    editorState,
    editorFormat,
    popup,
}) => ({
    activeCell,
    editorState,
    editorFormat,
    popup,
});

export const MultiLineQuoteControls = connect(mapStateToProps, mapDispatchToProps)(MultiLineQuoteControlsComponent);
