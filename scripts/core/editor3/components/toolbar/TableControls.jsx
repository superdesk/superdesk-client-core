import React from 'react';
import {connect} from 'react-redux';
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
const TableControlsComponent = ({addRowAfter, addColAfter, removeRow, removeCol}) =>
    <div className="Editor3-controls table-controls">
        <span className="Editor3-styleButton short" onClick={removeRow}><i className="icon-minus-sign" /></span>
        <span className="Editor3-styleButton" onClick={addRowAfter}><i className="icon-plus-sign" /> row</span>
        <span className="Editor3-styleButton short" onClick={removeCol}><i className="icon-minus-sign" /></span>
        <span className="Editor3-styleButton" onClick={addColAfter}><i className="icon-plus-sign" /> col</span>
    </div>;

TableControlsComponent.propTypes = {
    addRowAfter: React.PropTypes.func,
    addColAfter: React.PropTypes.func,
    removeRow: React.PropTypes.func,
    removeCol: React.PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
    addRowAfter: () => dispatch(actions.addRowAfter()),
    addColAfter: () => dispatch(actions.addColAfter()),
    removeRow: () => dispatch(actions.removeRow()),
    removeCol: () => dispatch(actions.removeCol())
});

const TableControls = connect(null, mapDispatchToProps)(TableControlsComponent);

export default TableControls;
