import * as React from 'react';
import {NavButton, Spacer, TreeSelect, WithPopover} from 'superdesk-ui-framework';
import {ITreeNode, Dictionary, IMonitoringListFilter} from 'superdesk-api';
import {listFiltersConfig} from './utils';

interface IProps {
    selectedValues: Dictionary<string, Array<string>>;
    onChange(fieldId: string, value: Array<{id: string; label: string}>, label: string): void;
}

export class MonitoringCustomFiltersDropdown extends React.PureComponent<IProps> {
    private filtersConfig: Array<IMonitoringListFilter>;

    constructor(props: IProps) {
        super(props);

        this.filtersConfig = listFiltersConfig;
    }

    private getVocabularyOptions(fieldId: string): Array<ITreeNode<{id: string; label: string}>> {
        const fieldConfig = this.filtersConfig.find((filter) => filter.fieldId === fieldId);
        const options = fieldConfig.getOptions();

        return options.map((x) => ({value: {id: x.id, label: x.label}}));
    }

    private handleFilterChange(
        fieldId: string,
        values: Array<{id: string; label: string}>,
        label: string,
    ) {
        this.props.onChange(fieldId, values, label);
    }

    render() {
        return (
            <WithPopover
                shouldClose={(e) => {
                    const target = e.target as HTMLElement;

                    return target.closest('.autocomplete.autocomplete--multi-select') == null;
                }}
                component={() => (
                    <div>
                        <Spacer
                            v
                            gap="16"
                            style={{
                                padding: 12,
                                backgroundColor: 'var(--color-dropdown-menu-Bg)',
                                boxShadow: 'var(--sd-shadow__dropdown)',
                                minWidth: 500,
                                maxWidth: 500,
                            }}
                        >
                            {this.filtersConfig.map(({fieldId, selectMultiple, label}, filterIndex) => {
                                const selectedValuesConverted = (() => {
                                    if (this.props.selectedValues?.[fieldId] == null) {
                                        return null;
                                    }

                                    const fieldConfig = this.filtersConfig
                                        .find((filter) => filter.fieldId === fieldId);

                                    return fieldConfig.getOptions()
                                        .filter((x) =>
                                            (this.props.selectedValues[fieldId] ?? []).includes(x.id),
                                        );
                                })();

                                return (
                                    <TreeSelect
                                        key={`${filterIndex}-${filterIndex}`}
                                        kind="synchronous"
                                        value={selectedValuesConverted}
                                        getOptions={() => this.getVocabularyOptions(fieldId)}
                                        onChange={(values) => this.handleFilterChange(fieldId, values, label)}
                                        getLabel={(item) => item.label}
                                        getId={(item) => item.id}
                                        label={label}
                                        allowMultiple={selectMultiple}
                                        data-test-id={`filter-${fieldId}`}
                                    />
                                );
                            })}
                        </Spacer>
                    </div>
                )}
                placement="bottom-start"

            >
                {(toggle) => (
                    <NavButton
                        type="default"
                        icon="filter-large"
                        state="normal"
                        value="button"
                        onClick={(e) => {
                            toggle(e.target as HTMLDivElement);
                        }}
                        data-test-id="filters-dropdown"
                    />
                )}
            </WithPopover>
        );
    }
}
