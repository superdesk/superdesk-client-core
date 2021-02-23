import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    value: number;
    error: boolean;
    counter: boolean;
}

interface IState {
    width: number;
    strokeWidth: number;
    addCSSTransition: boolean;
}

export class GridItemProgressCircle extends React.Component<IProps, IState> {
    svgNode: React.RefObject<SVGSVGElement>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            width: 0,
            strokeWidth: 0,
            addCSSTransition: false,
        };

        this.svgNode = React.createRef<SVGSVGElement>();
        this.updateStateFromRefNode = this.updateStateFromRefNode.bind(this);
    }

    componentDidMount() {
        this.updateStateFromRefNode();

        setTimeout(() => {
            this.setState({addCSSTransition: true});
        }, 500);
    }

    updateStateFromRefNode() {
        if (this.svgNode.current != null) {
            const boundingBox = this.svgNode.current.getBoundingClientRect();
            const circleNode = this.svgNode.current.querySelector('circle');

            if (circleNode != null) {
                this.setState({
                    width: boundingBox.width,
                    strokeWidth: parseInt(
                        window.getComputedStyle(circleNode).strokeWidth,
                        10,
                    ),
                });
            }
        } else {
            setTimeout(this.updateStateFromRefNode, 50);
        }
    }

    computeSVGAttributes() {
        let attributes = {
            radius: 0,
            circumference: 0,
            dashOffset: 0,
        };

        if (this.state.width > 0 && this.state.strokeWidth > 0) {
            attributes.radius = (this.state.width / 2) - (this.state.strokeWidth / 2);
            attributes.circumference = 2 * Math.PI * attributes.radius;
            attributes.dashOffset = attributes.circumference * (1 - (this.props.value / 100));
        }

        return attributes;
    }

    render() {
        const {radius, circumference, dashOffset} = this.computeSVGAttributes();
        let status = '';

        if (this.props.error === true) {
            status = 'error';
        } else if (this.props.value >= 100) {
            status = 'completed';
        }

        const progressDoneClasses = classNames(
            'progress-done',
            {
                'progress-done--completed': status === 'completed',
                'progress-done--error': status === 'error',
            },
        );

        const svgClasses = classNames(
            'progress-svg',
            {
                'error': this.props.error,
                'completed': status === 'completed',
            },
        );

        const circleTransitionStyle = this.state.addCSSTransition === false ?
            {} :
            {transition: 'stroke-dashoffset ease-in-out .3s'};

        return (
            <span className="sd-grid-item__progress-circle">
                <div className="sd-circular-progress--m">
                    <div className="progress-bar-container">
                        <div className={progressDoneClasses}>
                            {status === 'error' ? null : (
                                <i className="icon-ok" ng-hide="status === 'error'" />
                            )}
                            {status === 'completed' ? null : (
                                <i className="icon-close-small" ng-hide="status === 'completed'" />
                            )}
                        </div>
                        {this.props.counter !== true ? null : (
                            <span className="progress-text" ng-if="counter">
                                {this.props.value}<em>%</em>
                            </span>
                        )}
                        <svg className={svgClasses} ref={this.svgNode}>
                            <circle
                                r={radius}
                                cx="50%"
                                cy="50%"
                                style={circleTransitionStyle}
                            />
                            <circle
                                className="progressbar"
                                r={radius}
                                cx="50%"
                                cy="50%"
                                style={{
                                    ...circleTransitionStyle,
                                    strokeDashoffset: dashOffset,
                                    strokeDasharray: circumference,
                                }}
                            />
                        </svg>
                    </div>
                </div>
            </span>
        );
    }
}
