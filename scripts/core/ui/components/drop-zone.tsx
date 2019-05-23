import React from 'react';
import classnames from 'classnames';

interface IProps {
    text: string;
    allowedTypes: Array<string>;
    onDrop: ({data: any}) => any;
}

interface IState {
    hover: boolean;
}

interface IJQueryDragEvent extends JQueryEventObject {
    originalEvent: DragEvent;
}

export class DropZone extends React.PureComponent<IProps, IState> {
    elem: HTMLElement;

    readonly state = {hover: false};

    constructor(props) {
        super(props);

        this.onDrop = this.onDrop.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
    }

    getAllowed(event: DragEvent) {
        return this.props.allowedTypes.find((allowedType) => event.dataTransfer.types.includes(allowedType));
    }

    isAllowed(event: DragEvent) {
        return this.getAllowed(event) != null;
    }

    onDrop(event: IJQueryDragEvent) {
        event.stopPropagation();
        if (this.isAllowed(event.originalEvent)) {
            event.preventDefault();

            if (this.state.hover) {
                this.setState({hover: false});
            }

            const allowedType = this.getAllowed(event.originalEvent);
            const data = event.originalEvent.dataTransfer.getData(allowedType);

            if (data) {
                this.props.onDrop({data});
            } else {
                console.error('no data for type', allowedType);
            }
        }
    }

    onDragEnter(event: IJQueryDragEvent) {
        event.stopPropagation();
        const isAllowed = this.isAllowed(event.originalEvent);

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
        return (
            <button className={classnames('item-association', {
                dragover: this.state.hover,
            })} ref={(elem) => this.elem = elem}>
                {this.props.children ? this.props.children : (
                    <span className="item-association__text-label">
                        {this.props.text}
                    </span>
                )}
            </button>
        );
    }
}
