import React from 'react';
import PropTypes from 'prop-types';
import {TimeElem} from 'apps/search/components';

export const VersionCreated: React.StatelessComponent<any> = ({item}) =>
    <TimeElem key="version-created" date={item._updated} />;

VersionCreated.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
};
