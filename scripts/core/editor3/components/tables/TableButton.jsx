import React, {Component} from 'react';
import * as actions from '../../actions';
import {connect} from 'react-redux';

export class TableButtonComponent extends Component {
    render() {
        const {addTable} = this.props;

        return (
            <div className="Editor3-styleButton">
                <span onClick={addTable}>tbl</span>
            </div>
        );
    }
}

TableButtonComponent.propTypes = {
    addTable: React.PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
    addTable: () => dispatch(actions.addTable(2, 1))
});

export const TableButton = connect(null, mapDispatchToProps)(TableButtonComponent);
