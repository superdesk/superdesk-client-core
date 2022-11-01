import * as React from 'react';
import {Dropdown, IconButton, IconLabel} from 'superdesk-ui-framework';
import {IRundown, IRundownItem, IRundownItemBase} from '../../interfaces';

import {superdesk} from '../../superdesk';
import {Map} from 'immutable';
import {RUNDOWN_ITEM_TYPES_VOCABULARY_ID} from '../../constants';
import {IVocabularyItem} from 'superdesk-api';
import {addSeconds, arrayMove} from '@superdesk/common';
import {DurationLabel} from './components/duration-label';
import {PlannedDurationLabel} from './components/planned-duration-label';
import {IMenuGroup, IMenuItem, ISubmenu} from 'superdesk-ui-framework/react/components/Dropdown';
import {noop} from 'lodash';
import {RundownItems} from './components/rundown-items';
const {vocabulary} = superdesk.entities;
const {Spacer, SpacerBlock} = superdesk.components;

const {gettext} = superdesk.localization;

interface IProps<T extends IRundownItemBase | IRundownItem> {
    rundown: IRundown | null;
    items: Array<T>;
    onChange(items: Array<T>): void;
    onDelete(item: T): void;
    initiateCreation(initialData: Partial<IRundownItemBase>): void;
    initiateEditing(item: T): void;
    initiatePreview(item: T): void;
    readOnly: boolean;
    lock?(item: T): void;
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

                <RundownItems
                    readOnly={false}
                    dragAndDrop
                    addItem
                    items={this.props.items}
                    onChange={this.props.onChange}
                    onDelete={this.props.onDelete}
                    getActions={((item) => {
                        const actions: Array<IMenuItem> = [];

                        if (!readOnly) {
                            const edit: IMenuItem = {
                                label: gettext('Edit'),
                                onSelect: () => {
                                    this.props.initiateEditing(item);
                                    if (this.props.lock) {
                                        this.props.lock(item);
                                    }
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
                    })}
                    itemsDropdown={(() => {
                        const result: Array<IMenuItem | ISubmenu | IMenuGroup | 'divider'> =
                            rundownItemTypes.toArray()
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
                    })}
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
