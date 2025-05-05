import * as React from 'react';
import {Spacer} from '@sourcefabric/common';
import {addDays} from 'date-fns';
import {Button, DatePicker, IconButton, RadioButtonGroup} from 'superdesk-ui-framework/react';
import {StatusSelect} from '../components/status-select';
import {filterPeriods, LANGUAGES_VOCABULARY, TAGS_VOCABULARY_ID} from '../constants';
import {IAvailabilityRecord, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';

const {VocabularySelect} = superdesk.components;
const {gettext} = superdesk.localization;

interface IProps {
    value: IFilters;
    onChange(value: IFilters): void
    filterPeriod: 'day' | 'week';
    onFilterPeriodChange(value: 'day' | 'week'): void;
    paddingInline: string;
}

export class Filters extends React.PureComponent<IProps> {
    render() {
        const tagsVocabulary = superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID);
        const languagesVocabulary = superdesk.entities.vocabulary.getAll().get(LANGUAGES_VOCABULARY);

        const {paddingInline} = this.props;

        return (
            <Spacer v gap="8" noWrap>
                <Spacer h gap="8" justifyContent="space-between" noWrap style={{paddingInline}}>
                    <Spacer h gap="8" justifyContent="start" noGrow>
                        <Button
                            text={gettext('Today')}
                            style="hollow"
                            onClick={() => {
                                this.props.onChange({
                                    ...this.props.value,
                                    date: new Date(),
                                });
                            }}
                        />

                        <div>
                            <IconButton
                                ariaValue={gettext('Previous day')}
                                icon="chevron-left-thin"
                                onClick={() => {
                                    this.props.onChange({
                                        ...this.props.value,
                                        date: addDays(this.props.value.date, -1),
                                    });
                                }}
                            />

                            <IconButton
                                ariaValue={gettext('Next day')}
                                icon="chevron-right-thin"
                                onClick={() => {
                                    this.props.onChange({
                                        ...this.props.value,
                                        date: addDays(this.props.value.date, 1),
                                    });
                                }}
                            />
                        </div>

                        <DatePicker
                            label={gettext('Day')}
                            inlineLabel
                            labelHidden
                            value={this.props.value.date}
                            onChange={(val) => {
                                if (val != null) {
                                    this.props.onChange({
                                        ...this.props.value,
                                        date: val,
                                    });
                                }
                            }}
                            dateFormat={superdesk.instance.config.view.dateformat}
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

                <Spacer h gap="8" justifyContent="start" noWrap style={{paddingInline}}>
                    <div style={{minWidth: 300}}>
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
                        />
                    </div>

                    <div style={{minWidth: 300}}>
                        <StatusSelect
                            label={{text: gettext('Status'), inline: true}}
                            value={this.props.value.status.map(({code}) => code as IAvailabilityRecord['status'])}
                            onChange={(val) => {
                                this.props.onChange({
                                    ...this.props.value,
                                    status: val.map((qcode) => ({code: qcode})),
                                });
                            }}
                            allowMultiple
                        />
                    </div>

                    <div style={{minWidth: 300}}>
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
                            fullWidth={true}
                            selectBranchWithChildren
                            data-test-id="tags"
                        />
                    </div>
                </Spacer>
            </Spacer>
        );
    }
}
