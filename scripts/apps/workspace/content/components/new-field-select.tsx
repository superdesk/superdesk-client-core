import React from 'react';
import {Button, Menu} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

interface IProps {
    availableFields: Array<{id: string; label: string}>;
    onSelect(value: string): void;
}

export class NewFieldSelect extends React.PureComponent<IProps> {
    render() {
        const {availableFields} = this.props;

        return (
            <Menu
                items={availableFields.map(({id, label}) => ({
                    label: label,
                    onClick: () => {
                        this.props.onSelect(id);
                    },
                }))}
            >
                {(toggle) => (
                    <Button
                        icon="plus-large"
                        text={gettext('Add new field')}
                        shape="round"
                        iconOnly={true}
                        onClick={(e) => toggle(e)}
                    />
                )}
            </Menu>
        );
    }
}
