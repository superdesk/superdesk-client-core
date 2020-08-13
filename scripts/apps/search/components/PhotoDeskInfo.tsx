import React from 'react';
import PropTypes from 'prop-types';
import {PhotoDeskFields} from './PhotoDeskFields';
import {DEFAULT_GRID_VIEW_FIELDS_CONFIG} from 'apps/search/constants';
import {flatMap} from 'lodash';
import ng from 'core/services/ng';
import {extensions, appConfig} from 'appConfig';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
}

export const PhotoDeskInfo: React.StatelessComponent<IProps> = (props) => {
    const {item} = props;

    const datetime = ng.get('datetime');

    const gridViewFieldsConfig = appConfig.gridViewFields ?? DEFAULT_GRID_VIEW_FIELDS_CONFIG;

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
                itemClassName="sd-grid-item__content-block"
                labelMode="never-with-custom-renderer"
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
    item: PropTypes.any,
};
