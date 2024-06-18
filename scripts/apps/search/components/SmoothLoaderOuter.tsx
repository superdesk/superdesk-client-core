import React from 'react';

interface IProps {
    loading: boolean;
    children(): JSX.Element | Array<JSX.Element>;
}

/**
 * Displays last HTML snapshot when loading.
 * Loading is done in the parent component, thus children are unmounted while loading is in progress.
 */
export class SmoothLoaderOuter extends React.Component<IProps> {
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
        return (
            <div
                ref={(ref) => {
                    this.wrapper = ref;
                }}
            >
                {
                    this.props.loading
                        ? (
                            <div
                                dangerouslySetInnerHTML={{__html: this.lastSnapshotHtml ?? '<div></div>'}}
                            />
                        )
                        : this.props.children()
                }
            </div>
        );
    }
}
