import React from 'react';
import PropTypes from 'prop-types';

export const JobTitle: React.StatelessComponent<any> = ({item}) => (
    <span key={`role-container-${item._id}`} className="container"> {item.job_title && `(${item.job_title})` }</span>
);

JobTitle.propTypes = {
    item: PropTypes.object,
};
