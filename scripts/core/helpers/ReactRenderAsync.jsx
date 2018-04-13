import React from 'react';
import PropTypes from 'prop-types';

class ReactRenderAsync extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            mappedProps: {}
        };
    }
    componentWillMount() {
        Promise.all(this.props.promises)
            .then((res) => {
                this.setState({
                    loading: false,
                    mappedProps: this.props.mapPromiseResultsToProps.apply(null, res)
                });
            })
            .catch((err) => {
                console.error(err);
            });
    }
    render() {
        const Component = this.props.component;

        return this.state.loading === true
            ? null
            : <Component {...{...this.props.originalProps, ...this.state.mappedProps}} />
        ;
    }
}

ReactRenderAsync.propTypes = {
    promises: PropTypes.array,
    mapPromiseResultsToProps: PropTypes.func,
    component: PropTypes.func,
    originalProps: PropTypes.object,
};

/* eslint-disable react/no-multi-comp */
export function connectPromiseResults(getPromises, mapPromiseResultToProps) {
    return function(component) {
        return function connectPromiseComponent(props) {
            return (
                <ReactRenderAsync
                    promises={getPromises()}
                    mapPromiseResultsToProps={mapPromiseResultToProps}
                    component={component}
                    originalProps={props}
                />
            );
        };
    };
}