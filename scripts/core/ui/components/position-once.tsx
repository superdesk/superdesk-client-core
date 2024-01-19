import React from 'react';
import ReactDOM from 'react-dom';
import {IPropsPositioner, PopupPositioner} from './popupNew';

interface IProps extends Omit<IPropsPositioner, 'referenceElement'> {
    delayed?: boolean;
}

interface IState {
    ready: boolean;
}

export class PositionInline extends React.PureComponent<IProps, IState> {
    private referenceEl: null | HTMLDivElement;

    constructor(props: IProps) {
        super(props);

        this.state = {
            ready: props.delayed !== true,
        };

        this.setReady = this.setReady.bind(this);

        this.referenceEl = null;
    }

    public setReady() {
        this.setState({ready: true});
    }

    render() {
        return (
            <div
                ref={(el) => {
                    this.referenceEl = el;
                }}
            >
                {
                    this.state.ready && ReactDOM.createPortal((
                        <PopupPositioner
                            referenceElement={this.referenceEl}
                            placement={this.props.placement}
                            zIndex={this.props.zIndex}
                            onClose={this.props.onClose}
                        >
                            {this.props.children}
                        </PopupPositioner>
                    ), document.body)
                }
            </div>
        );
    }
}
