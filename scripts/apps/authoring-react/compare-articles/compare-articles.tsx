import React from 'react';
import {Map} from 'immutable';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {IAuthoringStorage, IContentProfileV2, IFieldsAdapter, IStorageAdapter} from 'superdesk-api';
import {showModal} from 'core/services/modalService';
import {getFieldsData} from '../authoring-react';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {Button} from 'superdesk-ui-framework/react';
import {PreviewAuthoringItem} from '../preview-authoring-item';
import {ViewDifference} from './view-difference';

interface IComparisonData<T> {
    item1: {label: string; entity: T};
    item2: {label: string; entity: T};
    getLanguage(entity: T): string;
    authoringStorage: IAuthoringStorage<T>;
    fieldsAdapter: IFieldsAdapter<T>;
    storageAdapter: IStorageAdapter<T>;
}

interface IProps<T> extends IComparisonData<T> {
    closeModal(): void;
}

interface IState<T> {
    contentProfiles: Map<T, IContentProfileV2> | null;
    primaryColumnShown: boolean;
    secondaryColumnShown: boolean;
    differenceColumnShown: boolean;
}

const fieldPadding = 8;

export class CompareAuthoringEntities<T> extends React.PureComponent<IProps<T>, IState<T>> {
    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            contentProfiles: null,
            primaryColumnShown: true,
            secondaryColumnShown: false,
            differenceColumnShown: true,
        };
    }

    componentDidMount() {
        const {authoringStorage, fieldsAdapter, item1, item2} = this.props;

        Promise.all(
            [
                item1.entity,
                item2.entity,
            ].map((item) => authoringStorage.getContentProfile(item, fieldsAdapter)),
        ).then((res) => {
            let profilesMap = Map<T, IContentProfileV2>();

            profilesMap = profilesMap.set(item1.entity, res[0]);
            profilesMap = profilesMap.set(item2.entity, res[1]);

            this.setState({
                contentProfiles: profilesMap,
            });
        });
    }
    render() {
        const {
            contentProfiles,
            primaryColumnShown,
            secondaryColumnShown,
            differenceColumnShown,
        } = this.state;

        const {item1, item2, getLanguage, fieldsAdapter, authoringStorage, storageAdapter} = this.props;

        if (contentProfiles == null) {
            return null;
        }

        const entity1 = item1.entity;
        const entity2 = item2.entity;
        const entity1Label = item1.label;
        const entity2Label = item2.label;
        const language1 = getLanguage(item1.entity);
        const language2 = getLanguage(item2.entity);
        const profile1 = contentProfiles.get(entity1);
        const profile2 = contentProfiles.get(entity2);
        const allFields1 = profile1.header.merge(profile1.content).toOrderedMap();
        const allFields2 = profile2.header.merge(profile2.content).toOrderedMap();

        const fieldsData1 = getFieldsData(
            entity1,
            allFields1,
            fieldsAdapter,
            authoringStorage,
            storageAdapter,
            language1,
        );

        const fieldsData2 = getFieldsData(
            entity2,
            allFields2,
            fieldsAdapter,
            authoringStorage,
            storageAdapter,
            language2,
        );

        const scrollableColumnCss: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
            overflowY: 'auto',
            background: 'white',
        };

        return (
            <Modal size="full-screen">
                <ModalHeader onClose={() => this.props.closeModal()}>
                    {gettext('Comparing "{{x}}"(primary) to "{{y}}"(secondary)', {x: entity1Label, y: entity2Label})}
                </ModalHeader>

                <ModalBody style={{background: '#e8eaed', padding: '8px'}}>
                    <Spacer v gap="8" alignItems="stretch" noWrap style={{width: '100%', height: '100%'}}>
                        <Spacer h gap="8" justifyContent="start" noGrow>
                            <Button
                                text={gettext('toggle primary')}
                                onClick={() => {
                                    this.setState({primaryColumnShown: !this.state.primaryColumnShown});
                                }}
                                type={primaryColumnShown ? 'primary' : undefined}
                            />

                            <Button
                                text={gettext('toggle secondary')}
                                onClick={() => {
                                    this.setState({secondaryColumnShown: !this.state.secondaryColumnShown});
                                }}
                                type={secondaryColumnShown ? 'primary' : undefined}
                            />

                            <Button
                                text={gettext('toggle difference')}
                                onClick={() => {
                                    this.setState({differenceColumnShown: !this.state.differenceColumnShown});
                                }}
                                type={differenceColumnShown ? 'primary' : undefined}
                            />
                        </Spacer>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '8px',
                                flexGrow: 1,
                                minHeight: 0,
                            }}
                        >
                            {
                                primaryColumnShown && (
                                    <div style={scrollableColumnCss}>
                                        <PreviewAuthoringItem
                                            profile={profile1}
                                            fieldsData={fieldsData1}
                                            fieldPadding={fieldPadding}
                                        />
                                    </div>
                                )
                            }

                            {
                                secondaryColumnShown && (
                                    <div style={scrollableColumnCss}>
                                        <PreviewAuthoringItem
                                            profile={profile2}
                                            fieldsData={fieldsData2}
                                            fieldPadding={fieldPadding}
                                        />
                                    </div>
                                )
                            }

                            {
                                differenceColumnShown && (
                                    <div style={scrollableColumnCss}>
                                        <ViewDifference
                                            profile1={profile1}
                                            profile2={profile2}
                                            fieldsData1={fieldsData1}
                                            fieldsData2={fieldsData2}
                                            fieldPadding={fieldPadding}
                                        />
                                    </div>
                                )
                            }
                        </div>
                    </Spacer>
                </ModalBody>
            </Modal>
        );
    }
}

export function compareAuthoringEntities<T>(comparisonData: IComparisonData<T>) {
    showModal(({closeModal}) => (
        <CompareAuthoringEntities
            {...comparisonData}
            closeModal={closeModal}
        />
    ));
}
