import React from 'react';
import PropTypes from 'prop-types';

export const provider: React.StatelessComponent<any> = (props) => {
    let _provider = props.ingestProvider ? props.ingestProvider.source : '';

    if (props.item.source) {
        _provider = props.item.source;
    }
    if (_provider) {
        return React.createElement('span', {className: 'provider', key: 'provider'}, _provider);
    }
};

provider.propTypes = {
    item: PropTypes.any,
    ingestProvider: PropTypes.any,
};
