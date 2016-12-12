import React from 'react';

export function provider(props) {
    var provider = props.ingestProvider ? props.ingestProvider.source : '';

    if (props.item.source) {
        provider = props.item.source;
    }
    if (provider) {
        return React.createElement('span', {className: 'provider', key: 'provider'}, provider);
    }
}

provider.propTypes = {
    item: React.PropTypes.any,
    ingestProvider: React.PropTypes.any,
};
