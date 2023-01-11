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
import {Panel} from './article-panel';

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

        const v1 = state.versionsPicked[1];
        const v2 = state.versionsPicked[0];

        return (
            <Modal
                onHide={this.props.closeModal}
                visible
                maximized
                zIndex={1050}
                headerTemplate={gettext('Compare article versions')}
                contentPadding="none"
            >
                <Spacer
                    h
                    gap="8"
                    style={{
                        background: '#E8EAED',
                        padding: 8,
                        height: '100%',
                        alignItems: 'start',
                    }}
                    noWrap
                >
                    <Panel
                        displayVersion={v1.toString()}
                        onChange={(value) => {
                            this.setState({
                                ...state,
                                versionsPicked: [v2, value],
                            }, () => this.initializeWithVersions(v2, value));
                        }}
                        currentVersion={this.props.versions[v2]}
                        fieldsData={fieldsData1}
                        profile={profile1}
                        versions={this.props.versions}
                    />
                    <Panel
                        displayVersion={v2.toString()}
                        onChange={(value) => {
                            this.setState({
                                ...state,
                                versionsPicked: [v1, value],
                            }, () => this.initializeWithVersions(v1, value));
                        }}
                        currentVersion={this.props.versions[v1]}
                        fieldsData={fieldsData2}
                        profile={profile2}
                        versions={this.props.versions}
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
