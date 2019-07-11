import React, {ReactElement} from 'react';
import {get} from 'lodash';
import classNames from 'classnames';

import {IArticle} from 'superdesk-api';

import {ListTypeIcon} from './ListTypeIcon';
import {SwimlaneField} from './SwimlaneField';
import {DEFAULT_SWIMLANE_FIELDS_CONFIG} from '../constants';

const renderGroup = (groups, item: IArticle, svc) => groups.map((group, groupIndex) => (
    <span
        key={groupIndex}
        className={classNames({
            'sd-list-item__column': true,
            'sd-list-item__column--grow': group.ellipsis === true,
            'sd-list-item__column--no-border': groupIndex === groups.length - 1,
        })}>
        <span className="sd-list-item__row">
            <span className={classNames({'sd-overflow-ellipsis': group.ellipsis === true})}>
                {
                    group.fields
                        .map((field, fieldIndex) => (
                            <SwimlaneField
                                key={fieldIndex}
                                fieldId={field}
                                item={item}
                                svc={svc}
                            />
                        ))
                }
            </span>
        </span>
    </span>
));

interface IProps {
    item: IArticle;
    isLocked: boolean;
    getActionsMenu: (fn) => ReactElement<any>;
    onMultiSelect: () => void;
    svc: any;
}

export class ItemSwimlane extends React.Component<IProps, any> {
    render() {
        const {item, isLocked, getActionsMenu, svc} = this.props;

        const swimlaneViewFieldsConfig = get(
            this.props.svc.config, 'swimlaneViewFields',
            DEFAULT_SWIMLANE_FIELDS_CONFIG,
        );

        return (
            <div className="sd-list-item" style={{borderBottom: '1px solid #e7e7e7'}}>
                <span
                    style={{
                        minWidth: '4px',
                        maxWidth: '4px',
                        background: isLocked ? '#e51c23' : 'transparent',
                    }} />
                <span className="sd-list-item__column">
                    <ListTypeIcon
                        item={item}
                        onMultiSelect={this.props.onMultiSelect}
                        svc={svc}
                    />
                </span>
                {renderGroup(swimlaneViewFieldsConfig.left, item, svc)}
                <span className="sd-list-item--element-grow" />
                {renderGroup(swimlaneViewFieldsConfig.right, item, svc)}
                {
                    getActionsMenu((toggle, stopEvent) => (
                        <div className="sd-list-item__action-menu">
                            <button
                                className="icn-btn"
                                onClick={toggle}
                                onDoubleClick={stopEvent}>
                                <i className="icon-dots-vertical" />
                            </button>
                        </div>
                    ))
                }
            </div>
        );
    }
}
