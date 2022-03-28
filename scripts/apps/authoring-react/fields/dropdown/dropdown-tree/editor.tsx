import * as React from 'react';
import {IDropdownTreeConfig, IDropdownValue} from '..';
import {MultiSelectTreeWithTemplate} from 'core/ui/components/MultiSelectTreeWithTemplate';

interface IProps {
    config: IDropdownTreeConfig;
    value: IDropdownValue;
    language: string;
    onChange(value: IDropdownValue): void;
}

export class EditorDropdownTree extends React.PureComponent<IProps> {
    render() {
        const {config} = this.props;
        const values = this.props.value;

        return (
            <MultiSelectTreeWithTemplate
                kind="synchronous"
                getOptions={() => config.getItems()}
                values={values as Array<unknown>}
                onChange={(_values) => {
                    this.props.onChange(_values);
                }}
                getId={(option) => config.getId(option)}
                getLabel={(option) => config.getLabel(option)}
                optionTemplate={config.optionTemplate}
                valueTemplate={config.valueTemplate}
                allowMultiple={config.multiple}
            />
        );
    }
}
