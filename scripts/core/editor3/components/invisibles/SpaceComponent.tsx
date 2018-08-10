import React from 'react';
import {get} from 'lodash';
import PropTypes from 'prop-types';

export const SpaceComponent = (props) => {
    const spanProps = {...props};
    const styleSet = get(props, 'children.0.props.styleSet');
    let className = 'space-component';

    if (styleSet) {
        const isDeleteSuggestion = styleSet.some((style) => style.startsWith('DELETE_SUGGESTION'));
        const isAddSuggestion = styleSet.some((style) => style.startsWith('ADD_SUGGESTION'));

        if (isDeleteSuggestion) {
            className += ' delete-suggestion';
        } else if (isAddSuggestion) {
            className += ' add-suggestion';
        }
    }

    // Prevent unknown properties warning
    delete spanProps.contentState;
    delete spanProps.entityKey;
    delete spanProps.decoratedText;
    delete spanProps.offsetKey;

    return <span className={className} {...spanProps}>
        {props.children}
    </span>;
};

SpaceComponent.propTypes = {
    children: PropTypes.array.isRequired,
};
