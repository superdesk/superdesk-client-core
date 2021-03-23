// External modules
import * as React from 'react';
import {connect} from 'react-redux';
import {OrderedMap} from 'immutable';
import {noop} from 'lodash';

// Types
import {ASSET_STATE, IAssetItem, ISetItem, IAssetTag, IAutoTaggingSearchResult} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi, samsApi} from '../../apis';

// Redux Actions & Selectors
import {getActiveSets} from '../../store/sets/selectors';

// UI
import {FormLabel, Input, Option, Select, Autocomplete} from 'superdesk-ui-framework/react';
import {FormGroup, FormRow} from '../../ui';

// Utils
import {getHumanReadableFileSize} from '../../utils/ui';

interface IProps {
    asset: Partial<IAssetItem>;
    disabled?: boolean;
    onChange(field: string, value: string): void;
    sets: Array<ISetItem>;
    fields?: Array<keyof IAssetItem>;
    updates?: Partial<IAssetItem>;
}

const mapStateToProps = (state: IApplicationState) => ({
    sets: getActiveSets(state),
});

export function toClientFormat(response: IAutoTaggingSearchResult): OrderedMap<string, IAssetTag> {
    let tags = OrderedMap<string, IAssetTag>();

    response.tags.forEach((item: string) => {
        const tag: IAssetTag = {
            name: item,
            code: item,
        };

        tags = tags.set(tag.name!, tag);
        tags = tags.set(tag.code!, tag);
    });
    return tags;
}

class AssetEditorComponent extends React.PureComponent<IProps> {
    onChange: Dictionary<string, (value: string) => void>;

    constructor(props: IProps) {
        super(props);

        this.onChange = {
            name: (value: string) => this.props.onChange('name', value.trim()),
            description: (value: string) => this.props.onChange('description', value.trim()),
            filename: (value: string) => this.props.onChange('filename', value.trim()),
            state: (value: string) => this.props.onChange('state', value),
            set_id: (value: string) => this.props.onChange('set_id', value),
            tags: (value: string) => this.props.onChange('tags', value),
        };
    }

    fieldEnabled(field: keyof IAssetItem) {
        return (this.props.fields == null || this.props.fields.includes(field)) ?
            true :
            null;
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <React.Fragment>
                <FormGroup>
                    <FormRow>
                        <FormLabel text={gettext('Filename:')} />
                        <span>{this.props.asset.filename}</span>
                    </FormRow>
                </FormGroup>
                <FormGroup>
                    <FormRow>
                        <FormLabel text={gettext('Type:')} />
                        <span>{this.props.asset.mimetype}</span>
                    </FormRow>
                    <FormRow>
                        <FormLabel text={gettext('Size:')} />
                        <span>
                            {this.props.asset.length && getHumanReadableFileSize(this.props.asset.length)}
                        </span>
                    </FormRow>
                </FormGroup>

                {this.fieldEnabled('name') && (
                    <FormGroup>
                        <FormRow>
                            <Input
                                label={gettext('Name')}
                                required={true}
                                value={this.props.asset.name}
                                onChange={this.onChange.name}
                                disabled={this.props.disabled === true}
                            />
                        </FormRow>
                    </FormGroup>
                )}
                {this.fieldEnabled('description') && (
                    <FormGroup>
                        <FormRow>
                            <Input
                                label={gettext('Description')}
                                value={this.props.asset.description}
                                onChange={this.onChange.description}
                                disabled={this.props.disabled === true}
                            />
                        </FormRow>
                    </FormGroup>
                )}
                {this.fieldEnabled('state') && (
                    <FormGroup>
                        <FormRow>
                            <Select
                                label={gettext('State')}
                                value={this.props.asset.state}
                                required={true}
                                onChange={this.onChange.state}
                                disabled={this.props.disabled === true}
                            >
                                <Option value={ASSET_STATE.DRAFT}>
                                    {gettext('Draft')}
                                </Option>
                                <Option value={ASSET_STATE.INTERNAL}>
                                    {gettext('Internal')}
                                </Option>
                                <Option value={ASSET_STATE.PUBLIC}>
                                    {gettext('Public')}
                                </Option>
                            </Select>
                        </FormRow>
                    </FormGroup>
                )}
                {this.fieldEnabled('set_id') && (
                    <FormGroup>
                        <FormRow>
                            <Select
                                label={gettext('Set')}
                                value={this.props.asset.set_id}
                                required={true}
                                onChange={this.onChange.set_id}
                                disabled={this.props.disabled === true}
                            >
                                {this.props.sets.map((set) => (
                                    <Option key={set._id} value={set._id}>
                                        {set.name}
                                    </Option>
                                ))}
                            </Select>
                        </FormRow>
                    </FormGroup>
                )}
                {this.fieldEnabled('tags') && (
                    <FormGroup>
                        <FormRow>
                            <Autocomplete
                                key={(this.props.updates?.tags || []).length}
                                label={gettext('Tags')}
                                value={''}
                                keyValue="name"
                                items={[]}
                                search={(searchString, callback) => {
                                    let cancelled = false;

                                    samsApi.assets.searchTags(searchString + '*')
                                        .then((res: IAutoTaggingSearchResult) => {
                                            if (cancelled !== true) {
                                                const result = toClientFormat(res).toArray();

                                                callback(result);
                                            }
                                        });

                                    return {
                                        cancel: () => {
                                            cancelled = true;
                                        },
                                    };
                                }}
                                onSelect={this.onChange.tags}
                                onChange={noop}
                            />
                        </FormRow>
                    </FormGroup>
                )}

            </React.Fragment>
        );
    }
}

export const AssetEditor = connect(mapStateToProps)(AssetEditorComponent);
