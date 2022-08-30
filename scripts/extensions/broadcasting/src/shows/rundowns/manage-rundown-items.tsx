import * as React from 'react';
import {Button, IconLabel, Label} from 'superdesk-ui-framework/react';
import {IRundown, IRundownItem, IRundownItemBase} from '../../interfaces';

import {superdesk} from '../../superdesk';
import {Map} from 'immutable';
import {RUNDOWN_ITEM_TYPES_VOCABULARY_ID, SHOW_PART_VOCABULARY_ID} from '../../constants';
import {IVocabularyItem} from 'superdesk-api';
import {addSeconds, arrayMove, WithSortable} from '@superdesk/common';
import {ICreate, IEdit} from './template-edit';
import {DurationLabel} from './components/duration-label';
import {PlannedDurationLabel} from './components/planned-duration-label';
const {vocabulary} = superdesk.entities;
const {Spacer, SpacerBlock} = superdesk.components;

const {gettext} = superdesk.localization;

interface IProps<T> {
    rundown: IRundown | null;
    items: Array<T>;
    onChange(items: Array<T>): void;
    onDelete(item: T): void;
    createOrEdit: ICreate | IEdit | null;
    initiateCreation(): void;
    initiateEditing(item: T): void;
    readOnly: boolean;
}

export class ManageRundownItems<T extends IRundownItemBase | IRundownItem> extends React.PureComponent<IProps<T>> {
    constructor(props: IProps<T>) {
        super(props);

        this.reorder = this.reorder.bind(this);
    }

    private reorder(from: number, to: number) {
        this.props.onChange(arrayMove(this.props.items, from, to));
    }

    render() {
        const {readOnly, rundown} = this.props;

        const showParts = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(SHOW_PART_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        const rundownItemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_ITEM_TYPES_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        return (
            <div>
                {
                    (() => {
                        if (rundown == null) {
                            return null;
                        }

                        const airTimeEnd = addSeconds(
                            rundown.airtime_time,
                            rundown.duration ?? rundown.planned_duration,
                        );

                        return (
                            <div>
                                <Spacer h gap="4" justifyContent="start" noGrow>
                                    <IconLabel
                                        type="primary"
                                        text={`${rundown.airtime_time} - ${airTimeEnd}`}
                                        innerLabel={gettext('Airtime')}
                                        style="translucent"
                                    />

                                    <DurationLabel
                                        duration={rundown.duration}
                                        planned_duration={rundown.planned_duration}
                                    />

                                    <PlannedDurationLabel planned_duration={rundown.planned_duration} />
                                </Spacer>

                                <SpacerBlock v gap="16" />
                            </div>
                        );
                    })()
                }

                <WithSortable
                    items={this.props.items}
                    itemTemplate={({item}) => {
                        const showPart = item.show_part == null ? null : showParts.get(item.show_part);
                        const itemType = item.item_type == null ? null : rundownItemTypes.get(item.item_type);

                        return (
                            <div style={{padding: 4, margin: 4, border: '1px solid blue'}}>
                                {item.title}

                                {
                                    showPart != null && (
                                        <Label
                                            text={showPart.name}
                                            color={showPart.color}
                                        />
                                    )
                                }

                                {
                                    itemType != null && (
                                        <Label
                                            text={itemType.name}
                                            color={itemType.color}
                                        />
                                    )
                                }

                                {
                                    // TODO: show 3 letter show symbol
                                }

                                {
                                    item.planned_duration != null && (
                                        <PlannedDurationLabel planned_duration={item.planned_duration} size="small" />
                                    )
                                }

                                {
                                    item.duration != null && (
                                        <DurationLabel
                                            duration={item.duration}
                                            planned_duration={item.planned_duration}
                                        />
                                    )
                                }

                                {
                                    !readOnly && (
                                        <span onClick={() => this.props.initiateEditing(item)}>{gettext('Edit')}</span>
                                    )
                                }

                                {
                                    !readOnly && (
                                        <span onClick={() => this.props.onDelete(item)}>{gettext('Delete')}</span>
                                    )
                                }
                            </div>
                        );
                    }}
                    getId={(item) => item.title}
                    options={{
                        shouldCancelStart: () => readOnly,
                        onSortEnd: ({oldIndex, newIndex}) => {
                            if (this.props.readOnly !== true) {
                                this.props.onChange(
                                    arrayMove(this.props.items, oldIndex, newIndex),
                                );
                            }
                        },
                        distance: 10,
                        helperClass: 'dragging-in-progress',
                    }}
                />

                {
                    !readOnly && (
                        <div>
                            <Button
                                type="primary"
                                size="small"
                                icon="plus-large"
                                text={gettext('New rundown item template')}
                                shape="round"
                                iconOnly={true}
                                disabled={this.props.createOrEdit != null}
                                onClick={() => {
                                    this.props.initiateCreation();
                                }}
                            />
                        </div>
                    )
                }
            </div>
        );
    }
}
