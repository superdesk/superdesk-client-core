import React from 'react';

interface IProps<T> {
    component: React.ComponentType<T>;
    toProps: T;
}

interface IState<T> {
    toProps: T;
}

/**
 * Is used in with `PortalWithoutEvents` in order to update props
 * when wrapper component is updated.
 * React doesn't allow modifying props directly.
 */
export class StateToProps<T> extends React.PureComponent<IProps<T>, IState<T>> {
    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            toProps: props.toProps,
        };
    }
    render() {
        const Component = this.props.component;

        return (
            <Component {...this.state.toProps} />
        );
    }
}
