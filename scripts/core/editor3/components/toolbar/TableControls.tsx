import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {inlineStyles} from '../../helpers/inlineStyles';
import {getData, getCell} from '../../helpers/table';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name TableControlsComponent
 * @param {Function} addRowAfter
 * @param {Function} addColAfter
 * @param {Function} removeRow
 * @param {Function} removeCol
 * @description Holds the toolbar for table operations.
 */
const TableControlsComponent:React.StatelessComponent<any> = ({
    addRowAfter,
    addColAfter,
    removeRow,
    removeCol,
    activeCell,
    editorState,
    editorFormat,
    toggleTableHead,
    toggleTableStyle,
    className,
}) => {
    const {i, j, key, currentStyle, selection} = activeCell;
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(key);
    const data = getData(editorState, block);
    const {withHeader} = data;
    const cellEditorState = getCell(data, i, j, currentStyle, selection);
    const currentInlineStyle = cellEditorState.getCurrentInlineStyle();

    return <div className={'table-controls ' + className}>
        <StyleButton active={withHeader} label={'TH'} onToggle={toggleTableHead} />
        <span className="Editor3-styleButton Editor3-styleButton--short"
            onClick={removeRow}><i className="icon-minus-sign" /></span>
        <span className="Editor3-styleButton"
            onClick={addRowAfter}><i className="icon-plus-sign" /> row</span>
        <span className="Editor3-styleButton Editor3-styleButton--short"
            onClick={removeCol}><i className="icon-minus-sign" /></span>
        <span className="Editor3-styleButton" onClick={addColAfter}><i className="icon-plus-sign" /> col</span>
        {editorFormat.filter((type) => type in inlineStyles)
            .map((type) =>
                <StyleButton
                    key={type}
                    active={currentInlineStyle.has(inlineStyles[type])}
                    label={type}
                    onToggle={toggleTableStyle}
                    style={inlineStyles[type]}
                />
            )
        }
    </div>;
};

TableControlsComponent.propTypes = {
    addRowAfter: PropTypes.func,
    addColAfter: PropTypes.func,
    removeRow: PropTypes.func,
    removeCol: PropTypes.func,
    activeCell: PropTypes.object.isRequired,
    editorState: PropTypes.object,
    editorFormat: PropTypes.array,
    toggleTableHead: PropTypes.func,
    toggleTableStyle: PropTypes.func,
    className: PropTypes.string,
};

const mapDispatchToProps = (dispatch) => ({
    addRowAfter: () => dispatch(actions.addRowAfter()),
    addColAfter: () => dispatch(actions.addColAfter()),
    removeRow: () => dispatch(actions.removeRow()),
    removeCol: () => dispatch(actions.removeCol()),
    toggleTableHead: () => dispatch(actions.toggleTableHeader()),
    toggleTableStyle: (inlineStyle) => dispatch(actions.toggleTableStyle(inlineStyle)),
});

const mapStateToProps = (state) => ({
    activeCell: state.activeCell,
    editorState: state.editorState,
    editorFormat: state.editorFormat,
});

const TableControls = connect(mapStateToProps, mapDispatchToProps)(TableControlsComponent);

export default TableControls;
