import React from 'react';
import {ContentBlock} from 'draft-js';
import {EDITOR_BLOCK_TYPE} from 'core/editor3/constants';
import {connect} from 'react-redux';

interface IProps {
    block: ContentBlock;
    readOnly?: boolean; // connected
}

class DragableEditor3BlockComponent extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.onDragStart = this.onDragStart.bind(this);
    }
    onDragStart(event) {
        event.dataTransfer.setData(EDITOR_BLOCK_TYPE, this.props.block.getKey());
    }
    render() {
        return (
            <div draggable={this.props.readOnly !== true} onDragStart={this.onDragStart}>
                {this.props.children}
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    readOnly: state.readOnly,
});

export const DragableEditor3Block = connect(
    mapStateToProps,
)(DragableEditor3BlockComponent);
