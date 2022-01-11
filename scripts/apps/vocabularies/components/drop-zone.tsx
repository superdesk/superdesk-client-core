import React from 'react';
import {IDropZoneComponentProps} from 'superdesk-api';
import {gettext} from 'core/utils';

interface IState {
    hover: boolean;
}

interface IJQueryDragEvent extends JQueryEventObject {
    originalEvent: DragEvent;
}

export class DropZone extends React.PureComponent<IDropZoneComponentProps, IState> {
    elem: React.RefObject<HTMLButtonElement>;
    input: React.RefObject<HTMLInputElement>;

    readonly state = {hover: false};

    constructor(props) {
        super(props);

        this.elem = React.createRef();
        this.input = React.createRef();

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
        $(this.elem.current).on('drop', this.onDrop);
        $(this.elem.current).on('dragleave', this.onDragLeave);
        $(this.elem.current).on('dragover dragenter', this.onDragEnter);
    }

    componentWillUnmount() {
        $(this.elem.current).off('drop dragleave dragover dragenter');
    }

    render() {
        const className = (
            this.props.className != null ? this.props.className : 'item-association'
        ) + (this.state.hover ? ' dragover' : '');

        return (
            <button
                className={className}
                ref={this.elem}
                onClick={() => {
                    if (this.input.current != null) {
                        this.input.current.click();
                    }
                }}
            >
                {this.props.children ? this.props.children : (
                    <div>
                        <div><i className="big-icon--upload-alt icon" /></div>
                        <span className="item-association__text-label">
                            {gettext(this.props.label)}
                        </span>
                        <div>
                            <button className="btn btn--hollow btn--primary">
                                {gettext('Select Files')}
                            </button>
                        </div>
                    </div>
                )}
                {this.props.onFileSelect != null && (
                    <input
                        type="file"
                        style={{display: 'none'}}
                        ref={this.input}
                        multiple={this.props.multiple}
                        onChange={(event) => {
                            event.preventDefault();
                            if (this.input.current.files.length) {
                                this.props.onFileSelect(this.input.current.files);
                            }
                            event.target.value = null; // reset to allow selecting same file again
                        }}
                        accept={this.props.fileAccept}
                    />
                )}
            </button>
        );
    }
}
