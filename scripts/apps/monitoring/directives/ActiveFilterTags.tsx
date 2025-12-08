import * as React from 'react';
import {gettext} from 'core/utils';
import {Button, Spacer, Tag, Text} from 'superdesk-ui-framework';
import {IActiveFilters} from '../controllers/types';
import {getTagsConfig, getTagsWithValues} from './utils';

interface IProps {
    activeFilters?: IActiveFilters;
    removeFilter: (id: string | null, fieldId?: string) => void;
}

export class ActiveFilterTags extends React.PureComponent<IProps> {
    render() {
        const {activeFilters} = this.props;

        const filteredActiveTags = getTagsWithValues(activeFilters);
        const hasValues = Object.keys(filteredActiveTags).length != 0;

        if (!hasValues) {
            return null;
        }

        const filterIds = Object.keys(filteredActiveTags);
        const filtersConfig = getTagsConfig(filterIds);

        return (
            <Spacer
                data-test-id="active-filter-tags"
                justifyContent="stretch"
                noWrap
                h
                gap="4"
                style={{
                    backgroundColor: 'var(--sd-colour-panel-bg--000)',
                    paddingInline: 'calc(2 * var(--base-increment))',
                    paddingBlock: 'calc(1 * var(--base-increment))',
                    animation: 'dropOut2 0.3s cubic-bezier(0.695, 0.105, 0.285, 1.275) 1',
                }}
            >
                <Spacer
                    h
                    gap="16"
                    justifyContent="start"
                    noWrap
                    style={{
                        overflowY: 'scroll',
                    }}
                >
                    {gettext('Filters')}:
                    <Spacer
                        h
                        gap="4"
                        justifyContent="start"
                        noWrap
                    >
                        {Object.entries(filteredActiveTags)
                            .map(([fieldId, values], i) => {
                                const isLastInGroup = i === Object.keys(filteredActiveTags).length - 1;

                                return (
                                    <Spacer h gap="8" noGrow key={fieldId}>
                                        <Spacer h gap="4" noGrow>
                                            {values.map((tagId, index) => {
                                                const isLastTagInGroup = index === values.length - 1;
                                                const filterConfig = filtersConfig[fieldId];
                                                const tagLabel = filterConfig.label.toLowerCase();
                                                const optionLabel = filterConfig.options
                                                    .find((x) => x.id === tagId).label;

                                                return (
                                                    <Spacer h gap="4" key={tagId}>
                                                        <Tag
                                                            text={`${tagLabel}: ${optionLabel}`}
                                                            onClick={() => {
                                                                this.props.removeFilter(tagId, fieldId);
                                                            }}
                                                            shape="round"
                                                        />
                                                        {!isLastTagInGroup && (
                                                            <Text
                                                                style="italic"
                                                                align="center"
                                                                noMargin
                                                            >
                                                                {
                                                                    filterConfig.operator === 'OR'
                                                                        ? gettext('OR')
                                                                        : gettext('AND')
                                                                }
                                                            </Text>
                                                        )}
                                                    </Spacer>
                                                );
                                            })}
                                        </Spacer>
                                        {!isLastInGroup && (
                                            <Text style="italic" align="center" noMargin>{gettext('AND')}</Text>
                                        )}
                                    </Spacer>
                                );
                            })}
                    </Spacer>
                </Spacer>
                <Button
                    onClick={() => {
                        this.props.removeFilter(null);
                    }}
                    text={gettext('Clear filters')}
                    size="small"
                    style="hollow"
                    data-test-id="remove-all-filters"
                />
            </Spacer>
        );
    }
}
