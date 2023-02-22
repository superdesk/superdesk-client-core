import React from 'react';
import {IDropZoneComponentProps} from 'superdesk-api';
import {gettext} from 'core/utils';

interface IState {
    hover: boolean;
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
        this.onDropOver = this.onDropOver.bind(this);
    }

    onDropOver(event) {
        event.preventDefault();
    }

    onDrop(event) {
        event.preventDefault();

        if (this.props.canDrop(event)) {
            event.preventDefault();

            if (this.state.hover) {
                this.setState({hover: false});
            }

            this.props.onDrop(event);
        }
    }

    componentDidMount() {
        this.elem.current.addEventListener('dragover', this.onDropOver);
        this.elem.current.addEventListener('drop', this.onDrop);
    }

    componentWillUnmount() {
        this.elem.current.removeEventListener('drop', this.onDrop);
        this.elem.current.removeEventListener('dragover', this.onDropOver);
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
                    <>
                        <i className="big-icon--upload-alt sd-file-upload__icon" />
                        <span className="item-association__text-label">
                            {gettext(this.props.label)}
                        </span>
                        <div>
                            <span className="btn btn--hollow btn--primary">
                                {gettext('Select Files')}
                            </span>
                        </div>
                    </>
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
                                this.props.onFileSelect(Array.from(this.input.current.files));
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
