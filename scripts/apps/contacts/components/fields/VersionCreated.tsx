import React from 'react';
import PropTypes from 'prop-types';
import {TimeElem} from 'apps/contacts/components';

export const VersionCreated = ({item, svc}) => <TimeElem key="version-created" date={item._updated} svc={svc} />;

VersionCreated.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
};
