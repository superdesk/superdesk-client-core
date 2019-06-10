import React from 'react';
import {IPropsComponentDropZone} from 'superdesk-api';

interface IState {
    hover: boolean;
}

interface IJQueryDragEvent extends JQueryEventObject {
    originalEvent: DragEvent;
}

export class DropZone extends React.PureComponent<IPropsComponentDropZone, IState> {
    elem: HTMLElement;

    readonly state = {hover: false};

    constructor(props) {
        super(props);

        this.onDrop = this.onDrop.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
    }

    onDrop(event: IJQueryDragEvent) {
        event.stopPropagation();
        if (this.props.canDrop(event.originalEvent)) {
            event.preventDefault();

            if (this.state.hover) {
                this.setState({hover: false});
            }

            this.props.onDrop(event.originalEvent);
        }
    }

    onDragEnter(event: IJQueryDragEvent) {
        event.stopPropagation();
        const isAllowed = this.props.canDrop(event.originalEvent);

        if (isAllowed) {
            event.preventDefault();
        }

        if (!this.state.hover && isAllowed) {
            this.setState({hover: true});
        }
    }

    onDragLeave(event: IJQueryDragEvent) {
        event.stopPropagation();
        if (this.state.hover) {
            this.setState({hover: false});
        }
    }

    componentDidMount() {
        $(this.elem).on('drop', this.onDrop);
        $(this.elem).on('dragleave', this.onDragLeave);
        $(this.elem).on('dragover dragenter', this.onDragEnter);
    }

    componentWillUnmount() {
        $(this.elem).off('drop dragleave dragover dragenter');
    }

    render() {
        const className = 'item-association' + (this.state.hover ? ' dragover' : '');

        return (
            <button className={className} ref={(elem) => this.elem = elem}>
                {this.props.children ? this.props.children : (
                    <span className="item-association__text-label">
                        {this.props.label}
                    </span>
                )}
            </button>
        );
    }
}
