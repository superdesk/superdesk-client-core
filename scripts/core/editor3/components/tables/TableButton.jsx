import React, {Component} from 'react';
import PropTypes from 'prop-types';
import * as actions from '../../actions';
import {connect} from 'react-redux';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name TableButtonComponent
 * @param addTable {Function} Action to trigger adding a table.
 * @description Holds the toolbar button that allows adding a table to the editor.
 */
export class TableButtonComponent extends Component {
    render() {
        const {addTable} = this.props;

        return (
            <div data-flow={'down'} data-sd-tooltip="Table" className="Editor3-styleButton">
                <span onClick={addTable}><i className="icon-table" /></span>
            </div>
        );
    }
}

TableButtonComponent.propTypes = {
    addTable: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
    addTable: () => dispatch(actions.addTable(1, 2))
});

export const TableButton = connect(null, mapDispatchToProps)(TableButtonComponent);
