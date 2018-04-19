import React from 'react';
import PropTypes from 'prop-types';

export const JobTitle = ({item}) => (
    <span key="job-title" className="container"> {item.job_title && `(${item.job_title})` }</span>
);

JobTitle.propTypes = {
    item: PropTypes.object,
};
