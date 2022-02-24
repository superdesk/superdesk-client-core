import React from 'react';
import {Map} from 'immutable';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {IArticle, IContentProfileV2} from 'superdesk-api';
import {showModal} from 'core/services/modalService';
import {authoringStorage} from '../data-layer';
import {getFieldsData} from '../authoring-react';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {Button} from 'superdesk-ui-framework/react';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ViewArticle} from './view-article';
import {ViewDifference} from './view-difference';
import {AUTHORING_FIELD_PREFERENCES} from 'core/constants';
import {preferences} from 'api/preferences';

interface IProps {
    item1: {label: string; article: IArticle};
    item2: {label: string; article: IArticle};
    closeModal(): void;
}

interface IState {
    contentProfiles: Map<string, IContentProfileV2> | null;
    primaryColumnShown: boolean;
    secondaryColumnShown: boolean;
    differenceColumnShown: boolean;
}

const fieldPadding = 8;

export class CompareArticles extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            contentProfiles: null,
            primaryColumnShown: true,
            secondaryColumnShown: false,
            differenceColumnShown: true,
        };
    }

    componentDidMount() {
        Promise.all(
            [
                this.props.item1.article,
                this.props.item2.article,
            ].map((item) => authoringStorage.getContentProfile(item)),
        ).then((res) => {
            this.setState({
                contentProfiles: Map(res.map((profile) => [profile.id, profile])),
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

        if (contentProfiles == null) {
            return null;
        }

        const article1 = this.props.item1.article;
        const article2 = this.props.item2.article;
        const article1Label = this.props.item1.label;
        const article2Label = this.props.item2.label;
        const profile1 = contentProfiles.get(article1.profile);
        const profile2 = contentProfiles.get(article2.profile);
        const allFields1 = profile1.header.merge(profile1.content).toOrderedMap();
        const allFields2 = profile2.header.merge(profile2.content).toOrderedMap();

        const userPreferencesForFields = preferences.get(AUTHORING_FIELD_PREFERENCES);

        const fieldsData1 = getFieldsData(
            article1,
            allFields1,
            userPreferencesForFields,
        );

        const fieldsData2 = getFieldsData(
            article2,
            allFields2,
            userPreferencesForFields,
        );

        const scrollableColumnCss: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            height: '100%',
            overflowY: 'auto',
            background: 'white',
        };

        return (
            <Modal size="full-screen">
                <ModalHeader onClose={() => this.props.closeModal()}>
                    {gettext('Comparing "{{x}}"(primary) to "{{y}}"(secondary)', {x: article1Label, y: article2Label})}
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
                                        <ViewArticle
                                            article={article1}
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
                                        <ViewArticle
                                            article={article2}
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
                                            article1={article1}
                                            article2={article2}
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

export function compareArticles(
    item1: {label: string; article: IArticle},
    item2: {label: string; article: IArticle},
) {
    showModal(({closeModal}) => (
        <CompareArticles
            closeModal={closeModal}
            item1={item1}
            item2={item2}
        />
    ));
}
