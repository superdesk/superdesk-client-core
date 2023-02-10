import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {inlineStyles} from '../../helpers/inlineStyles';
import {getData, getCell} from '../../helpers/table';
import {SelectionButton} from './SelectionButton';
import {PopupTypes} from '../../actions';
import {gettext} from 'core/utils';
import {LinkToolbar} from '../links';

/**
 * Holds the toolbar for multi-line quote operations.
 */
const MultiLineQuoteControlsComponent: React.StatelessComponent<any> = ({
    activeCell,
    editorState,
    editorFormat,
    toggleTableStyle,
    className,
    showPopup,
}) => {
    const {i, j, key, currentStyle, selection} = activeCell;
    const contentState = editorState.getCurrentContent();
    const data = getData(contentState, key);
    const cellEditorState = getCell(data, i, j, currentStyle, selection);
    const currentInlineStyle = cellEditorState.getCurrentInlineStyle();

    return (
        <div className={'table-controls ' + className}>
            {
                editorFormat
                    .filter((type) => type in inlineStyles || type === 'link')
                    .map((type) => {
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
                                    onClick={(payload) => showPopup(PopupTypes.Link, payload)}
                                    iconName="link"
                                    tooltip={gettext('Link')}
                                />
                            );
                        }
                    })
            }
            <LinkToolbar onEdit={(payload) => showPopup(PopupTypes.Link, payload)} />
        </div>
    );
};

MultiLineQuoteControlsComponent.propTypes = {
    activeCell: PropTypes.object.isRequired,
    editorState: PropTypes.object,
    editorFormat: PropTypes.array,
    toggleTableStyle: PropTypes.func,
    className: PropTypes.string,
    showPopup: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
    toggleTableStyle: (inlineStyle) => dispatch(actions.toggleTableStyle(inlineStyle)),
    showPopup: (type, data) => dispatch(actions.showPopup(type, data)),
});

const mapStateToProps = (state) => ({
    activeCell: state.activeCell,
    editorState: state.editorState,
    editorFormat: state.editorFormat,
    showPopup: state.showPopup,
});

export const MultiLineQuoteControls = connect(mapStateToProps, mapDispatchToProps)(MultiLineQuoteControlsComponent);
