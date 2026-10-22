import React from 'react';
import {IPreviewComponentProps, IPackageItemsConfig, IPackageItemsValueOperational} from 'superdesk-api';
import {PackageItemCard} from './package-item-card';
import {PackageGroupTitle} from './package-group-title';

type IProps = IPreviewComponentProps<IPackageItemsValueOperational, IPackageItemsConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        const groups = (this.props.value ?? []).filter((group) => group.refs.length > 0);

        if (groups.length < 1) {
            return null;
        }

        return (
            <div>
                {
                    groups.map((group) => (
                        <div key={group.id} data-test-id="package-group" data-test-value={group.id}>
                            <PackageGroupTitle label={group.label || group.id} />

                            {
                                group.refs.map((ref) => (
                                    <PackageItemCard key={ref.residRef} packageItem={ref} readOnly />
                                ))
                            }
                        </div>
                    ))
                }
            </div>
        );
    }
}
