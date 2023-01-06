import {gettext} from 'core/utils';
import React from 'react';
import {
    IArticle,
    IAuthoringStorage,
    IBaseRestApiResponse,
    IContentProfileV2,
    IFieldsAdapter,
    IStorageAdapter,
} from 'superdesk-api';
import {getFieldsData} from '../authoring-react';
import {PreviewAuthoringItem} from '../preview-authoring-item';
import {Map} from 'immutable';
import {Heading, Label, Modal, Option, Select} from 'superdesk-ui-framework/react';
import {Spacer} from 'core/ui/components/Spacer';
import {ViewDifference} from '../compare-articles/view-difference';
import ng from 'core/services/ng';

interface IStateLoading {
    initialized: false;
}

interface IStateLoaded {
    initialized: true;
    versionsPicked: [number, number] | null;
    contentProfiles: Map<number, IContentProfileV2>;
}

type IState = IStateLoaded | IStateLoading;

interface IProps {
    getLanguage(entity: IArticle): string;
    authoringStorage: IAuthoringStorage<IArticle>;
    fieldsAdapter: IFieldsAdapter<IArticle>;
    storageAdapter: IStorageAdapter<IArticle>;
    closeModal(): void;
    article: IArticle;
    versions: Array<(IArticle & IBaseRestApiResponse)>;
}

const ITEM_PADDING = 8;

export class CompareArticleVersionsModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
        };

        this.initializeWithVersions = this.initializeWithVersions.bind(this);
    }

    componentDidMount(): void {
        this.initializeWithVersions(0, 1);
    }

    initializeWithVersions(version1: number, version2: number) {
        if (!this.state.initialized) {
            Promise.all([
                this.props.authoringStorage.getContentProfile(this.props.versions[version1], this.props.fieldsAdapter),
                this.props.authoringStorage.getContentProfile(this.props.versions[version2], this.props.fieldsAdapter),
            ]).then((res) => {
                let profilesMap = Map<number, IContentProfileV2>();

                profilesMap = profilesMap.set(version1, res[version1]);
                profilesMap = profilesMap.set(version2, res[version2]);

                this.setState({
                    ...this.state,
                    initialized: true,
                    contentProfiles: profilesMap,
                    versionsPicked: [0, 1],
                });
            });
        }
    }

    render(): React.ReactNode {
        const state = this.state;

        if (!state.initialized) {
            return null;
        }

        const {fieldsAdapter, authoringStorage, storageAdapter} = this.props;
        const entity1 = this.props.versions[state.versionsPicked[0]];
        const entity2 = this.props.versions[state.versionsPicked[1]];
        const profile1 = state.contentProfiles.get(0);
        const profile2 = state.contentProfiles.get(1);
        const allFields1 = profile1?.header.merge(profile1.content).toOrderedMap();
        const allFields2 = profile2?.header.merge(profile2.content).toOrderedMap();
        const fieldsData1 = getFieldsData(
            entity1,
            allFields1,
            fieldsAdapter,
            authoringStorage,
            storageAdapter,
            entity1.language,
        );
        const fieldsData2 = getFieldsData(
            entity2,
            allFields2,
            fieldsAdapter,
            authoringStorage,
            storageAdapter,
            entity1.language,
        );

        const selectVersion = (n: number, n2: number) => {
            return (
                <div style={{width: 100}}>
                    <Select
                        value={state.versionsPicked[n].toString()}
                        label={gettext('Select version')}
                        onChange={(newValue) => {
                            const versionN = Number(newValue);

                            this.setState({
                                ...state,
                                initialized: true,
                                versionsPicked: [state.versionsPicked[n2], versionN],
                            }, () => this.initializeWithVersions(state.versionsPicked[n2], versionN));
                        }}
                    >
                        {
                            this.props.versions.map((version, i) => {
                                return (<Option value={i.toString()} key={i}>{version._current_version}</Option>);
                            })
                        }
                    </Select>
                </div>
            );
        };

        const metaData = (n: number) => {
            return (
                <Spacer h gap="4" justifyContent="start" noGrow>
                    <Heading type="h6">{gettext('Author: ')}</Heading>
                    <Heading type="h6" weight="strong">
                        {
                            ng.get('desks')
                                .userLookup[this.props.versions[state.versionsPicked[n]].version_creator]
                                .display_name
                        }
                    </Heading>
                    <Label text={this.props.versions[state.versionsPicked[n]].state} style="hollow" type="warning" />
                </Spacer>
            );
        };

        return (
            <Modal
                onHide={this.props.closeModal}
                visible
                maximized
                zIndex={1050}
                headerTemplate={gettext('Compare article versions')}
                contentPadding="none"
            >
                <Spacer h gap="8" style={{background: '#E8EAED', padding: 8, height: '100%', alignItems: 'start'}}>
                    <Spacer v gap="16">
                        <Spacer h gap="8" noGrow justifyContent="start" alignItems="center">
                            {selectVersion(0, 1)}
                            {metaData(0)}
                        </Spacer>
                        <div style={{background: 'white'}}>
                            <PreviewAuthoringItem
                                fieldsData={fieldsData1}
                                profile={profile1}
                                fieldPadding={ITEM_PADDING}
                            />
                        </div>
                    </Spacer>
                    <Spacer v gap="16">
                        <Spacer h gap="8" noGrow justifyContent="start" alignItems="center">
                            {selectVersion(1, 0)}
                            {metaData(1)}
                        </Spacer>
                        <div style={{background: 'white', paddingRight: 8}}>
                            <PreviewAuthoringItem
                                fieldsData={fieldsData2}
                                profile={profile2}
                                fieldPadding={ITEM_PADDING}
                            />
                        </div>
                    </Spacer>
                    <Spacer v gap="16">
                        <div style={{height: 48}} />
                        <div style={{background: 'white'}}>
                            <ViewDifference
                                profile1={profile1}
                                profile2={profile2}
                                fieldsData1={fieldsData1}
                                fieldsData2={fieldsData2}
                                fieldPadding={ITEM_PADDING}
                            />
                        </div>
                    </Spacer>
                </Spacer>
            </Modal>
        );
    }
}
