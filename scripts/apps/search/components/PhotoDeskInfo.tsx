import React from 'react';
import PropTypes from 'prop-types';
import {PhotoDeskFields} from './PhotoDeskFields';
import {DEFAULT_GRID_VIEW_FIELDS_CONFIG} from 'apps/search/constants';
import {get, flatMap} from 'lodash';
import {extensions} from 'core/extension-imports.generated';

export const PhotoDeskInfo: React.StatelessComponent<any> = (props) => {
    const {datetime} = props.svc;
    const {item, svc} = props;

    const gridViewFieldsConfig = get(svc.config, 'gridViewFields', DEFAULT_GRID_VIEW_FIELDS_CONFIG);

    const articleDisplayWidgets = flatMap(
        Object.values(extensions).map(({activationResult}) => activationResult),
        (activationResult) =>
            activationResult.contributions != null
            && activationResult.contributions.articleGridItemWidgets != null
                ? activationResult.contributions.articleGridItemWidgets
                : [],
    );

    return (
        <div className="sd-grid-item__content">
            <time>{datetime.longFormat(item.versioncreated)}</time>
            <span className="sd-grid-item__title sd-grid-item--element-grow"
                dangerouslySetInnerHTML={{__html: item.headline || item.slugline || item.type}} />
            <PhotoDeskFields
                fieldsConfig={gridViewFieldsConfig}
                item={item}
                svc={svc}
                itemClassName="sd-grid-item__content-block"
            />
            {
                    articleDisplayWidgets.length < 1 ? null : (
                        <div style={{marginTop: 12, display: 'flex'}} className="sibling-spacer-10">
                            {
                                articleDisplayWidgets.map((Component, i) =>
                                    <Component key={i} article={item} />,
                                )
                            }
                        </div>
                    )
                }
        </div>
    );
};

PhotoDeskInfo.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
};
