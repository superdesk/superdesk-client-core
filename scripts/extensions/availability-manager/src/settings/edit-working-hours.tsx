import {mergeSets} from '@sourcefabric/common';
import * as React from 'react';
import {
    FormLabel,
    IconButton,
    Spacer,
    TimePicker,
    TreeSelect,
} from 'superdesk-ui-framework/react';
import {TAGS_VOCABULARY_ID} from '../constants';
import {ITagsWhiteList, IWorkingHours} from '../interfaces';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;

const placeholder: IWorkingHours = {
    start_time: '',
    end_time: '',
    tags: [],
};

function setValueAtIndex<T>(array: Array<T>, index: number, item: T): Array<T> {
    const copy = [...array];

    copy[index] = item;

    return copy;
}

interface IProps {
    value: Array<IWorkingHours>;
    onChange(value: Array<IWorkingHours>): void;
    disabled?: boolean;
    tagsWhitelist: ITagsWhiteList;
    children(options: {labels: Array<React.ReactNode>, inputs: Array<Array<React.ReactNode>>}): React.ReactNode;
}

export class WithWorkingHoursEditor extends React.PureComponent<IProps> {
    render() {
        const tagsVocabulary = superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID);

        const workingHours: Array<IWorkingHours> = (() => {
            if (this.props.value == null || this.props.value.length < 1) {
                return [placeholder];
            } else {
                return this.props.value;
            }
        })();

        const disabled = this.props.disabled ?? false;

        return this.props.children({
            labels: [
                <div style={{whiteSpace: 'nowrap'}} key="working hours">
                    <FormLabel text={gettext('Working hours')} noMinHeight />
                </div>,
                <div style={{whiteSpace: 'nowrap'}} key="tags">
                    <FormLabel text={tagsVocabulary.display_name} noMinHeight />
                </div>,
                <span key="controls" />, // column for controls
            ],
            inputs: workingHours.map((item, rowIndex) => {
                const isLast = rowIndex === workingHours.length - 1;

                return [
                    (
                        <Spacer h gap="4" justifyContent="start" noWrap key="time-pickers">
                            <TimePicker
                                inlineLabel
                                labelHidden
                                value={item.start_time}
                                onChange={(nextTime) => {
                                    this.props.onChange(setValueAtIndex(
                                        workingHours,
                                        rowIndex,
                                        {
                                            ...item,
                                            start_time: nextTime,
                                        },
                                    ));
                                }}
                                disabled={disabled}
                            />

                            <div
                                style={{
                                    color: 'var(--color-text-light)',
                                    paddingInline: '4px',
                                }}
                            >
                                {gettext('to')}
                            </div>

                            <TimePicker
                                inlineLabel
                                labelHidden
                                value={item.end_time}
                                onChange={(nextTime) => {
                                    this.props.onChange(setValueAtIndex(
                                        workingHours,
                                        rowIndex,
                                        {
                                            ...item,
                                            end_time: nextTime,
                                        },
                                    ));
                                }}
                                disabled={disabled}
                            />
                        </Spacer>
                    ),

                    (
                        <div style={{display: 'flex', alignItems: 'center'}} key="tag-select">
                            <TreeSelect
                                inlineLabel
                                labelHidden
                                kind="synchronous"
                                value={item.tags ?? []}
                                getId={({code}) => code}
                                getLabel={({code}) => code}
                                getOptions={() => {
                                    if (this.props.tagsWhitelist.size < 1) {
                                        return tagsVocabulary.items.map((item) => ({value: {code: item.qcode}}));
                                    } else {
                                        const current = new Set<string>((item.tags ?? []).map(({code}) => code));

                                        return Array.from(mergeSets(current, this.props.tagsWhitelist))
                                            .map((code) => ({value: {code}}));
                                    }
                                }}
                                onChange={(nextTags) => {
                                    this.props.onChange(setValueAtIndex(
                                        workingHours,
                                        rowIndex,
                                        {
                                            ...item,
                                            tags: nextTags,
                                        },
                                    ));
                                }}
                                allowMultiple
                                fullWidth={false}
                                disabled={disabled}
                            />
                        </div>
                    ),

                    (
                        <div style={{display: 'flex', alignItems: 'center', whiteSpace: 'nowrap'}} key="controls">
                            {isLast && (
                                <>
                                    <IconButton
                                        icon="plus-sign"
                                        ariaValue={gettext('Add')}
                                        onClick={() => {
                                            this.props.onChange([
                                                ...workingHours,
                                                placeholder,
                                            ]);
                                        }}
                                        disabled={disabled}
                                    />

                                    <IconButton
                                        icon="minus-sign"
                                        ariaValue={gettext('Remove')}
                                        onClick={() => {
                                            this.props.onChange(
                                                workingHours.slice(0, workingHours.length - 1),
                                            );
                                        }}
                                        disabled={disabled || workingHours.length <= 1}
                                    />
                                </>
                            )}
                        </div>
                    ),
                ];
            }),
        });
    }
}
