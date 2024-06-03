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

interface IState {
    displayHandle: boolean;
}

class DraggableEditor3BlockComponent extends React.PureComponent<IProps, IState> {
    timeoutId: number;
    constructor(props: IProps) {
        super(props);

        this.state = {
            displayHandle: false,
        };
    }

    componentWillUnmount(): void {
        clearTimeout(this.timeoutId);
    }

    render() {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 4,
                }}
                onMouseEnter={() => {
                    this.setState({
                        displayHandle: true,
                    }, () => {
                        window.clearTimeout(this.timeoutId);
                    });
                }}
                onMouseLeave={() => {
                    this.timeoutId = window.setTimeout(() => {
                        this.setState({
                            displayHandle: false,
                        });
                    }, 500);
                }}
            >
                <div
                    className={this.state.displayHandle ? 'draggable-block-handle' : 'draggable-block-handle-hide'}
                    draggable={this.props.readOnly !== true}
                    onDragStart={(e) => {
                        e.dataTransfer.setData(EDITOR_BLOCK_TYPE, this.props.block.getKey());
                    }}
                    onMouseOver={() => {
                        this.setState({
                            displayHandle: true,
                        }, () => {
                            window.clearTimeout(this.timeoutId);
                        });
                    }}
                    onMouseEnter={() => {
                        this.setState({
                            displayHandle: true,
                        }, () => {
                            window.clearTimeout(this.timeoutId);
                        });
                    }}
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

export const DraggableEditor3Block = connect(
    mapStateToProps,
)(DraggableEditor3BlockComponent);
