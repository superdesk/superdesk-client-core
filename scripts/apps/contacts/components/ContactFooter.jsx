import React from 'react';
import PropTypes from 'prop-types';
import {State, VersionCreated} from 'apps/contacts/components/fields';

/**
 * Contact footer - renders footer for contact card used in grid view
 */
export const ContactFooter = ({item, svc}) => {
    const {gettextCatalog} = svc;

    return (
        <div key="contact-footer">
            <span className="update-info">
                <dl>
                    <dt>{gettextCatalog.getString('updated:')}</dt>
                    <dd>
                        <VersionCreated item={item} svc={svc} />
                    </dd>
                </dl>
            </span>
            {item.contact_state && <h2><State item={item} svc={svc} /></h2>}
        </div>
    );
};

ContactFooter.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired
};
