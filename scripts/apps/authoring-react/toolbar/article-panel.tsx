import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle, IBaseRestApiResponse, IContentProfileV2} from 'superdesk-api';
import {Heading, Label, Select, Option} from 'superdesk-ui-framework/react';
import {PreviewAuthoringItem} from '../preview-authoring-item';
import ng from 'core/services/ng';
import {Map} from 'immutable';

interface IProps {
    onChange(value: number): void;
    fieldsData: Map<string, any>;
    profile: IContentProfileV2;
    currentVersion: (IArticle & IBaseRestApiResponse);
    displayVersion: string;
    versions: Array<(IArticle & IBaseRestApiResponse)>;
}

const ITEM_PADDING = 8;

export class Panel extends React.PureComponent<IProps> {
    render(): React.ReactNode {
        const {
            fieldsData,
            profile,
            currentVersion,
            onChange,
            versions,
            displayVersion,
        } = this.props;

        return (
            <Spacer v gap="16" style={{height: '100%'}} noWrap>
                <Spacer h gap="8" justifyContent="space-between" alignItems="center" noWrap>
                    <div style={{width: 100}}>
                        <Select
                            value={displayVersion}
                            label={gettext('Select version')}
                            onChange={(value) => onChange(Number(value))}
                        >
                            {
                                versions.map((ver, i) => {
                                    return (
                                        <Option value={i.toString()} key={i}>{ver._current_version}</Option>
                                    );
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
                                        .userLookup[currentVersion.version_creator]
                                        .display_name
                                }
                            </Heading>
                        </Spacer>
                        <Label text={currentVersion.state} style="hollow" type="warning" />
                    </Spacer>
                </Spacer>
                <div style={{flexGrow: 1, background: 'white', width: '100%', height: '100%'}}>
                    <PreviewAuthoringItem
                        fieldsData={fieldsData}
                        profile={profile}
                        fieldPadding={ITEM_PADDING}
                    />
                </div>
            </Spacer>
        );
    }
}
