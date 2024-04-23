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
    itemSelected: boolean;
    isLocked: boolean;
    getActionsMenu: (fn) => ReactElement<any>;
    multiSelect: IMultiSelectNew | ILegacyMultiSelect;
}

export class ItemSwimlane extends React.Component<IProps, any> {
    render() {
        const {item, itemSelected, isLocked, getActionsMenu, multiSelect} = this.props;

        const swimlaneViewFieldsConfig = appConfig.swimlaneViewFields ?? DEFAULT_SWIMLANE_FIELDS_CONFIG;

        return (
            <div
                className={classNames('sd-list-item', {
                    'active': itemSelected,
                    'selected': itemSelected,
                })}
                style={{borderBottom: '1px solid var(--sd-colour-line--light)'}}
            >
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
                        itemSelected={itemSelected}
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
