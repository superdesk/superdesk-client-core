import React from 'react';
import PropTypes from 'prop-types';

export const SpaceComponent = (props) => {
    const spanProps = {...props};

    // Prevent unknown properties warning
    delete spanProps.contentState;
    delete spanProps.entityKey;
    delete spanProps.decoratedText;
    delete spanProps.offsetKey;

    return <span className="space-component" {...spanProps}>
        {props.children}
    </span>;
};

SpaceComponent.propTypes = {
    children: PropTypes.array.isRequired,
};
