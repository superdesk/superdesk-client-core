import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {renderArea} from '../helpers';
import {flatMap} from 'lodash';
import {extensions} from 'core/extension-imports.generated';
import {IDesk, IArticle} from 'superdesk-api';

export interface IPropsItemListInfo {
    desk: IDesk;
    highlightsById: any;
    ingestProvider: any;
    item: IArticle;
    markedDesksById: any;
    narrow: any;
    nestedCount: number;
    openAuthoringView: any;
    profilesById: any;
    scope: any;
    showNested: boolean;
    svc: any;
    swimlane: any;
    toggleNested: (event) => void;
    versioncreator: any;
}

export class ListItemInfo extends React.Component<IPropsItemListInfo> {
    static propTypes: any;

    render() {
        var listItems;
        var className;

        const props = this.props;

        const articleDisplayWidgets = flatMap(
            Object.values(extensions).map(({activationResult}) => activationResult),
            (activationResult) =>
                activationResult.contributions != null
                && activationResult.contributions.articleListItemWidgets != null
                    ? activationResult.contributions.articleListItemWidgets
                    : [],
        );

        if (props.scope.singleLine) {
            className = 'item-info item-info-reduced-rowheight';
            listItems = React.createElement(
                'div',
                {style: {flexGrow: 1}},
                renderArea('singleLine', angular.extend({
                    svc: props.svc,
                    scope: props.scope,
                }, props), {className: 'line'}),
            );
        } else {
            className = classNames('item-info', {'item-info-reduced-rowheight': props.scope.singleLine});
            listItems = React.createElement(
                'div',
                {style: {flexGrow: 1}},
                renderArea('firstLine', angular.extend({
                    svc: props.svc,
                    scope: props.scope,
                }, props), {className: 'line'}, props.scope.customRender),
                renderArea('secondLine', angular.extend({
                    svc: props.svc,
                    scope: props.scope,
                }, props), {className: 'line'}, props.scope.customRender),
            );
        }

        return (
            <div
                className={className}
                style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
            >
                {listItems}
                {
                    articleDisplayWidgets.length < 1 ? null : (
                        <div style={{marginLeft: 10}}>
                            {
                                articleDisplayWidgets.map((Component, i) => <Component key={i} article={props.item} />)
                            }
                        </div>
                    )
                }
            </div>
        );
    }
}

ListItemInfo.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    item: PropTypes.any.isRequired,
};
