import React from 'react';
import {Button, TreeMenu} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

interface IProps {
    availableFields: Array<{id: string; label: string; fieldType?: string;}>;
    onSelect(value: string): void;
}

export class NewFieldSelect extends React.PureComponent<IProps> {
    render() {
        const {availableFields} = this.props;

        return (
            <div>
                <TreeMenu
                    getId={(field) => field.id}
                    optionTemplate={({fieldType, label}) => {
                        return (fieldType != null && fieldType !== '')
                            ? <>{label} <span className="sd-text--italic sd-text--light">({fieldType})</span></>
                            : <>{label}</>;
                    }}
                    getLabel={({label}) => label}
                    zIndex={1050}
                    getOptions={() => availableFields
                        .map((field) => ({
                            value: field,
                            onSelect: () => this.props.onSelect(field.id),
                        }))
                    }
                >
                    {(toggle) => (
                        <Button
                            icon="plus-large"
                            text={gettext('Add new field')}
                            shape="round"
                            iconOnly={true}
                            onClick={toggle}
                        />
                    )}
                </TreeMenu>
            </div>
        );
    }
}
