import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import StyleButton from './StyleButton';
import * as actions from '../../actions';

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
const TableControlsComponent = ({
    addRowAfter,
    addColAfter,
    removeRow,
    removeCol,
    activeCell,
    editorState,
    toggleTableHead
}) => {
    const {key} = activeCell;
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(key);
    const entityKey = block.getEntityAt(0);
    const entity = contentState.getEntity(entityKey);
    const {withHeader} = entity.getData().data;

    return <div className="Editor3-controls table-controls">
        <StyleButton active={withHeader} label={'TH'} onToggle={toggleTableHead} />
        <span className="Editor3-styleButton Editor3-styleButton--short" onClick={removeRow}><i className="icon-minus-sign" /></span>
        <span className="Editor3-styleButton" onClick={addRowAfter}><i className="icon-plus-sign" /> row</span>
        <span className="Editor3-styleButton Editor3-styleButton--short" onClick={removeCol}><i className="icon-minus-sign" /></span>
        <span className="Editor3-styleButton" onClick={addColAfter}><i className="icon-plus-sign" /> col</span>
    </div>;
};

TableControlsComponent.propTypes = {
    addRowAfter: PropTypes.func,
    addColAfter: PropTypes.func,
    removeRow: PropTypes.func,
    removeCol: PropTypes.func,
    activeCell: PropTypes.object.isRequired,
    editorState: PropTypes.object,
    toggleTableHead: PropTypes.func
};

const mapDispatchToProps = (dispatch) => ({
    addRowAfter: () => dispatch(actions.addRowAfter()),
    addColAfter: () => dispatch(actions.addColAfter()),
    removeRow: () => dispatch(actions.removeRow()),
    removeCol: () => dispatch(actions.removeCol()),
    toggleTableHead: () => dispatch(actions.toggleTableHeader()),
});

const mapStateToProps = (state) => ({
    activeCell: state.activeCell,
    editorState: state.editorState
});

const TableControls = connect(mapStateToProps, mapDispatchToProps)(TableControlsComponent);

export default TableControls;
