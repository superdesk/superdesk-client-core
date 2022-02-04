import React from 'react';
import ReactDOM from 'react-dom';
import {StateToProps} from '../../editor3/components/StateToProps';

interface IProps<T> {
    component: React.ComponentType<T>;
    props: T;
    shouldUpdate?(prevProps: T, currentProps: T);
}

export class PortalWithoutEvents<T> extends React.PureComponent<IProps<T>> {
    element: HTMLDivElement;
    componentRef: StateToProps<T>;

    componentDidMount() {
        this.element = document.createElement('div');

        document.body.append(this.element);

        ReactDOM.render(
            <StateToProps
                component={this.props.component}
                toProps={this.props.props}
                ref={(autocompleteRef) => {
                    this.componentRef = autocompleteRef;
                }}
            />,
            this.element,
        );
    }

    componentDidUpdate(prevProps: IProps<T>) {
        if (this.props.shouldUpdate != null) {
            if (this.props.shouldUpdate(prevProps.props, this.props.props)) {
                this.componentRef.setState({toProps: this.props.props});
            }
        } else if (prevProps.props !== this.props.props) {
            this.componentRef.setState({toProps: this.props.props});
        }
    }

    componentWillUnmount() {
        setTimeout(() => {
            ReactDOM.unmountComponentAtNode(this.element);
            this.element.remove();
        }, 100);
    }

    render() {
        return null;
    }
}
