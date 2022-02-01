import React, {CSSProperties} from 'react';
import {Loader} from 'superdesk-ui-framework/react/components/Loader';
import {ListItemLoader} from 'superdesk-ui-framework/react';

interface IProps {
    loading: boolean;
}

/**
 * Displays last HTML snapshot when loading.
 */
export class SmoothLoader extends React.Component<IProps> {
    private wrapper: HTMLDivElement;
    private lastSnapshotHtml: string;

    constructor(props: IProps) {
        super(props);

        this.saveSnapshot = this.saveSnapshot.bind(this);
    }

    saveSnapshot() {
        if (this.props.loading !== true) {
            this.lastSnapshotHtml = this.wrapper.innerHTML;
        }
    }

    componentDidMount() {
        this.saveSnapshot();
    }

    componentDidUpdate() {
        this.saveSnapshot();
    }

    render() {
        const {loading, children} = this.props;
        const style: CSSProperties = loading
            ? {position: 'absolute', left: -9999, top: -9999, visibility: 'hidden'}
            : {height: '100%'};

        return (
            <div
                ref={(ref) => {
                    this.wrapper = ref;
                }}
                style={{height: '100%'}}
            >
                {/**
                 * Children have to be rendered unconditionally in the same place in the component tree
                 * to prevent React reconciliation algorithm from remounting it.
                 */}
                <div style={style}>{children}</div>

                {
                    loading && (
                        <div style={{height: '100%', position: 'relative'}}>
                            <ListItemLoader />
                            <div
                                dangerouslySetInnerHTML={{__html: this.lastSnapshotHtml ?? '<div></div>'}}
                                style={{height: '100%'}}
                            />
                        </div>
                    )
                }
            </div>
        );
    }
}
