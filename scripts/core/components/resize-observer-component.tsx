import React from 'react';

interface IDimensions {
    width: number;
}

interface IProps {
    children: (props: IDimensions) => JSX.Element;
}

interface IState {
    dimensions: IDimensions | 'not-initialized';
}

export class ResizeObserverComponent extends React.PureComponent<IProps, IState> {
    el: HTMLDivElement;
    observerInstance: any;

    constructor(props: IProps) {
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
            >
                {
                    dimensions === 'not-initialized'
                        ? null
                        : this.props.children(dimensions)
                }
            </div>
        );
    }
}
