import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer} from 'apps/contacts/components';

/**
 * SocialInfo - to display facebook, twitter etc. information of a contact
 */
export const SocialInfo: React.StatelessComponent<any> = ({item}) => {
    const keys = ['facebook', 'twitter', 'instagram'];

    return (<div key="contact-social" className="social-info">
        {keys.map((k) => (item[k] && <ItemContainer key={k} item={item} field={k} />))}</div>);
};

SocialInfo.propTypes = {
    item: PropTypes.object,
};
