import React from 'react';
import {Associations} from 'apps/search/components';

export function associations(props) {
    return <Associations
        svc={props.svc}
        item={props.item}
        openAuthoringView={props.openAuthoringView}
        key="associations"
    />;
}

/*
 * item: item having associations
 * openAuthoringView: Opens the item in view mode
 * svc: contains gettext and is required
 */
associations.propTypes = {
    svc: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
    openAuthoringView: React.PropTypes.func.isRequired
};

