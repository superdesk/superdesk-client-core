import React from 'react';
import PropTypes from 'prop-types';
import {VersionCreated, SocialInfo} from 'apps/contacts/components/fields';
import {getContactType} from '../../contacts/helpers';
import classNames from 'classnames';
import {gettext} from 'core/utils';

/**
 * Contact footer - renders footer for contact card used in grid view
 */
export const ContactFooter: React.StatelessComponent<any> = ({item, svc}) => {
    const cssClass = classNames(
        'sd-grid-item__footer sd-grid-item__footer--padded',
        {padded: getContactType(item) === 'organisation' || !item.organisation},
    );

    return (
        <div key="contact-footer" className={cssClass}>
            <span className="update-info">
                <span className="sd-grid-item__text-label">{gettext('Updated:')}</span>
                <VersionCreated item={item} svc={svc} />
            </span>
            <SocialInfo item={item} />
        </div>
    );
};

ContactFooter.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
};
