import React from 'react';
import {Button, Dropdown} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

interface IProps {
    availableFields: Array<{id: string; label: string}>;
    onSelect(value: string): void;
}

export class NewFieldSelect extends React.PureComponent<IProps> {
    render() {
        const {availableFields} = this.props;

        return (
            <Dropdown
                append={true}
                items={availableFields.map(({id, label}) => ({
                    label: label,
                    onSelect: () => {
                        this.props.onSelect(id);
                    },
                }))}
            >
                <Button
                    icon="plus-large"
                    text={gettext('Add new field')}
                    shape="round"
                    iconOnly={true}
                    onClick={() => false}
                />
            </Dropdown>
        );
    }
}
