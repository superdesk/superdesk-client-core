import React from 'react';
import classNames from 'classnames';

import {renderArea} from '../helpers';
import {flatMap} from 'lodash';
import {extensions} from 'appConfig';
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
    versioncreator: any;
    isNested: boolean;
    showNested: boolean;
    toggleNested: (event) => void;
    singleLine: boolean;
    customRender: any;
    viewType: any;
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

        if (this.props.singleLine) {
            className = 'item-info item-info-reduced-rowheight';
            listItems = React.createElement(
                'div',
                {style: {flexGrow: 1, flexDirection: 'column', overflow: 'hidden'}},
                renderArea('singleLine', angular.extend({
                    viewType: this.props.viewType, // for highlights list
                    singleLine: this.props.singleLine,
                }, this.props), {className: 'line article-list-fields'}),
            );
        } else {
            className = classNames('item-info', {'item-info-reduced-rowheight': this.props.singleLine});
            listItems = React.createElement(
                'div',
                {style: {flexGrow: 1, flexDirection: 'column', overflow: 'hidden'}},
                renderArea('firstLine', angular.extend({
                    viewType: this.props.viewType, // for highlights list
                    singleLine: this.props.singleLine,
                }, this.props), {className: 'line'}, this.props.customRender),
                renderArea('secondLine', angular.extend({
                    viewType: this.props.viewType, // for highlights list
                    singleLine: this.props.singleLine,
                }, this.props), {className: 'line'}, this.props.customRender),
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
                        <div style={{marginLeft: 10, display: 'flex'}} className="sibling-spacer-10">
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
