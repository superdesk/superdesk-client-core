import {SpacerInlineFlex} from 'core/ui/components/Spacer';
import {groupBy, keyBy} from 'lodash';
import React from 'react';

interface IProps<T> {
    items1: Array<T>;
    items2: Array<T>;
    getId(item: T): string;
    template: React.ComponentType<{item: T}>;
}

type IChangeType = 'removal' | 'addition' | 'order-change';

interface IChange<T> {
    type: IChangeType;
    id: string;
    item: T;
}

export class DifferenceGeneric<T> extends React.PureComponent<IProps<T>> {
    render() {
        const {items1, items2, getId} = this.props;
        const Template = this.props.template;

        const items1Lookup = keyBy(items1, getId);
        const items2Lookup = keyBy(items2, getId);

        const result: Array<IChange<T>> = [];

        for (const item of items2) {
            const id = getId(item);

            if (id in items1Lookup !== true) {
                result.push({
                    id: id,
                    item: item,
                    type: 'addition',
                });
            }
        }

        for (const item of items1) {
            const id = getId(item);

            if (items2Lookup.hasOwnProperty(id) !== true) {
                result.push({
                    id: id,
                    item: item,
                    type: 'removal',
                });
            }
        }

        const resultLookup = groupBy(result, ({type}) => type);

        const changedItemIds = new Set(result.map(({id}) => id));
        const unChangedItems = items2.filter((item) => {
            const id = getId(item);

            return changedItemIds.has(id) !== true;
        });

        const removed = resultLookup['removal'] ?? [];
        const added = resultLookup['addition'] ?? [];

        return (
            <SpacerInlineFlex h gap="8" gapSecondary="8">
                {
                    removed.length > 0 && (
                        <React.Fragment>
                            {
                                removed.map((change, i) => (
                                    <span key={i} style={{paddingBottom: 4, borderBottom: '2px solid red'}}>
                                        <span style={{opacity: 0.3, textDecoration: 'line-through'}}>
                                            <Template item={change.item} />
                                        </span>
                                    </span>
                                ))
                            }
                        </React.Fragment>
                    )
                }

                {
                    unChangedItems.length > 0 && (
                        <React.Fragment>
                            {
                                unChangedItems.map((item, i) => (
                                    <span key={i}>
                                        <Template item={item} />
                                    </span>
                                ))
                            }
                        </React.Fragment>
                    )
                }

                {
                    added.length > 0 && (
                        <React.Fragment>
                            {
                                added.map((change, i) => (
                                    <span key={i} style={{paddingBottom: 4, borderBottom: '2px solid green'}}>
                                        <Template item={change.item} />
                                    </span>
                                ))
                            }
                        </React.Fragment>
                    )
                }
            </SpacerInlineFlex>
        );
    }
}
