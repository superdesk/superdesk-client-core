import * as React from 'react';
import {ITreeWithLookup, MultiSelectTreeWithTemplate} from 'core/ui/components/MultiSelectTreeWithTemplate';
import {IDropdownConfigManualSource, IDropdownConfigVocabulary, IDropdownOption, IDropdownValue} from '.';
import {DropdownItemTemplate} from './dropdown-item-template';
import {getOptions} from './dropdown-vocabulary/get-options';
import {assertNever, notNullOrUndefined} from 'core/helpers/typescript-helpers';
import {IVocabularyItem, IVocabulary, IEditorComponentContainerProps} from 'superdesk-api';
import {arrayToTree} from 'core/helpers/tree';
import {keyBy} from 'lodash';

interface IProps {
    container: React.ComponentType<IEditorComponentContainerProps>;
    config: IDropdownConfigManualSource | IDropdownConfigVocabulary;
    value: IDropdownValue;
    language: string;
    getVocabularyItems(vocabulary: IVocabulary['_id']): Array<IVocabularyItem>;
    onChange(value: IDropdownValue): void;
}

export class EditorUsingManualSourceOrVocabulary extends React.PureComponent<IProps> {
    render() {
        const {config} = this.props;
        const Container = this.props.container;
        const values: Array<string> | Array<number> = (() => {
            if (this.props.value == null) {
                return [];
            } else if (Array.isArray(this.props.value)) {
                return this.props.value;
            } else {
                return [this.props.value];
            }
        })();

        const options: ITreeWithLookup<IDropdownOption> = (() => {
            if (config.source === 'manual-entry') {
                const _options: ITreeWithLookup<IDropdownOption> = {
                    nodes: arrayToTree(
                        config.options,
                        ({id}) => id.toString(),
                        ({parent}) => parent?.toString(),
                    ).result,
                    lookup: keyBy(
                        config.options.map((opt) => ({value: opt})),
                        (opt) => opt.value.id.toString(),
                    ),
                };

                return _options;
            } else if (config.source === 'vocabulary') {
                return getOptions(config, this.props.getVocabularyItems);
            } else {
                assertNever(config);
            }
        })();

        const selected =
            values
                .map((val) => options.lookup[val.toString()])
                .filter(notNullOrUndefined)
                .map(({value}) => value);

        const noPadding = selected.every(({color}) => color == null);

        if (selected.length < 1 && options.nodes.length < 1) {
            return null; // hide field
        }

        return (
            <Container>
                <MultiSelectTreeWithTemplate
                    kind="synchronous"
                    getOptions={() => options}
                    values={selected}
                    onChange={(_values) => {
                        const ids = _values.map((val) => val.id);

                        this.props.onChange(config.multiple ? ids : ids[0] ?? null);
                    }}
                    optionTemplate={({item}) => (
                        <DropdownItemTemplate
                            option={item}
                            config={config}
                            noPadding={false}
                        />
                    )}
                    valueTemplate={({item}) => (
                        <DropdownItemTemplate
                            option={item}
                            config={config}
                            noPadding={noPadding}
                        />
                    )}
                    getId={(option) => option.id.toString()}
                    getLabel={(option) => option.label}
                    allowMultiple={config.multiple}
                />
            </Container>
        );
    }
}
