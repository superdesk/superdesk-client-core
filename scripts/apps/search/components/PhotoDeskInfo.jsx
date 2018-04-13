import React from 'react';
import PropTypes from 'prop-types';
import {createMarkUp} from '../helpers';
import * as fields from '../components/fields';
import ng from 'core/services/ng';
import {connectPromiseResults} from '../../../core/helpers/ReactRenderAsync';
import {getLabelForFieldId} from 'apps/workspace/helpers/getLabelForFieldId';

import {DEFAULT_GRID_VIEW_FIELDS_CONFIG} from 'apps/search/constants';

/* globals __SUPERDESK_CONFIG__: true */
const gridViewFieldsConfig = __SUPERDESK_CONFIG__.gridViewFields || DEFAULT_GRID_VIEW_FIELDS_CONFIG;

/**
 * PhotoDesk Info - renders item metadata
 */
function PhotoDeskInfoComponent(props) {
    const {datetime} = props.svc;

    const item = props.item;

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
                            : item[fieldId] || (item.extra == null ? null : item.extra[fieldId]);

                        if (value == null) {
                            return null;
                        }

                        return (
                            <div key={fieldId} className="sd-grid-item__content-block">
                                <span className="sd-grid-item__text-label">
                                    {getLabelForFieldId(fieldId, props.customFields)}:
                                </span>
                                <span className="sd-grid-item__text-strong">{value}</span>
                            </div>
                        );
                    })
            }
        </div>
    );
}

PhotoDeskInfoComponent.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
    customFields: PropTypes.array
};

const getPromises = () => [ng.get('content').getCustomFields()];
const mapPromisesToProps = (customFields) => ({customFields});

export const PhotoDeskInfo = connectPromiseResults(getPromises, mapPromisesToProps)(PhotoDeskInfoComponent);