import React, {Component} from 'react';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {TableCell} from '.';
import {ContentState, Entity, convertToRaw, convertFromRaw} from 'draft-js';

export class TableBlockComponent extends Component {
    constructor(props) {
        super(props);

        this.setCell = this.setCell.bind(this);
        this.getCell = this.getCell.bind(this);
        this.data = this.data.bind(this);
    }

    setCell(row, col, cellState) {
        const contentState = cellState.getCurrentContent();
        const data = this.data();
        const entityKey = this.props.block.getEntityAt(0);

        if (!data.cells[row]) {
            data.cells[row] = [];
        }

        data.cells[row][col] = convertToRaw(contentState);

        Entity.replaceData(entityKey, {data});
    }

    getCell(row, col) {
        const {cells} = this.data();

        if (!cells[row] || !cells[row][col]) {
            return ContentState.createFromText('');
        }

        return convertFromRaw(cells[row][col]);
    }

    data() {
        const {block, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {data} = entity.getData();

        return data;
    }

    render() {
        const {w, h} = this.data();
        const {setReadOnly} = this.props;

        return (
            <table className="table-block">
                <tbody>
                    {Array.from(new Array(h)).map((v, i) =>
                        <tr key={`col-${i}`}>
                            {Array.from(new Array(w)).map((v, j) =>
                                <TableCell
                                    key={`cell-${i}-${j}`}
                                    contentState={this.getCell(i, j)}
                                    onChange={this.setCell.bind(this, i, j)}
                                    onFocus={setReadOnly} />
                            )}
                        </tr>
                    )}
                </tbody>
            </table>
        );
    }
}

TableBlockComponent.propTypes = {
    block: React.PropTypes.object.isRequired,
    contentState: React.PropTypes.object.isRequired,
    setReadOnly: React.PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
    setReadOnly: (e) => dispatch(actions.setReadOnly())
});

export const TableBlock = connect(null, mapDispatchToProps)(TableBlockComponent);
