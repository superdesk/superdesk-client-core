import * as React from 'react';
import {
    IconButton,
    Spacer,
    TimePicker,
} from 'superdesk-ui-framework/react';
import {tagsSelectWidth, TAGS_VOCABULARY_ID} from '../constants';
import {ITagsWhiteList, IWorkingHours} from '../interfaces';
import {superdesk} from '../superdesk';
import {getFilteredTags} from '../utils';

const {gettext} = superdesk.localization;
const {VocabularySelect} = superdesk.components;

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
    columnsBefore?: React.ComponentType<{rowIndex: number}>;
}

export const workingHoursEditorColumnCount = 3;

export class WithWorkingHoursEditor extends React.PureComponent<IProps> {
    render() {
        const tagsVocabulary = superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID);
        const disabled = this.props.disabled ?? false;
        const ColumnsBefore = this.props.columnsBefore ?? (() => <React.Fragment />);

        const workingHours: Array<IWorkingHours> = (() => {
            if (this.props.value == null || this.props.value.length < 1) {
                return [placeholder];
            } else {
                return this.props.value;
            }
        })();

        return (
            <>
                {
                    workingHours.map((item, rowIndex) => {
                        const isLast = rowIndex === workingHours.length - 1;

                        return (
                            <React.Fragment key={rowIndex}>
                                <ColumnsBefore rowIndex={rowIndex} />

                                <div style={{width: tagsSelectWidth}}>
                                    <VocabularySelect
                                        label={{text: tagsVocabulary.display_name, hidden: true}}
                                        value={(item.tags ?? []).map(({code}) => code)}
                                        getOptions={() => getFilteredTags(
                                            new Set<string>((item.tags ?? []).map(({code}) => code)),
                                            this.props.tagsWhitelist,
                                        )}
                                        onChange={(qcodes) => {
                                            this.props.onChange(setValueAtIndex(
                                                workingHours,
                                                rowIndex,
                                                {
                                                    ...item,
                                                    tags: qcodes.map((qcode) => ({code: qcode})),
                                                },
                                            ));
                                        }}
                                        multiple={true}
                                        fullWidth={true}
                                        disabled={disabled}
                                        selectBranchWithChildren
                                        data-test-id="tags"
                                    />
                                </div>

                                <div style={{display: 'flex', alignItems: 'start'}}>
                                    <Spacer h gap="4" justifyContent="start" noGrow>
                                        <TimePicker
                                            label={gettext('Time from')}
                                            inlineLabel
                                            labelHidden
                                            value={item.start_time}
                                            onChange={(nextTime) => {
                                                if (nextTime === null) {
                                                    superdesk.ui.notify.error(gettext('Time cannot be empty'));
                                                } else {
                                                    this.props.onChange(
                                                        setValueAtIndex(
                                                            workingHours,
                                                            rowIndex,
                                                            {
                                                                ...item,
                                                                start_time: nextTime,
                                                            },
                                                        ),
                                                    );
                                                }
                                            }}
                                            disabled={disabled}
                                        />

                                        <div
                                            style={{
                                                color: 'var(--color-text-light)',
                                                paddingInline: 'var(--gap-0-5)',
                                            }}
                                        >
                                            {gettext('to')}
                                        </div>

                                        <TimePicker
                                            label={gettext('Time to')}
                                            inlineLabel
                                            labelHidden
                                            value={item.end_time}
                                            onChange={(nextTime) => {
                                                if (nextTime === null) {
                                                    superdesk.ui.notify.error(gettext('Time cannot be empty'));
                                                } else {
                                                    this.props.onChange(setValueAtIndex(
                                                        workingHours,
                                                        rowIndex,
                                                        {
                                                            ...item,
                                                            end_time: nextTime,
                                                        },
                                                    ));
                                                }
                                            }}
                                            disabled={disabled}
                                        />
                                    </Spacer>
                                </div>

                                {
                                    !isLast ? <span /> : (
                                        <Spacer h gap="0" alignItems="start" noWrap>
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
                                        </Spacer>
                                    )
                                }
                            </React.Fragment>
                        );
                    })
                }
            </>
        );
    }
}
