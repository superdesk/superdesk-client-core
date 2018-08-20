import React from 'react';
import PropTypes from 'prop-types';

export const State:React.StatelessComponent<any> = ({item, svc}) => {
    const {gettextCatalog} = svc;
    let cssClass = item.contact_state ? 'state-label' : null;

    return (
        <div key="state" className={cssClass}>
            {
                item.contact_state !== undefined && item.contact_state !== null &&
                <span title={item.contact_state}>
                    {gettextCatalog.getString(item.contact_state)}
                </span>
            }
        </div>
    );
};

State.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
};
