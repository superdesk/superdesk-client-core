import React from 'react';
import {ContentBlock} from 'draft-js';
import {EDITOR_BLOCK_TYPE} from 'core/editor3/constants';
import {connect} from 'react-redux';
import {DragHandle} from 'superdesk-ui-framework/react';

interface IProps {
    block: ContentBlock;
    readOnly?: boolean; // connected
    children: React.ReactNode;
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
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 4,
                }}
            >
                <div
                    draggable={this.props.readOnly !== true}
                    onDragStart={this.onDragStart}
                >
                    <DragHandle />
                </div>
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
