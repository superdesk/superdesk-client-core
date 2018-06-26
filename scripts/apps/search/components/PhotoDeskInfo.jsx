import React from 'react';
import PropTypes from 'prop-types';
import {createMarkUp} from '../helpers';
import {PhotoDeskFields} from './PhotoDeskFields';
import {DEFAULT_GRID_VIEW_FIELDS_CONFIG} from 'apps/search/constants';

export function PhotoDeskInfo(props) {
    const {datetime} = props.svc;
    const {item, svc} = props;

    const gridViewFieldsConfig = _.get(svc.config, 'gridViewFields', DEFAULT_GRID_VIEW_FIELDS_CONFIG);

    return (
        <div className="sd-grid-item__content">
            <time>{datetime.longFormat(item.versioncreated)}</time>
            <span className="sd-grid-item__title sd-grid-item--element-grow"
                dangerouslySetInnerHTML={createMarkUp(item.headline || item.slugline || item.type)} />
            <PhotoDeskFields
                fieldsConfig={gridViewFieldsConfig}
                item={item}
                svc={svc}
                itemClassName="sd-grid-item__content-block"
            />
        </div>
    );
}

PhotoDeskInfo.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
};