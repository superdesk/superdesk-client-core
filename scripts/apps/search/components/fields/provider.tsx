import React from 'react';
import PropTypes from 'prop-types';

export const provider:React.StatelessComponent<any> = (props) => {
    var provider = props.ingestProvider ? props.ingestProvider.source : '';

    if (props.item.source) {
        provider = props.item.source;
    }
    if (provider) {
        return React.createElement('span', {className: 'provider', key: 'provider'}, provider);
    }
};

provider.propTypes = {
    item: PropTypes.any,
    ingestProvider: PropTypes.any,
};
