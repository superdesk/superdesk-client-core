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
import {Map} from 'immutable';
import {Modal} from 'superdesk-ui-framework/react';
import {ViewDifference} from '../compare-articles/view-difference';
import {VersionHeader} from './version-header';
import {PreviewAuthoringItem} from '../preview-authoring-item';

const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
};

const columnStyle: React.CSSProperties = {
    width: '33%',
};

const cellStyle: React.CSSProperties = {
    background: 'white',
    width: '100%',
    height: '100%',
    marginRight: 8,
};

interface IStateLoading {
    initialized: false;
}

interface IStateLoaded {
    initialized: true;

    // Ids of versions are not unique so we use indexes to access a version from this.props.versions
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
    }

    componentDidMount(): void {
        Promise.all([
            this.props.authoringStorage.getContentProfile(this.props.versions[0], this.props.fieldsAdapter),
            this.props.authoringStorage.getContentProfile(this.props.versions[1], this.props.fieldsAdapter),
        ]).then((res) => {
            let profilesMap = Map<number, IContentProfileV2>();

            profilesMap = profilesMap.set(0, res[0]);
            profilesMap = profilesMap.set(1, res[1]);

            this.setState({
                ...this.state,
                initialized: true,
                contentProfiles: profilesMap,
                versionsPicked: [0, 1],
            });
        });
    }

    render(): React.ReactNode {
        const state = this.state;

        if (!state.initialized) {
            return null;
        }

        const {fieldsAdapter, authoringStorage, storageAdapter} = this.props;
        const v0 = state.versionsPicked[0];
        const v1 = state.versionsPicked[1];
        const entity1 = this.props.versions[v0];
        const entity2 = this.props.versions[v1];
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

        return (
            <Modal
                onHide={this.props.closeModal}
                visible
                maximized
                zIndex={1050}
                headerTemplate={gettext('Compare article versions')}
                contentPadding="none"
            >
                <table
                    style={{
                        width: '100%',
                        height: '100%',
                        padding: 8,
                        background: '#E8EAED',
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                ...rowStyle,
                                marginRight: 8,
                                paddingBottom: 8,
                            }}
                        >
                            <th style={columnStyle}>
                                <VersionHeader
                                    version={v1}
                                    onVersionChange={(value) => {
                                        this.setState({
                                            ...state,
                                            versionsPicked: [v0, value],
                                        });
                                    }}
                                    versions={this.props.versions}
                                />
                            </th>
                            <th style={columnStyle}>
                                <VersionHeader
                                    version={v0}
                                    onVersionChange={(value) => {
                                        this.setState({
                                            ...state,
                                            versionsPicked: [value, v1],
                                        });
                                    }}
                                    versions={this.props.versions}
                                />
                            </th>
                            <th style={columnStyle} />
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            style={{
                                ...rowStyle,
                                background: '#E8EAED',
                            }}
                        >
                            <td style={cellStyle}>
                                <PreviewAuthoringItem
                                    fieldsData={fieldsData2}
                                    profile={profile2}
                                    fieldPadding={ITEM_PADDING}
                                />
                            </td>
                            <td style={cellStyle}>
                                <PreviewAuthoringItem
                                    fieldsData={fieldsData1}
                                    profile={profile1}
                                    fieldPadding={ITEM_PADDING}
                                />
                            </td>
                            <td style={{background: 'white', height: '100%', width: '100%'}}>
                                <ViewDifference
                                    gapBetweenFields="16"
                                    profile1={profile2}
                                    profile2={profile1}
                                    fieldsData1={fieldsData2}
                                    fieldsData2={fieldsData1}
                                    fieldPadding={ITEM_PADDING}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </Modal>
        );
    }
}
