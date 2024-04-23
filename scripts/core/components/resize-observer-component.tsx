import React from 'react';

interface IResizeObserverDimensions {
    width: number;
    height: number;
}

interface IPropsResizeObserverComponent {
    style?: React.CSSProperties;
    position?: 'relative' | 'absolute';
    children: (props: IResizeObserverDimensions) => JSX.Element;
}

interface IState {
    dimensions: IResizeObserverDimensions | 'not-initialized';
}

/**
 * Higher order component for dynamically retrieving element dimensions.
 * TODO: replace with the one from ui-framework
 */
export class ResizeObserverComponent extends React.PureComponent<IPropsResizeObserverComponent, IState> {
    private el: HTMLDivElement;
    private observerInstance: ResizeObserver;

    constructor(props: IPropsResizeObserverComponent) {
        super(props);

        this.state = {
            dimensions: 'not-initialized',
        };
    }

    componentDidMount() {
        this.observerInstance = new ResizeObserver((entries) => {
            this.setState({
                dimensions: {
                    width: Math.floor(entries[0].contentRect.width),
                    height: Math.floor(entries[0].contentRect.height),
                },
            });
        });

        this.observerInstance.observe(this.el);
    }

    componentWillUnmount() {
        this.observerInstance.unobserve(this.el);
    }

    render() {
        const {dimensions} = this.state;

        return (
            <div
                ref={(el) => {
                    this.el = el;
                }}
                style={{
                    position: 'relative',
                    ...this.props.style,
                }}
            >
                {/**
                 * Absolute positioning is needed for accurate calculation.
                 * Otherwise, initial calculation would work well,
                 * but if parent of `ResizeObserverComponent` is resized down,
                 * it would include its own size(which is based on the initial result from this component),
                 * including children, into calculation and would produce a wrong result.
                */}
                <div
                    style={
                        this.props.position === 'absolute'
                            ? {position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}
                            : undefined
                    }
                >
                    {
                        dimensions === 'not-initialized'
                            ? null
                            : this.props.children(dimensions)
                    }
                </div>
            </div>
        );
    }
}
