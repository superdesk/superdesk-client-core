import * as React from 'react';
import {IDropdownConfigRemoteSource, IDropdownValue} from '..';
import {MultiSelectTreeWithTemplate} from 'core/ui/components/MultiSelectTreeWithTemplate';

interface IProps {
    config: IDropdownConfigRemoteSource;
    value: IDropdownValue;
    language: string;
    onChange(value: IDropdownValue): void;
}

export class EditorRemoteSource extends React.PureComponent<IProps> {
    render() {
        const {config} = this.props;
        const values = this.props.value;

        return (
            <MultiSelectTreeWithTemplate
                kind="asynchronous"
                searchOptions={(term, callback) => {
                    config.searchOptions(term, this.props.language, (result) => {
                        callback(result);
                    });

                    return () => null;
                }}
                values={values as Array<unknown>}
                onChange={(_values) => {
                    this.props.onChange(_values);
                }}
                optionTemplate={
                    ({item}) => <span style={{border: '1px dotted blue'}}>{config.getLabel(item)}</span>
                }
                valueTemplate={
                    ({item}) => <span style={{border: '1px dotted green'}}>{config.getLabel(item)}</span>
                }
                getId={(option) => config.getId(option)}
                getLabel={(option) => config.getLabel(option)}
                allowMultiple={config.multiple}
            />
        );
    }
}
