import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {PhotoDeskFields} from './PhotoDeskFields';

import {DEFAULT_GRID_VIEW_FOOTER_CONFIG} from 'apps/search/constants';

export const PhotoDeskFooter:React.StatelessComponent<any> = (props) => {
    const {item, svc} = props;
    const gridViewFooterFieldsConfig = _.get(svc.config, 'gridViewFooterFields', DEFAULT_GRID_VIEW_FOOTER_CONFIG);

    const fieldsLeft = gridViewFooterFieldsConfig.left;
    const fieldsRight = gridViewFooterFieldsConfig.right;

    return (
        <div className="sd-grid-item__footer">
            {
                Array.isArray(fieldsLeft) === true && fieldsLeft.length > 0 ? (
                    <div className="sd-grid-item__footer-block sd-grid-item__footer-block--multi-l">
                        <PhotoDeskFields
                            fieldsConfig={fieldsLeft}
                            item={item}
                            svc={svc}
                            labelMode="never-with-custom-renderer"
                            itemClassName=""
                        />
                    </div>
                ) : null
            }
            {
                Array.isArray(fieldsRight) === true && fieldsRight.length > 0 ? (
                    <div className="sd-grid-item__footer-block sd-grid-item__footer-block--multi-r">
                        <PhotoDeskFields
                            fieldsConfig={fieldsRight}
                            item={item}
                            svc={svc}
                            labelMode="never-with-custom-renderer"
                            itemClassName=""
                        />
                    </div>
                ) : null
            }
            {
                props.getActionsMenu == null ? null : props.getActionsMenu()
            }
        </div>
    );
};

PhotoDeskFooter.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
    getActionsMenu: PropTypes.func,
};