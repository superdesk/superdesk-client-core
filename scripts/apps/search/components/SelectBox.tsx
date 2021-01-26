/* eslint-disable react/no-multi-comp */

import React from 'react';
import {isCheckAllowed} from '../helpers';
import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';

interface IPropsSelectBox {
    item: IArticle;
    onMultiSelect(items: Array<IArticle>, selected: boolean): void;
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
                onSelect={(selected) => {
                    this.props.onMultiSelect([this.props.item], selected);
                }}
                data-test-id="multi-select-checkbox"
            />
        );
    }
}

interface IPropsSelectBoxWithoutMutation {
    item: IArticle;
    selected: boolean;
    onSelect(selected: boolean): void;
    className?: string;
    'data-test-id'?: string;
}

export class SelectBoxWithoutMutation extends React.PureComponent<IPropsSelectBoxWithoutMutation> {
    constructor(props: IPropsSelectBoxWithoutMutation) {
        super(props);

        this.toggle = this.toggle.bind(this);
    }

    toggle(event) {
        if (event && (event.ctrlKey || event.shiftKey)) {
            return false;
        }

        if (isCheckAllowed(this.props.item)) {
            const selected = !this.props.selected;

            this.props.onSelect(selected);
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
                data-test-id={this.props['data-test-id']}
            >
                <span className={'sd-checkbox' + (this.props.selected ? ' checked' : '')} />
            </button>
        );
    }
}
