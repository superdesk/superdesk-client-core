import React, {CSSProperties} from 'react';
import {MountTracker} from './mount-tracker';

interface IProps {
    // underscore is added to differentiate this from built-in React key
    key_: string;
}

interface IState {
    loading: boolean;
}

/**
 * Displays last HTML snapshot when loading.
 * Loading state starts when key_ changes.
 * `setAsLoaded` has to be called to end loading state.
 */
export class SmoothLoaderForKey extends React.PureComponent<IProps, IState> {
    private wrapper: HTMLDivElement;
    private lastSnapshotHtml: string;

    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: false,
        };

        this.setAsLoaded = this.setAsLoaded.bind(this);
        this.showSnapshot = this.showSnapshot.bind(this);
    }

    public setAsLoaded() {
        this.setState({loading: false});
    }

    private showSnapshot() {
        if (
            this.state.loading === false
            && this.wrapper != null // will be null when this component unmounts
        ) {
            this.lastSnapshotHtml = this.wrapper.innerHTML;
            this.setState({loading: true});
        }
    }

    render() {
        const {loading} = this.state;
        const {children} = this.props;
        const style: CSSProperties = loading
            ? {position: 'absolute', insetInlineStart: -9999, insetBlockStart: -9999, visibility: 'hidden'}
            : {height: '100%', display: 'contents'};

        return (
            <div
                ref={(ref) => {
                    this.wrapper = ref;
                }}
                style={{height: '100%', display: 'contents'}}
            >
                {(() => {
                    if (loading) {
                        return (
                            <div style={{height: '100%', position: 'relative'}}>
                                <div
                                    dangerouslySetInnerHTML={{__html: this.lastSnapshotHtml ?? '<div></div>'}}
                                    style={{height: '100%'}}
                                />
                            </div>
                        );
                    }
                })()}

                {/**
                 * Children have to be rendered unconditionally.
                 * A signal to remove the snapshot will come from children, thus they can't be unmounted.
                 */}
                <MountTracker
                    key={this.props.key_}
                    onWillUnmount={this.showSnapshot}
                >
                    <div style={style}>{children}</div>
                </MountTracker>
            </div>
        );
    }
}
