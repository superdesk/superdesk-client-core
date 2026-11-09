import React from 'react';
import {uniq} from 'lodash';
import {IDifferenceComponentProps, IPackageItemsConfig, IPackageItemsValueOperational} from 'superdesk-api';
import {getDifferenceStatistics} from '../difference-statistics';
import {PackageItemCard} from './package-item-card';
import {PackageGroupTitle} from './package-group-title';

type IProps = IDifferenceComponentProps<IPackageItemsValueOperational, IPackageItemsConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const groups1 = this.props.value1 ?? [];
        const groups2 = this.props.value2 ?? [];
        const groupIds = uniq([...groups1, ...groups2].map(({id}) => id));

        return (
            <div>
                {
                    groupIds.map((groupId) => {
                        const group1 = groups1.find(({id}) => id === groupId);
                        const group2 = groups2.find(({id}) => id === groupId);
                        const refs1 = group1?.refs ?? [];
                        const refs2 = group2?.refs ?? [];

                        if (refs1.length < 1 && refs2.length < 1) {
                            return null;
                        }

                        const stats = getDifferenceStatistics(
                            refs1,
                            refs2,
                            (ref) => ref.residRef,
                            (a, b) => a.residRef === b.residRef,
                        );

                        return (
                            <div key={groupId}>
                                <PackageGroupTitle label={(group2 ?? group1).label || groupId} />

                                {
                                    stats.removed.map((ref) => (
                                        <PackageItemCard
                                            key={'removed-' + ref.residRef}
                                            packageItem={ref}
                                            readOnly
                                            backgroundColor="var(--diff-color-removal)"
                                        />
                                    ))
                                }

                                {
                                    refs2.map((ref) => (
                                        <PackageItemCard
                                            key={ref.residRef}
                                            packageItem={ref}
                                            readOnly
                                            backgroundColor={
                                                stats.added.some(({residRef}) => residRef === ref.residRef)
                                                    ? 'var(--diff-color-addition)'
                                                    : undefined
                                            }
                                        />
                                    ))
                                }
                            </div>
                        );
                    })
                }
            </div>
        );
    }
}
