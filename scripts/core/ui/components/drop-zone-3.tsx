import React from 'react';
import {IDropZoneComponentProps} from 'superdesk-api';
import {gettext} from 'core/utils';

const shellStyles: React.CSSProperties = {
    outline: '2px dashed silver',
    outlineOffset: '-2px',
    backgroundColor: 'rgba(150, 150, 150, 0.06)',
};

const shellStylesOnDrag: React.CSSProperties = {
    outline: '2px dashed rgba(94, 169, 200, 1)',
    outlineOffset: '2px',
    backgroundColor: 'rgba(94, 169, 200, 0.1)',
};

interface IState {
    dragging: boolean;
}

export class DropZone3 extends React.PureComponent<IDropZoneComponentProps, IState> {
    private input: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);

        this.input = React.createRef();

        this.onDragEnd = this.onDragEnd.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onDropOver = this.onDropOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);

        this.state = {
            dragging: false,
        };
    }

    onDragEnd() {
        this.setState({dragging: false});
    }

    onDrop(event) {
        event.preventDefault();

        if (this.props.canDrop(event)) {
            event.preventDefault();

            this.props.onDrop(event);
            this.setState({dragging: false});
        }
    }

    onDropOver(event) {
        event.preventDefault();
        this.setState({dragging: true});
    }

    onDragLeave(event) {
        event.preventDefault();
        this.setState({dragging: false});
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
                onDragOver={(e) => {
                    e.preventDefault();

                    if (this.state.dragging != true) {
                        this.setState({dragging: true});
                    }
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    this.setState({dragging: false});
                }}
                onDragEnd={this.onDragEnd}
                onDrop={this.onDrop}
                className={this.props.className}
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
