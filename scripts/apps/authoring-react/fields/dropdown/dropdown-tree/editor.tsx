import * as React from 'react';
import {MultiSelectTreeWithTemplate} from 'core/ui/components/MultiSelectTreeWithTemplate';
import {IEditorComponentContainerProps, IDropdownTreeConfig, IDropdownValue} from 'superdesk-api';

interface IProps {
    container: React.ComponentType<IEditorComponentContainerProps>;
    config: IDropdownTreeConfig;
    value: IDropdownValue;
    language: string;
    onChange(value: IDropdownValue): void;
}

export class EditorDropdownTree extends React.PureComponent<IProps> {
    render() {
        const {config} = this.props;
        const Container = this.props.container;
        const values = this.props.value;

        return (
            <Container>
                <MultiSelectTreeWithTemplate
                    kind="synchronous"
                    getOptions={() => config.getItems()}
                    values={values as Array<unknown>}
                    onChange={(_values) => {
                        this.props.onChange(_values);
                    }}
                    getId={(option) => config.getId(option)}
                    getLabel={(option) => config.getLabel(option)}
                    canSelectBranchWithChildren={config.canSelectBranchWithChildren}
                    optionTemplate={config.optionTemplate}
                    valueTemplate={config.valueTemplate}
                    allowMultiple={config.multiple}
                />
            </Container>
        );
    }
}
