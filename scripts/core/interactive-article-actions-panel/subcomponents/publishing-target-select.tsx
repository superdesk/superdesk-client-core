import React from 'react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {ToggleBox, FormLabel, TreeSelect} from 'superdesk-ui-framework/react';
import {ControlledVocabulariesSelect} from './controlled-vocabulary-select';
import {IArticle} from 'superdesk-api';

export type IPublishingTarget = Pick<IArticle, 'target_subscribers' | 'target_regions' | 'target_types'>;

interface IRegion {
    qcode: string;
    name: string;
}

interface ISubscriberType {
    name: string;
    qcode: string;
    formats: Array<{name: string; qcode: string}>;
}

/**
 * Avoids generating patches for insignificant changes like undefined/null to empty array.
 */
export function getPublishingTargetPatch(item: IArticle, publishingTarget: IPublishingTarget) {
    const patch: Partial<IArticle> = {};

    function nullableArrayChanged(arr1: Array<unknown> | null | undefined, arr2: Array<unknown> | null | undefined) {
        if ((arr1 ?? []).length === 0 && (arr2 ?? []).length === 0) {
            return false;
        } else {
            return true;
        }
    }

    if (
        nullableArrayChanged(item.target_subscribers, publishingTarget.target_subscribers)
    ) {
        patch.target_subscribers = publishingTarget.target_subscribers;
    }

    if (
        nullableArrayChanged(item.target_regions, publishingTarget.target_regions)
    ) {
        patch.target_regions = publishingTarget.target_regions;
    }

    if (
        nullableArrayChanged(item.target_types, publishingTarget.target_types)
    ) {
        patch.target_types = publishingTarget.target_types;
    }

    return patch;
}

interface IProps {
    value: IPublishingTarget;
    onChange(value: IPublishingTarget): void;
}

interface IState {
    loading: boolean;
    subscribers: Array<{_id: string; name: string}>;
    regions: Array<IRegion>;
    subscriberTypes: Array<ISubscriberType>;
}

export class PublishingTargetSelect extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
            regions: [],
            subscribers: [],
            subscriberTypes: [],
        };

        this.setMetadataValues = this.setMetadataValues.bind(this);
    }

    setMetadataValues(metadataService: any) {
        this.setState({
            loading: false,
            subscribers: metadataService.values.customSubscribers ?? [],
            regions: metadataService.values.geographical_restrictions ?? [],
            subscriberTypes: metadataService.values.subscriberTypes ?? [],
        });
    }

    componentDidMount(): void {
        const metadataService = ng.get('metadata');

        if (metadataService.values.customSubscribers != null) {
            this.setMetadataValues(metadataService);
        } else {
            metadataService.fetchSubscribers().then(() => {
                this.setMetadataValues(metadataService);
            });
        }
    }

    render() {
        return this.state.loading === false && (
            <ToggleBox title={gettext('Target')} initiallyOpen>
                <FormLabel text={gettext('Target subscribers')} />

                <div style={{paddingTop: 5}}>
                    <TreeSelect
                        zIndex={2000}
                        label=""
                        inlineLabel
                        labelHidden
                        kind="synchronous"
                        allowMultiple
                        getId={(item) => item._id}
                        getLabel={(item) => item.name}
                        getOptions={() => this.state.subscribers.map((x) => ({value: x}))}
                        value={this.props.value.target_subscribers}
                        onChange={(val) => {
                            this.props.onChange({
                                ...this.props.value,
                                target_subscribers: this.state.subscribers
                                    .filter(({_id}) => val.map((sub) => sub._id).includes(_id)),
                            });
                        }}
                    />
                </div>

                <div style={{paddingTop: 20}}>
                    <FormLabel text={gettext('Target regions')} />
                </div>

                <div style={{paddingTop: 5}}>
                    <ControlledVocabulariesSelect
                        zIndex={2000}
                        vocabularies={this.state.regions}
                        value={this.props.value.target_regions ?? []}
                        onChange={(val) => {
                            this.props.onChange({
                                ...this.props.value,
                                target_regions: val,
                            });
                        }}
                    />
                </div>

                <div style={{paddingTop: 20}}>
                    <FormLabel text={gettext('Target types')} />
                </div>

                <div style={{paddingTop: 5}}>
                    <ControlledVocabulariesSelect
                        zIndex={2000}
                        vocabularies={this.state.subscriberTypes}
                        value={this.props.value.target_types ?? []}
                        onChange={(val) => {
                            this.props.onChange({
                                ...this.props.value,
                                target_types: val,
                            });
                        }}
                    />
                </div>

            </ToggleBox>
        );
    }
}
