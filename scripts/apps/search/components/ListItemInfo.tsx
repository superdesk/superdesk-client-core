import React from 'react';
import classNames from 'classnames';

import {renderArea} from '../helpers';
import {flatMap} from 'lodash';
import {extensions} from 'core/extension-imports.generated';
import {IDesk, IArticle} from 'superdesk-api';

export interface IPropsItemListInfo {
    item: IArticle;
    desk: IDesk;
    ingestProvider: any;
    profilesById: any;
    highlightsById: any;
    markedDesksById: any;
    openAuthoringView: (rewrittenBy?: string) => void;
    narrow: any;
    swimlane: any;
    nestedCount: number;
    versioncreator: any;
    showNested: boolean;
    toggleNested: (event) => void;
    svc: any;
    scope: {
        singleLine: boolean;
        customRender: any;
    };
}

export class ListItemInfo extends React.PureComponent<IPropsItemListInfo> {
    render() {
        var listItems;
        var className;

        const articleDisplayWidgets = flatMap(
            Object.values(extensions).map(({activationResult}) => activationResult),
            (activationResult) =>
                activationResult.contributions != null
                && activationResult.contributions.articleListItemWidgets != null
                    ? activationResult.contributions.articleListItemWidgets
                    : [],
        );

        if (this.props.scope.singleLine) {
            className = 'item-info item-info-reduced-rowheight';
            listItems = React.createElement(
                'div',
                {style: {flexGrow: 1}},
                renderArea('singleLine', angular.extend({
                    svc: this.props.svc,
                    scope: this.props.scope,
                }, this.props), {className: 'line article-list-fields'}),
            );
        } else {
            className = classNames('item-info', {'item-info-reduced-rowheight': this.props.scope.singleLine});
            listItems = React.createElement(
                'div',
                {style: {flexGrow: 1}},
                renderArea('firstLine', angular.extend({
                    svc: this.props.svc,
                    scope: this.props.scope,
                }, this.props), {className: 'line'}, this.props.scope.customRender),
                renderArea('secondLine', angular.extend({
                    svc: this.props.svc,
                    scope: this.props.scope,
                }, this.props), {className: 'line'}, this.props.scope.customRender),
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
                                articleDisplayWidgets.map((Component, i) =>
                                    <Component key={i} article={this.props.item} />,
                                )
                            }
                        </div>
                    )
                }
            </div>
        );
    }
}
