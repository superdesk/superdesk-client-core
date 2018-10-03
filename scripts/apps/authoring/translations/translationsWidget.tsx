import React from 'react';
import PropTypes from 'prop-types';
import {RelativeDate} from 'core/datetime/relativeDate';
import {state as State} from 'apps/search/components/fields/state';
import {connectServices} from 'core/helpers/ReactRenderAsync';

class TranslationsWidgetComponent extends React.Component<any, any> {
    static propTypes: any;

    render() {
        const {item, $filter, gettextCatalog, datetime} = this.props;

        return (
            <div className="widget">
                <div className="sd-list-item sd-shadow--z1">
                    <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                        <div className="sd-list-item__row">
                            <span className="label">{item.language}</span>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">{item.headline}</span>
                            <span style={{whiteSpace: 'nowrap'}}>
                                <RelativeDate datetime={item.firstcreated} />
                            </span>
                        </div>
                        <div className="sd-list-item__row">
                            <div className="sd-list-item--element-grow">
                                {gettext('Translated from')} <span className="label label--hollow">es</span>
                            </div>

                            <div>
                                <State
                                    $filter={$filter}
                                    gettextCatalog={gettextCatalog}
                                    datetime={datetime}
                                    item={item}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

TranslationsWidgetComponent.propTypes = {
    item: PropTypes.any.isRequired,
    $filter: PropTypes.any.isRequired,
    gettextCatalog: PropTypes.any.isRequired,
    datetime: PropTypes.any.isRequired,
};

export const TranslationsWidget = connectServices(
    TranslationsWidgetComponent,
    ['$filter', 'gettextCatalog', 'datetime'],
);

TranslationsWidget.propTypes = {
    item: PropTypes.any.isRequired,
};
