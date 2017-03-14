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
        this.addRow = this.addRow.bind(this);
        this.addColumn = this.addColumn.bind(this);
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

    addRow(e) {
        e.stopPropagation();

        const entityKey = this.props.block.getEntityAt(0);
        const data = this.data();

        data.h++;
        Entity.mergeData(entityKey, {data});

        this.forceUpdate();
    }

    addColumn(e) {
        e.stopPropagation();

        const entityKey = this.props.block.getEntityAt(0);
        const data = this.data();

        data.w++;
        Entity.mergeData(entityKey, {data});

        this.forceUpdate();
    }

    render() {
        const {w, h} = this.data();
        const {setReadOnly, parentReadOnly} = this.props;

        return (
            <div className="table-block">
                {parentReadOnly ? <div className="table-block__controls">
                    <span onClick={this.addRow}>+ Row</span>
                    <span onClick={this.addColumn}>+ Col</span>
                </div> : null}
                <table>
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
            </div>
        );
    }
}

TableBlockComponent.propTypes = {
    block: React.PropTypes.object.isRequired,
    contentState: React.PropTypes.object.isRequired,
    setReadOnly: React.PropTypes.func.isRequired,
    parentReadOnly: React.PropTypes.bool.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
    setReadOnly: (e) => dispatch(actions.setReadOnly())
});

const mapStateToProps = (state) => ({
    parentReadOnly: state.readOnly
});

export const TableBlock = connect(mapStateToProps, mapDispatchToProps)(TableBlockComponent);
