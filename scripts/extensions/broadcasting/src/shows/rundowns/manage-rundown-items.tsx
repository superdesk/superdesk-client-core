import * as React from 'react';
import {Dropdown, IconButton, IconLabel, Label, TableList} from 'superdesk-ui-framework/react';
import {IRundown, IRundownItem, IRundownItemBase} from '../../interfaces';

import {superdesk} from '../../superdesk';
import {Map} from 'immutable';
import {RUNDOWN_ITEM_TYPES_VOCABULARY_ID, RUNDOWN_SUBITEM_TYPES, SHOW_PART_VOCABULARY_ID} from '../../constants';
import {IVocabularyItem} from 'superdesk-api';
import {addSeconds, arrayMove} from '@superdesk/common';
import {ICreate, IEdit, IPreview} from './template-edit';
import {DurationLabel} from './components/duration-label';
import {PlannedDurationLabel} from './components/planned-duration-label';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Dropdown';
import {noop} from 'lodash';
const {vocabulary} = superdesk.entities;
const {Spacer, SpacerBlock} = superdesk.components;

const {gettext} = superdesk.localization;

interface IProps<T> {
    rundown: IRundown | null;
    items: Array<T>;
    onChange(items: Array<T>): void;
    onDelete(item: T): void;
    createOrEdit: ICreate | IEdit | IPreview | null;
    initiateCreation(initialData: Partial<IRundownItemBase>): void;
    initiateEditing(item: T): void;
    initiatePreview(item: T): void;
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

        const subitemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_SUBITEM_TYPES).items.map((item) => [item.qcode, item]),
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

                <TableList
                    dragAndDrop
                    addItem
                    array={this.props.items.map((item) => {
                        const showPart = item.show_part == null ? null : showParts.get(item.show_part);
                        const itemType = item.item_type == null ? null : rundownItemTypes.get(item.item_type);
                        const subitems = item.subitems == null
                            ? null
                            : item.subitems
                                .map((qcode) => subitemTypes.get(qcode))
                                .filter((x) => x != null);

                        return ({
                            start: (
                                <Spacer h gap="4" justifyContent="start" noGrow>
                                    {
                                        showPart != null && (
                                            <Label
                                                text={showPart.name}
                                                hexColor={showPart.color}
                                                size="normal"
                                            />
                                        )
                                    }

                                    {
                                        itemType != null && (
                                            <Label
                                                text={itemType.name}
                                                hexColor={itemType.color}
                                                size="normal"
                                            />
                                        )
                                    }

                                    {
                                        // TODO: show 3 letter show symbol
                                    }

                                    {item.additional_notes}
                                </Spacer>
                            ),
                            center: (
                                <span>
                                    {item.title}
                                </span>
                            ),
                            end: (
                                <Spacer h gap="4" justifyContent="start" noGrow>
                                    {
                                        subitems != null && (
                                            <Spacer h gap="4" justifyContent="start" noGrow>
                                                {
                                                    subitems.map(({name, color}, i) => (
                                                        <Label
                                                            key={i}
                                                            text={name}
                                                            style="translucent"
                                                            size="normal"
                                                            hexColor={color}
                                                        />
                                                    ))
                                                }
                                            </Spacer>
                                        )
                                    }

                                    {
                                        item.planned_duration != null && (
                                            <PlannedDurationLabel
                                                planned_duration={item.planned_duration}
                                                size="default"
                                            />
                                        )
                                    }

                                    {
                                        item.duration != null && (
                                            <DurationLabel
                                                duration={item.duration}
                                                planned_duration={item.planned_duration}
                                                size="default"
                                            />
                                        )
                                    }
                                </Spacer>
                            ),
                            action: (() => {
                                const actions: Array<IMenuItem> = [];

                                if (!readOnly) {
                                    const edit: IMenuItem = {
                                        label: gettext('Edit'),
                                        onSelect: () => {
                                            this.props.initiateEditing(item);
                                        },
                                    };

                                    actions.push(edit);
                                }

                                const preview: IMenuItem = {
                                    label: gettext('Preview'),
                                    onSelect: () => {
                                        this.props.initiatePreview(item);
                                    },
                                };

                                actions.push(preview);

                                const deleteAction: IMenuItem = {
                                    label: gettext('Delete'),
                                    onSelect: () => {
                                        this.props.onDelete(item);
                                    },
                                };

                                actions.push(deleteAction);

                                return (
                                    <Dropdown items={actions} append>
                                        <IconButton
                                            ariaValue={gettext('Actions')}
                                            icon="dots-vertical"
                                            onClick={noop}
                                        />
                                    </Dropdown>
                                );
                            })(),
                        });
                    })}
                    itemsDropdown={(() => {
                        type IDropdownItems = React.ComponentProps<typeof TableList>['itemsDropdown'];

                        const result: IDropdownItems = rundownItemTypes.toArray()
                            .map((rundownType) => ({
                                label: rundownType.name,
                                onSelect: () => {
                                    this.props.initiateCreation({
                                        item_type: rundownType.qcode,
                                    });
                                },
                            }));

                        if (rundownItemTypes.size > 0) {
                            result.push('divider');
                        }

                        result.push({
                            label: gettext('(empty)'),
                            onSelect: () => {
                                this.props.initiateCreation({});
                            },
                        });

                        return result;
                    })()}
                    onDrag={(oldIndex, newIndex) => {
                        if (this.props.readOnly !== true) {
                            this.props.onChange(
                                arrayMove(this.props.items, oldIndex, newIndex),
                            );
                        }
                    }}
                />
            </div>
        );
    }
}
