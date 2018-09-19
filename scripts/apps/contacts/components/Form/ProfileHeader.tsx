import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {Toggle} from './index';
import {get} from 'lodash';

export const ProfileHeader: React.StatelessComponent<any> = ({svc, contact, onChange, readOnly, contactType}) => {
    const {gettext} = svc;

    const displayName = contact.first_name ? contact.first_name + ' ' + contact.last_name : contact.organisation;

    const cssClass = classNames(
        'header-info',
    );

    const avatarClass = classNames(
        'avatar',
        {organisation: contactType === 'organisation'},
    );

    return (
        <div className={cssClass}>
            <div className="profile-pic">
                <figure className={avatarClass} />
                {contact._id && !contact.is_active &&
                    <span className="disabled-label">inactive</span>
                }
            </div>
            <h2>{displayName}</h2>
            <h5>{contact.job_title}</h5>

            {!readOnly &&
                <div className="active" data-sd-tooltip={gettext('ACTIVE/INACTIVE')} data-flow="left">
                    <Toggle
                        value={get(contact, 'is_active', false)}
                        onChange={(e) => onChange('is_active', e.target.value)}
                        readOnly={readOnly} />
                </div>
            }
        </div>
    );
};

ProfileHeader.propTypes = {
    svc: PropTypes.object.isRequired,
    contact: PropTypes.object.isRequired,
    contactType: PropTypes.string,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
};
