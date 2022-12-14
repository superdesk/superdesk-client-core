import * as React from 'react';
import {TableList, Label} from 'superdesk-ui-framework/react';
import {IRundownItem, IRundownItemBase} from '../../interfaces';
import {DurationLabel} from './duration-label';
import {Map} from 'immutable';
import {PlannedDurationLabel} from './planned-duration-label';
import {superdesk} from '../../superdesk';
import {IVocabularyItem} from 'superdesk-api';
import {
    SHOW_PART_VOCABULARY_ID,
    RUNDOWN_ITEM_TYPES_VOCABULARY_ID,
    RUNDOWN_SUBITEM_TYPES,
    STATUS_VOCABULARY_ID,
} from '../../constants';
import {IMenuItem, ISubmenu, IMenuGroup} from 'superdesk-ui-framework/react/components/Dropdown';
const {vocabulary} = superdesk.entities;
const {gettext} = superdesk.localization;
const {Spacer} = superdesk.components;

/**
 * Simpler interface - allows to pass fewer props
 */
interface IPropsReadOnly<T extends IRundownItem | IRundownItemBase> {
    readOnly: 'yes';
    items: Array<T>;
    getActions(item: T): JSX.Element;
    preview(item: T): void;
}

interface IPropsEditable<T extends IRundownItem | IRundownItemBase> {
    readOnly: boolean;
    items: Array<T>;
    onChange(items: Array<T>): void;
    onDelete(item: T): void;
    onDrag(start: number, end: number): void;
    dragAndDrop: boolean;
    addItem: boolean;
    itemsDropdown: (index?: number) => Array<IMenuItem | ISubmenu | IMenuGroup | 'divider'>;
    getActions(item: T): JSX.Element | undefined;
    preview(item: T): void;
    edit(item: T): void;
}

type IProps<T extends IRundownItem | IRundownItemBase> = IPropsReadOnly<T> | IPropsEditable<T>;

function isRundownItem(x: IRundownItem | Partial<IRundownItemBase>): x is IRundownItem {
    return (x as unknown as any)['_id'] != null;
}

export class RundownItems<T extends IRundownItem | IRundownItemBase> extends React.PureComponent<IProps<T>> {
    render() {
        const showParts = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(SHOW_PART_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        const statuses = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(STATUS_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        const rundownItemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_ITEM_TYPES_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        const subitemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_SUBITEM_TYPES).items.map((item) => [item.qcode, item]),
        );

        const array: React.ComponentProps<typeof TableList>['array'] = this.props.items.map((item) => {
            const statusColor = item.status == null ? undefined : statuses.get(item.status)?.color ?? undefined;
            const showPart = item.show_part == null ? null : showParts.get(item.show_part);
            const itemType = item.item_type == null ? null : rundownItemTypes.get(item.item_type);
            const subitemVocabularies = item.subitems == null
                ? null
                : item.subitems
                    .map(({qcode}) => subitemTypes.get(qcode))
                    .filter((x) => x != null);

            return ({
                locked: isRundownItem(item) ? item._lock : false,
                hexColor: statusColor,
                start: (
                    <Spacer h gap="4" justifyContent="start" noGrow>
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
                            showPart != null && (
                                <Label
                                    text={showPart.name}
                                    hexColor={showPart.color}
                                    size="normal"
                                />
                            )
                        }

                        {
                        // TODO: show 3 letter show symbol
                        }
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
                            subitemVocabularies != null && (
                                <Spacer h gap="4" justifyContent="start" noGrow>
                                    {
                                        subitemVocabularies.map(({name, color}, i) => (
                                            <Label
                                                key={i}
                                                text={name}
                                                hexColor={color}
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
                                    label={gettext('Planned')}
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
                onClick: () => {
                    this.props.preview(item);
                },
                onDoubleClick: () => {
                    if (!this.props.readOnly) {
                        this.props.edit(item);
                    }
                },
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
                    append={true}
                />
            );
        }
    }
}