import * as React from 'react';
import {
    FormLabel,
    IconButton,
    Spacer,
    TimePicker,
    TreeSelect,
} from 'superdesk-ui-framework/react';
import {TAGS_VOCABULARY_ID} from '../constants';
import {IWorkingHours} from '../interfaces';
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
}

export class EditWorkingHours extends React.PureComponent<IProps> {
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

        return (
            <div style={{display: 'grid', gap: '8px', gridTemplateColumns: 'auto auto auto'}}>
                <FormLabel text={gettext('Working hours')} noMinHeight />
                <FormLabel text={gettext('Tags')} noMinHeight />
                <span /> {/** column for controls */}

                {
                    workingHours.map((item, i) => {
                        const isLast = i === workingHours.length - 1;

                        return (
                            <React.Fragment key={i}>
                                <Spacer h gap="4" key={i} justifyContent="start" noWrap>
                                    <TimePicker
                                        inlineLabel
                                        labelHidden
                                        value={item.start_time}
                                        onChange={(nextTime) => {
                                            this.props.onChange(setValueAtIndex(
                                                workingHours,
                                                i,
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
                                                i,
                                                {
                                                    ...item,
                                                    end_time: nextTime,
                                                },
                                            ));
                                        }}
                                        disabled={disabled}
                                    />
                                </Spacer>

                                <div>
                                    <TreeSelect
                                        inlineLabel
                                        labelHidden
                                        kind="synchronous"
                                        value={item.tags ?? []}
                                        getId={({code}) => code}
                                        getLabel={({code}) => code}
                                        getOptions={() => tagsVocabulary.items.map((item) => ({value: {code: item.qcode}}))}
                                        onChange={(nextTags) => {
                                            this.props.onChange(setValueAtIndex(
                                                workingHours,
                                                i,
                                                {
                                                    ...item,
                                                    tags: nextTags,
                                                },
                                            ));
                                        }}
                                        allowMultiple
                                        disabled={disabled}
                                    />
                                </div>

                                <div>
                                    {isLast && (
                                        <div>
                                            <IconButton
                                                icon='plus-sign'
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
                                                icon='minus-sign'
                                                ariaValue={gettext('Remove')}
                                                onClick={() => {
                                                    this.props.onChange(
                                                        workingHours.slice(0, workingHours.length - 1)
                                                    );
                                                }}
                                                disabled={disabled || workingHours.length <= 1}
                                            />
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    })
                }
            </div>
        );
    }
}
