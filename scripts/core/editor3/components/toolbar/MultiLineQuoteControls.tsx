import React from 'react';
import {connect} from 'react-redux';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {inlineStyles} from '../../helpers/inlineStyles';
import {getData, getCell} from '../../helpers/table';
import {SelectionButton} from './SelectionButton';
import {PopupTypes} from '../../actions';
import {gettext} from 'core/utils';
import {LinkToolbar} from '../links';
import {IEditorStore} from 'core/editor3/store';
import {blockStyles} from './BlockStyleButtons';
import {EditorState} from 'draft-js';

interface IProps extends Partial<IEditorStore> {
    className: string;
    toggleTableStyle(): void;
    toggleMultiLineQuoteBlockStyle(style: string): void;
    setMultiLineQuotePopup(popupType: string, payload: any): void;
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
}) => {
    const {i, j, key, currentStyle, selection} = activeCell;
    const contentState = editorState.getCurrentContent();
    const data = getData(contentState, key);
    const cellEditorState: EditorState = getCell(data, i, j, currentStyle, selection);
    const currentInlineStyle = cellEditorState.getCurrentInlineStyle();
    const blockStyle: Array<string> = Object.values(
        cellEditorState.getCurrentContent().getBlockMap().map((x) => x.getType()).toJS(),
    );

    return (
        <div className={'table-controls ' + className}>
            {
                editorFormat
                    .filter((type) =>
                        type in blockStyles
                        && type !== 'quote'
                        || type in inlineStyles
                        || type === 'link'
                    )
                    .map((type) => {
                        if (type in blockStyles) {
                            return (
                                <StyleButton
                                    key={type}
                                    active={blockStyle.includes(blockStyles[type])}
                                    label={type}
                                    onToggle={() => toggleMultiLineQuoteBlockStyle(blockStyles[type])}
                                    style={blockStyles[type]}
                                />
                            );
                        }

                        if (type !== 'link') {
                            return (
                                <StyleButton
                                    key={type}
                                    active={currentInlineStyle.has(inlineStyles[type])}
                                    label={type}
                                    onToggle={toggleTableStyle}
                                    style={inlineStyles[type]}
                                />
                            );
                        } else {
                            return (
                                <SelectionButton
                                    onClick={(payload) => setMultiLineQuotePopup(PopupTypes.Link, payload)}
                                    iconName="link"
                                    tooltip={gettext('Link')}
                                />
                            );
                        }
                    })
            }
            {
                cellEditorState && (
                    <LinkToolbar
                        editorState={cellEditorState}
                        onEdit={(payload) => setMultiLineQuotePopup(PopupTypes.Link, payload)}
                    />
                )
            }
        </div>
    );
};

const mapDispatchToProps = (dispatch) => ({
    toggleTableStyle: (inlineStyle) => dispatch(actions.toggleTableStyle(inlineStyle)),
    toggleMultiLineQuoteBlockStyle: (style: string) => dispatch(actions.toggleMultiLineQuoteBlockStyle(style)),
    setMultiLineQuotePopup: (type, data) => dispatch(actions.setMultiLineQuotePopup(type, data)),
});

const mapStateToProps = (state) => ({
    activeCell: state.activeCell,
    editorState: state.editorState,
    editorFormat: state.editorFormat,
    showPopup: state.showPopup,
});

export const MultiLineQuoteControls = connect(mapStateToProps, mapDispatchToProps)(MultiLineQuoteControlsComponent);
