import React from 'react';
import {IDropZoneComponentProps} from 'superdesk-api';
import {gettext} from 'core/utils';

const shellStyles: React.CSSProperties = {
    border: '2px dashed rgba(150, 150, 150, 0.3)',
    backgroundColor: 'rgba(150, 150, 150, 0.06)',
};

const shellStylesOnDrag: React.CSSProperties = {
    border: '2px dashed rgba(94, 169, 200, 1)',
    backgroundColor: 'rgba(94, 169, 200, 0.1)',
};

interface IState {
    dragging: boolean;
}

export class DropZone3 extends React.PureComponent<IDropZoneComponentProps, IState> {
    private elem: React.RefObject<HTMLDivElement>;
    private input: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);

        this.elem = React.createRef();
        this.input = React.createRef();

        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onDropOver = this.onDropOver.bind(this);

        this.state = {
            dragging: false,
        };
    }

    onDragStart() {
        this.setState({dragging: true});
    }

    onDragEnd() {
        this.setState({dragging: false});
    }

    onDrop(event) {
        event.preventDefault();

        if (this.props.canDrop(event)) {
            event.preventDefault();

            this.props.onDrop(event);
        }
    }

    onDropOver(event) {
        event.preventDefault();
    }

    componentDidMount() {
        document.addEventListener('dragstart', this.onDragStart);
        document.addEventListener('dragend', this.onDragEnd);
        this.elem.current.addEventListener('dragover', this.onDropOver);
        this.elem.current.addEventListener('drop', this.onDrop);
    }

    componentWillUnmount() {
        document.removeEventListener('dragstart', this.onDragStart);
        document.removeEventListener('dragend', this.onDragEnd);
        this.elem.current.removeEventListener('drop', this.onDrop);
        this.elem.current.removeEventListener('dragover', this.onDropOver);
    }

    render() {
        const {children} = this.props;

        const childrenEmpty =
            typeof children === 'undefined'
            || (Array.isArray(children) ? children : [children])
                .every((child) => child === false || child === null);

        const styles: React.CSSProperties = (() => {
            if (this.state.dragging) {
                if (childrenEmpty) {
                    return shellStylesOnDrag;
                } else {
                    return {
                        ...shellStylesOnDrag,
                        padding: 8,
                    };
                }
            } else if (childrenEmpty) {
                return shellStyles;
            } else {
                return {};
            }
        })();

        const canUpload = this.props.onFileSelect != null;

        return (
            <div
                className={this.props.className}
                ref={this.elem}
                style={styles}
            >
                {
                    childrenEmpty
                        ? (
                            <div
                                style={{padding: 10, cursor: 'pointer'}}
                                onClick={() => {
                                    if (this.input.current != null) {
                                        this.input.current.click();
                                    }
                                }}
                            >
                                {
                                    canUpload
                                        ? gettext('Drop items here or click to upload')
                                        : gettext('Drop items here')
                                }
                            </div>
                        )
                        : (
                            <div>
                                {this.props.children}
                            </div>
                        )
                }

                {
                    canUpload && (
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
                    )
                }
            </div>
        );
    }
}
