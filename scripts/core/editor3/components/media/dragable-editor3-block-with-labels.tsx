import React from 'react';
import {ContentBlock} from 'draft-js';
import {connect} from 'react-redux';
import {DragHandle} from 'superdesk-ui-framework/react';
import {EDITOR_BLOCK_TYPE} from 'core/editor3/constants';

interface IState {
    // Dragging is enabled only when mouse cursor is inside drag handle.
    // It can't always be enabled because attempting to select text outside of drag handle would initiate dragging.
    draggingEnabled: boolean;
}

interface IProps {
    block: ContentBlock;
    readOnly?: boolean; // connected
    children: React.ReactNode;
    customDragHandle?: React.ComponentType;
}

class DraggableEditor3BlockComponentWithInlineHandle extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            draggingEnabled: false,
        };
    }

    render() {
        const CustomDragHandle = this.props.customDragHandle;

        return (
            <div
                draggable={this.state.draggingEnabled && this.props.readOnly !== true}
                onDragStart={(e) => {
                    e.dataTransfer.setData(EDITOR_BLOCK_TYPE, this.props.block.getKey());
                }}
            >
                <div
                    onMouseEnter={() => {
                        this.setState({
                            draggingEnabled: true,
                        });
                    }}
                    onMouseLeave={() => {
                        this.setState({
                            draggingEnabled: false,
                        });
                    }}
                >
                    {
                        this.props.customDragHandle != null
                            ? <CustomDragHandle />
                            : <DragHandle />
                    }
                </div>

                {this.props.children}
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    readOnly: state.readOnly,
});

export const DraggableEditor3BlockWithInlineHandle = connect(
    mapStateToProps,
)(DraggableEditor3BlockComponentWithInlineHandle);
