import React from 'react';
import PropTypes from 'prop-types';

export const State = ({item, svc}) => {
    const {gettextCatalog} = svc;
    let cssClass = item.state ? 'state-label state-' + item.state : null;

    return (
        <div key="state" className={cssClass}>
            {
                item.state !== undefined && item.state !== null &&
                <span title={item.state}>
                    {gettextCatalog.getString(item.state)}
                </span>
            }
        </div>
    );
};

State.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired
};
