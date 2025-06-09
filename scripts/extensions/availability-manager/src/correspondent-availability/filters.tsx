/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {Spacer} from '@sourcefabric/common';
import {addDays, startOfWeek} from 'date-fns';
import {Button, DatePicker, FormLabel, IconButton, RadioButtonGroup, InputWrapper} from 'superdesk-ui-framework/react';
import {StatusSelect} from '../components/status-select';
import {filterPeriods, LANGUAGES_VOCABULARY, TAGS_VOCABULARY_ID} from '../constants';
import {IAvailabilityRecord, IFilters, IWeekday} from '../interfaces';
import {superdesk} from '../superdesk';

const {VocabularySelect} = superdesk.components;
const {gettext, locale} = superdesk.localization;
const {getLocaleForDatePicker} = superdesk.ui.framework;
const {assertNever} = superdesk.helpers;

interface IProps {
    value: IFilters;
    onChange(value: IFilters): void
    filterPeriod: 'day' | 'week';
    onFilterPeriodChange(value: 'day' | 'week'): void;
    paddingInline: string;
}

const inputWrapperHorizontal: React.ComponentProps<typeof InputWrapper>['inputWrapper'] = {
    kind: 'custom',
    component: ({label, input, ...props}) => (
        <Spacer h gap="4" noGrow data-test-id={props['data-test-id']}>
            <FormLabel text={label} noMinHeight noMinWidth />

            <div style={{minWidth: 130}}>
                {input}
            </div>
        </Spacer>
    ),
};

inputWrapperHorizontal.component.displayName = 'inputWrapperHorizontal';

export class Filters extends React.PureComponent<IProps> {
    /** @deprecated workaround for a bug in datepicker */
    private dayChangeCount: number;

    constructor(props: IProps) {
        super(props);

        this.dayChangeCount = 0;
    }
    render() {
        const tagsVocabulary = superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID);
        const languagesVocabulary = superdesk.entities.vocabulary.getAll().get(LANGUAGES_VOCABULARY);

        const {paddingInline} = this.props;

        const dayStep = (() => {
            switch (this.props.filterPeriod) {
                case 'day':
                    return 1;
                case 'week':
                    return 7;
                default:
                    return assertNever(this.props.filterPeriod);
            }
        })();

        return (
            <Spacer v gap="8" noWrap data-test-id="filters">
                <Spacer h gap="8" justifyContent="space-between" noWrap style={{paddingInline}}>
                    <Spacer h gap="8" justifyContent="start" noGrow>
                        <Button
                            text={gettext('Today')}
                            style="hollow"
                            onClick={() => {
                                const val = new Date();

                                // PR-TODO: use stashed setState middleware instead
                                const nextVal: Date = (() => {
                                    switch (this.props.filterPeriod) {
                                        case 'day':
                                            return val;
                                        case 'week':
                                            this.dayChangeCount++;

                                            return startOfWeek(
                                                val,
                                                {
                                                    weekStartsOn: locale.firstDayOfWeek as IWeekday,
                                                },
                                            );
                                        default:
                                            return assertNever(this.props.filterPeriod);
                                    }
                                })();

                                this.props.onChange({
                                    ...this.props.value,
                                    date: nextVal,
                                });
                            }}
                        />

                        <div>
                            <IconButton
                                ariaValue={gettext('Previous')}
                                icon="chevron-left-thin"
                                onClick={() => {
                                    this.props.onChange({
                                        ...this.props.value,
                                        date: addDays(this.props.value.date, -dayStep),
                                    });
                                }}
                            />

                            <IconButton
                                ariaValue={gettext('Next')}
                                icon="chevron-right-thin"
                                onClick={() => {
                                    this.props.onChange({
                                        ...this.props.value,
                                        date: addDays(this.props.value.date, dayStep),
                                    });
                                }}
                            />
                        </div>

                        <DatePicker
                            key={this.dayChangeCount}
                            label={gettext('Day')}
                            inlineLabel
                            labelHidden
                            value={this.props.value.date}
                            onChange={(val) => {
                                if (val != null) {
                                    const nextVal: Date = (() => {
                                        switch (this.props.filterPeriod) {
                                            case 'day':
                                                return val;
                                            case 'week':
                                                this.dayChangeCount++;

                                                return startOfWeek(
                                                    val,
                                                    {
                                                        weekStartsOn: locale.firstDayOfWeek as IWeekday,
                                                    },
                                                );
                                            default:
                                                return assertNever(this.props.filterPeriod);
                                        }
                                    })();

                                    this.props.onChange({
                                        ...this.props.value,
                                        date: nextVal,
                                    });
                                }
                            }}
                            dateFormat={superdesk.instance.config.view.dateformat}
                            locale={{
                                type: 'full',
                                payload: getLocaleForDatePicker(locale.code),
                            }}
                        />
                    </Spacer>

                    <div>
                        <RadioButtonGroup
                            value={this.props.filterPeriod}
                            options={filterPeriods.map(({id, label}) => ({value: id, label}))}
                            onChange={(val) => {
                                this.props.onFilterPeriodChange(val as IProps['filterPeriod']);
                            }}
                            data-test-id="filter-type"
                        />
                    </div>
                </Spacer>

                <hr style={{borderColor: 'var(--color-border-line--light)', width: '100%', margin: 0}} />

                <Spacer h gap="16" justifyContent="start" alignItems="center" noGrow style={{paddingInline}}>
                    <VocabularySelect
                        label={{text: languagesVocabulary.display_name, position: 'left'}}
                        value={this.props.value.language}
                        getOptions={() => languagesVocabulary.items}
                        onChange={(items) => {
                            this.props.onChange({
                                ...this.props.value,
                                language: items,
                            });
                        }}
                        multiple={true}
                        fullWidth={true}
                        data-test-id="languages"
                        inputWrapper={inputWrapperHorizontal}
                    />

                    <StatusSelect
                        allowNotSet={true}
                        label={{text: gettext('Status'), inline: true}}
                        value={(() => {
                            if (this.props.value.status === null) {
                                return [{notSet: true}];
                            } else if (typeof this.props.value.status === 'undefined') {
                                return [];
                            } else {
                                return [this.props.value.status.code as IAvailabilityRecord['status']];
                            }
                        })()}
                        onChange={([val]) => {
                            this.props.onChange({
                                ...this.props.value,
                                status: ((): IFilters['status'] => {
                                    if (typeof val === 'undefined') {
                                        return undefined;
                                    } else if (typeof val === 'string') {
                                        return {code: val};
                                    } else {
                                        return null;
                                    }
                                })(),
                            });
                        }}
                        allowMultiple={false}
                        inputWrapper={inputWrapperHorizontal}
                    />

                    <VocabularySelect
                        label={{text: tagsVocabulary.display_name, position: 'left'}}
                        value={this.props.value.tags.map(({code}) => code)}
                        getOptions={() => tagsVocabulary.items}
                        onChange={(items) => {
                            this.props.onChange({
                                ...this.props.value,
                                tags: items.map((qcode) => ({code: qcode})),
                            });
                        }}
                        multiple={true}
                        fullWidth={false}
                        selectBranchWithChildren
                        inputWrapper={inputWrapperHorizontal}
                        data-test-id="tags"
                    />
                </Spacer>
            </Spacer>
        );
    }
}
