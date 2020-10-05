import React, {ReactElement} from 'react';
import classNames from 'classnames';

import {IArticle} from 'superdesk-api';

import {SwimlaneField} from './SwimlaneField';
import {DEFAULT_SWIMLANE_FIELDS_CONFIG} from '../constants';
import {appConfig} from 'appConfig';
import {ILegacyMultiSelect, IMultiSelectNew} from './ItemList';
import {MultiSelectCheckbox} from './MultiSelectCheckbox';

const renderGroup = (groups, item: IArticle) => groups.map((group, groupIndex) => (
    <span
        key={groupIndex}
        className={classNames({
            'sd-list-item__column': true,
            'sd-list-item__column--grow': group.ellipsis === true,
            'sd-list-item__column--no-border': groupIndex === groups.length - 1,
        })}
    >
        <span className="sd-list-item__row">
            <span className={classNames({'sd-overflow-ellipsis': group.ellipsis === true})}>
                {
                    group.fields
                        .map((field, fieldIndex) => (
                            <SwimlaneField
                                key={fieldIndex}
                                fieldId={field}
                                item={item}
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
    multiSelect: IMultiSelectNew | ILegacyMultiSelect;
}

export class ItemSwimlane extends React.Component<IProps, any> {
    render() {
        const {item, isLocked, getActionsMenu, multiSelect} = this.props;

        const swimlaneViewFieldsConfig = appConfig.swimlaneViewFields ?? DEFAULT_SWIMLANE_FIELDS_CONFIG;

        return (
            <div className="sd-list-item" style={{borderBottom: '1px solid #e7e7e7'}}>
                <span
                    style={{
                        minWidth: '4px',
                        maxWidth: '4px',
                        background: isLocked ? '#e51c23' : 'transparent',
                    }}
                />
                <span className="sd-list-item__column">
                    <MultiSelectCheckbox
                        item={item}
                        multiSelect={multiSelect}
                    />
                </span>
                {renderGroup(swimlaneViewFieldsConfig.left, item)}
                <span className="sd-list-item--element-grow" />
                {renderGroup(swimlaneViewFieldsConfig.right, item)}
                {
                    getActionsMenu((toggle, stopEvent) => (
                        <div className="sd-list-item__action-menu">
                            <button
                                className="icn-btn"
                                onClick={toggle}
                                onDoubleClick={stopEvent}
                            >
                                <i className="icon-dots-vertical" />
                            </button>
                        </div>
                    ))
                }
            </div>
        );
    }
}
