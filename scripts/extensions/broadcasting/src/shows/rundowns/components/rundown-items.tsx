import * as React from 'react';
import {TableList, Label} from 'superdesk-ui-framework/react';
import {IRundownItem, IRundownItemBase} from '../../../interfaces';
import {DurationLabel} from './duration-label';
import {Map} from 'immutable';
import {PlannedDurationLabel} from './planned-duration-label';
import {superdesk} from '../../../superdesk';
import {IVocabularyItem} from 'superdesk-api';
import {SHOW_PART_VOCABULARY_ID, RUNDOWN_ITEM_TYPES_VOCABULARY_ID, RUNDOWN_SUBITEM_TYPES} from '../../../constants';
import {IMenuItem, ISubmenu, IMenuGroup} from 'superdesk-ui-framework/react/components/Dropdown';
const {vocabulary} = superdesk.entities;
const {Spacer} = superdesk.components;

interface IPropsReadOnly<T extends IRundownItem | IRundownItemBase> {
    readOnly: true;
    items: Array<T>;
    getActions(item: T): JSX.Element;
}

interface IPropsEditable<T extends IRundownItem | IRundownItemBase> {
    readOnly: false;
    items: Array<T>;
    onChange(items: Array<T>): void;
    onDelete(item: T): void;
    onDrag(start: number, end: number): void;
    dragAndDrop: boolean;
    addItem: boolean;
    itemsDropdown: Array<IMenuItem | ISubmenu | IMenuGroup | 'divider'>;
    getActions(item: T): JSX.Element;
}

type IProps<T extends IRundownItem | IRundownItemBase> = IPropsReadOnly<T> | IPropsEditable<T>;

export class RundownItems<T extends IRundownItem | IRundownItemBase> extends React.PureComponent<IProps<T>> {
    render() {
        const showParts = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(SHOW_PART_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        const rundownItemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_ITEM_TYPES_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        const subitemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_SUBITEM_TYPES).items.map((item) => [item.qcode, item]),
        );

        const array = this.props.items.map((item) => {
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
                                        subitems.map(({name}, i) => (
                                            <Label
                                                key={i}
                                                text={name}
                                                style="translucent"
                                                size="normal"
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
                action: this.props.getActions(item),
            });
        });

        if (this.props.readOnly) {
            return (
                <TableList
                    array={array}
                />
            );
        } else {
            return (
                <TableList
                    dragAndDrop={this.props.dragAndDrop}
                    addItem={this.props.addItem}
                    array={array}
                    itemsDropdown={this.props.itemsDropdown}
                    onDrag={this.props.onDrag}
                />
            );
        }
    }
}
