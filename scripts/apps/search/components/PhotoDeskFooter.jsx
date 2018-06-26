import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {PhotoDeskFields} from './PhotoDeskFields';

import {DEFAULT_GRID_VIEW_FOOTER_CONFIG} from 'apps/search/constants';

export function PhotoDeskFooter(props) {
    const {item, svc} = props;
    const gridViewFooterFieldsConfig = _.get(svc.config, 'gridViewFooterFields', DEFAULT_GRID_VIEW_FOOTER_CONFIG);

    return (
        <div className="sd-grid-item__footer">
            <div className="sd-grid-item__footer-block sd-grid-item__footer-block--multi-l">
                <PhotoDeskFields
                    fieldsConfig={gridViewFooterFieldsConfig}
                    item={item}
                    svc={svc}
                    labelMode="never-with-custom-renderer"
                    itemClassName="sd-grid-item__footer-block-item"
                />
            </div>
            {
                props.getActionsMenu == null ? null : props.getActionsMenu()
            }
        </div>
    );
}

PhotoDeskFooter.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
    getActionsMenu: PropTypes.func,
};