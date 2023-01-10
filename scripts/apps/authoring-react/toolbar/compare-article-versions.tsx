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

        const Panel: React.ComponentType<{
            v1: number,
            v2: number,
            fieldData: Map<string, any>,
            profile: IContentProfileV2,
        }> = ({v1, v2, fieldData, profile}) => {
            const ver = this.props.versions[state.versionsPicked[v2]];

            return (
                <Spacer v gap="16" style={{height: '100%'}} noWrap>
                    <Spacer h gap="8" justifyContent="space-between" alignItems="center" noWrap>
                        <div style={{width: 100}}>
                            <Select
                                value={state.versionsPicked[v1].toString()}
                                label={gettext('Select version')}
                                onChange={(value) =>
                                    this.setState({
                                        ...state,
                                        versionsPicked: [state.versionsPicked[v2], Number(value)],
                                    }, () => this.initializeWithVersions(state.versionsPicked[v2], Number(value)))
                                }
                            >
                                {
                                    this.props.versions.map((ver, i) => {
                                        return (<Option value={i.toString()} key={i}>{ver._current_version}</Option>);
                                    })
                                }
                            </Select>
                        </div>
                        <Spacer v gap="4" justifyContent="center" noGrow>
                            <Spacer h gap="4" noGrow justifyContent="start">
                                <Heading type="h6">{gettext('Author: ')}</Heading>
                                <Heading type="h6" weight="strong">
                                    {
                                        ng.get('desks')
                                            .userLookup[ver.version_creator]
                                            .display_name
                                    }
                                </Heading>
                            </Spacer>
                            <Label text={ver.state} style="hollow" type="warning" />
                        </Spacer>
                    </Spacer>
                    <div style={{flexGrow: 1, background: 'white', width: '100%', height: '100%'}}>
                        <PreviewAuthoringItem
                            fieldsData={fieldData}
                            profile={profile}
                            fieldPadding={ITEM_PADDING}
                        />
                    </div>
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
                <Spacer h gap="8" style={{background: '#E8EAED', padding: 8, height: '100%', alignItems: 'start'}} noWrap>
                    <Panel
                        v1={1}
                        v2={0}
                        fieldData={fieldsData1}
                        profile={profile1}
                    />
                    <Panel
                        v1={0}
                        v2={1}
                        fieldData={fieldsData2}
                        profile={profile2}
                    />
                    <Spacer v gap="16" style={{height: '100%'}} noWrap>
                        <div style={{height: 52}} />
                        <div style={{background: 'white', height: '100%', width: '100%'}}>
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
