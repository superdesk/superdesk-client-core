import React from 'react';
import PropTypes from 'prop-types';
import {promiseAllObject} from 'core/utils';

class ReactRenderAsync extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            mappedProps: {},
        };
    }
    componentWillMount() {
        promiseAllObject(this.props.promises)
            .then((result) => {
                this.setState({
                    loading: false,
                    mappedProps: result,
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
    promises: PropTypes.object,
    component: PropTypes.func,
    originalProps: PropTypes.object,
};

/* eslint-disable react/no-multi-comp */
export function connectPromiseResults(getPromises) {
    return function(component) {
        return function connectPromiseComponent(props) {
            return (
                <ReactRenderAsync
                    promises={getPromises()}
                    component={component}
                    originalProps={props}
                />
            );
        };
    };
}