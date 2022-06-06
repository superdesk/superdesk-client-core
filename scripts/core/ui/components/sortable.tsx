/* eslint-disable react/no-multi-comp */
import React from 'react';
import {SortableContainer, SortableContainerProps, SortableElement} from 'react-sortable-hoc';

interface IPropsSortableItem<T> {
    item: T;
    itemTemplate: React.ComponentType<{item: T}>;
}

interface IPropsSortableContainer<T> {
    items: Array<T>;
}

interface IProps<T> {
    items: Array<T>;
    itemTemplate: React.ComponentType<{item: T}>;
    getId(item: T): string;
    options?: SortableContainerProps;
}

export class Sortable<T> extends React.PureComponent<IProps<T>> {
    private SortableList: React.ComponentType<IPropsSortableContainer<T> & SortableContainerProps>;

    constructor(props: IProps<T>) {
        super(props);

        const SortableItem = SortableElement(
            class SortableItemComponent extends React.PureComponent<IPropsSortableItem<T>> {
                render() {
                    const Template = this.props.itemTemplate;

                    return (
                        <Template item={this.props.item} />
                    );
                }
            },
        );

        this.SortableList = SortableContainer(
            class SortableListComponent extends React.PureComponent<IPropsSortableContainer<T>> {
                render() {
                    const {items} = this.props;

                    return (
                        <div>
                            {
                                items.map((item, i) => (
                                    <SortableItem
                                        key={props.getId(item)}
                                        index={i}
                                        item={item}
                                        itemTemplate={props.itemTemplate}
                                    />
                                ))
                            }
                        </div>
                    );
                }
            },
        );
    }

    render() {
        const {SortableList} = this;

        return (
            <SortableList items={this.props.items} {...this.props.options} />
        );
    }
}
