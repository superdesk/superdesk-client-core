import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {createMarkUp} from '../helpers';
import * as fields from '../components/fields';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {connectPromiseResults} from 'core/helpers/ReactRenderAsync';

import {DEFAULT_GRID_VIEW_FIELDS_CONFIG} from 'apps/search/constants';

/**
 * PhotoDesk Info - renders item metadata
 */
export function PhotoDeskInfoComponent(props) {
    const {datetime, config} = props.svc;
    const gridViewFieldsConfig = _.get(config, 'gridViewFields', DEFAULT_GRID_VIEW_FIELDS_CONFIG);
    const {item, getLabelForFieldId} = props;

    return (
        <div className="sd-grid-item__content">
            <time>{datetime.longFormat(item.versioncreated)}</time>
            <span className="sd-grid-item__slugline"
                dangerouslySetInnerHTML={createMarkUp(item.headline || item.slugline || item.type)} />
            {
                gridViewFieldsConfig
                    .map((fieldId) => {
                        const value = typeof fields[fieldId] === 'function'
                            ? fields[fieldId]({item: item, svc: props.svc})
                            : item[fieldId];

                        if (value == null) {
                            return null;
                        }

                        return (
                            <div key={fieldId} className="sd-grid-item__content-block">
                                <span className="sd-grid-item__text-label">
                                    {getLabelForFieldId(fieldId)}:
                                </span>
                                <span className="sd-grid-item__text-strong">{value}</span>
                            </div>
                        );
                    })
            }
        </div>
    );
}

export const PhotoDeskInfo = connectPromiseResults(() => ({
    getLabelForFieldId: getLabelNameResolver(),
}))(PhotoDeskInfoComponent);

PhotoDeskInfoComponent.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
    getLabelForFieldId: PropTypes.func.isRequired,
};