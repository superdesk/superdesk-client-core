import React from 'react';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import PropTypes from 'prop-types';

import {Column} from './Column';
import {isNotForPublication, gettext} from '../utils';
import {TOOLTIPS} from '../constants';

/**
 * @ngdoc react
 * @name PubStatus
 * @description Component to show published status of an item
 */
export const PubStatus:React.StatelessComponent<any> = ({item, isPublic}) => {
    let badge;
    let title = null;

    if (isPublic) {
        title = gettext(TOOLTIPS.postedState);
        badge = <span className="badge badge--success">P</span>;
    } else if (isNotForPublication(item)) {
        title = gettext(TOOLTIPS.notForPublication);
        badge = <i
            className="icon-ban-circle icon--red"
            style={{
                width: '22px',
                height: '22px',
                fontSize: '22px',
            }}
        />;
    } else {
        badge = <span className="badge badge--light">&nbsp;</span>;
    }

    return (
        <Column>
            {title &&
                <OverlayTrigger placement="right"
                    overlay={<Tooltip id="badge_pub_status">{title}</Tooltip>}
                >
                    {badge}
                </OverlayTrigger>
            }
            {!title && (badge)}
        </Column>
    );
};

PubStatus.propTypes = {
    item: PropTypes.object.isRequired,
    isPublic: PropTypes.bool,
};
