import React from 'react';
import {isCheckAllowed} from '../helpers';
import {gettext} from 'core/utils';

interface IProps {
    item: any;
    classes?: any;
    onMultiSelect: any;
}

export class SelectBox extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);

        this.toggle = this.toggle.bind(this);
    }

    toggle(event) {
        if (event && (event.ctrlKey || event.shiftKey)) {
            return false;
        }

        event.stopPropagation();
        if (isCheckAllowed(this.props.item)) {
            const selected = !this.props.item.selected;

            this.props.onMultiSelect([this.props.item], selected, event);
        }
    }

    render() {
        if (this.props.item.selected) {
            this.props.item.selected = isCheckAllowed(this.props.item);
        }

        return (
            <div
                className={this.props.classes ? this.props.classes : 'selectbox'}
                title={isCheckAllowed(this.props.item) ? null : gettext('selection not allowed')}
                onClick={this.toggle}
            >
                <span className={'sd-checkbox' + (this.props.item.selected ? ' checked' : '')} />
            </div>
        );
    }
}
