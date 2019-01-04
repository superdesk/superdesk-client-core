import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/ui/components/utils';

export const State: React.StatelessComponent<any> = ({item}) => {
    const cssClass = item.contact_state ? 'state-label' : null;

    return (
        <div key="state" className={cssClass}>
            {
                item.contact_state !== undefined && item.contact_state !== null &&
                <span title={item.contact_state}>
                    {gettext(item.contact_state)}
                </span>
            }
        </div>
    );
};

State.propTypes = {
    item: PropTypes.object,
};
