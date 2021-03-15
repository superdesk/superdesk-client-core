/* eslint-disable react/no-multi-comp */

import React from 'react';
import {isCheckAllowed} from '../helpers';
import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';

interface IPropsSelectBox {
    item: IArticle;
    onMultiSelect(
        item: IArticle,
        value: boolean,
        multiSelectMode: boolean,
    ): void;
}

export class SelectBox extends React.Component<IPropsSelectBox> {
    render() {
        if (this.props.item.selected) {
            this.props.item.selected = isCheckAllowed(this.props.item);
        }

        return (
            <SelectBoxWithoutMutation
                item={this.props.item}
                selected={this.props.item.selected === true}
                onSelect={(selected, multiSelectMode) => {
                    this.props.onMultiSelect(this.props.item, selected, multiSelectMode);
                }}
                data-test-id="multi-select-checkbox"
            />
        );
    }
}

interface IPropsSelectBoxWithoutMutation {
    item: IArticle;
    selected: boolean;
    onSelect(selected: boolean, multiSelectMode: boolean): void;
    className?: string;
    'data-test-id'?: string;
}

export class SelectBoxWithoutMutation extends React.PureComponent<IPropsSelectBoxWithoutMutation> {
    constructor(props: IPropsSelectBoxWithoutMutation) {
        super(props);

        this.toggle = this.toggle.bind(this);
    }

    toggle(event) {
        if (isCheckAllowed(this.props.item)) {
            const selected = !this.props.selected;
            const multiSelect = event.shiftKey;

            this.props.onSelect(selected, multiSelect);
        }
    }

    render() {
        return (
            <button
                title={isCheckAllowed(this.props.item) ? null : gettext('selection not allowed')}
                onClick={this.toggle}
                className={this.props.className}
                role="checkbox"
                aria-checked={this.props.selected}
                aria-label={gettext('bulk actions')}
                data-test-id={this.props['data-test-id']}
            >
                <span className={'sd-checkbox' + (this.props.selected ? ' checked' : '')} />
            </button>
        );
    }
}
