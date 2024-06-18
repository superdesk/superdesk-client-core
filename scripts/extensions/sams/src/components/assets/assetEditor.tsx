// External modules
import * as React from 'react';
import {connect} from 'react-redux';
import {noop, cloneDeep} from 'lodash';

// Types
import {ASSET_STATE, IAssetItem, ISetItem, IAssetTag, IAutoTaggingSearchResult} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi, samsApi} from '../../apis';

// Redux Actions & Selectors
import {getActiveSets} from '../../store/sets/selectors';

// UI
import {FormLabel, Input, Option, Select, Autocomplete, Tag, Label} from 'superdesk-ui-framework/react';
import {FormGroup, FormRow} from '../../ui';

// Utils
import {getHumanReadableFileSize} from '../../utils/ui';
import {convertTagSearchResultToAssetTags} from '../../utils/assets';

interface IProps {
    asset: Partial<IAssetItem>;
    disabled?: boolean;
    onChange<K extends keyof IAssetItem>(field: string, value: IAssetItem[K]): void;
    sets: Array<ISetItem>;
    fields?: Array<keyof IAssetItem>;
    updates?: Partial<IAssetItem>;
    allowedStates?: Array<ASSET_STATE>;
}

interface IState {
    tags: Array<IAssetTag>;
}

const mapStateToProps = (state: IApplicationState) => ({
    sets: getActiveSets(state),
});

const NEW_CODE_PREFIX = '_new:';

class AssetEditorComponent extends React.PureComponent<IProps, IState> {
    onChange: Dictionary<string, (value: any) => void>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            tags: cloneDeep<Array<IAssetTag>>(this.props.asset.tags!) || [],
        };

        this.changeTag = this.changeTag.bind(this);

        this.onChange = {
            name: (value: string) => this.props.onChange('name', value.trim()),
            description: (value: string) => this.props.onChange('description', value.trim()),
            filename: (value: string) => this.props.onChange('filename', value.trim()),
            state: (value: string) => this.props.onChange('state', value),
            set_id: (value: string) => this.props.onChange('set_id', value),
            tags: (value: IAssetTag) => this.changeTag('tags', value, 'add'),
        };
    }

    changeTag<K extends keyof IAssetItem>(field: K, value: IAssetTag, method?: string) {
        if (field === 'tags') {
            if (method === 'add') {
                this.addTag(value!);
            } else if (method === 'remove') {
                this.removeTag(value);
            }
            this.props.onChange('tags', this.state.tags);
        }
    }

    addTag(value: IAssetTag) {
        this.setState((preState: IState) => {
            const oldState = preState;
            const tags: Array<IAssetTag> = preState.tags! || [];
            const newTag: IAssetTag = value!;

            if (newTag.code.startsWith(NEW_CODE_PREFIX)) {
                const tag = newTag.code.split(':')[1];

                newTag.code = tag;
                newTag.name = tag;
            }

            const index = tags.findIndex((tag) => {
                return tag.code === newTag.code;
            });

            if (index === -1) {
                tags.push(value);
                return {
                    tags: tags,
                };
            }

            return {
                tags: oldState.tags,
            };
        });
    }

    removeTag(value: IAssetTag) {
        this.setState((preState: IState) => {
            const tags: Array<{name: string, code: string}> = preState.tags!;
            const newTag: any = value!;
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            const index = this.state.tags?.indexOf(newTag)!;

            tags.splice(index, 1);
            return {
                tags: tags,
            };
        });
    }

    searchTags(searchString: string, callback: (result: Array<any>) => void) {
        let cancelled = false;
        const searchPrefix = searchString.startsWith('*') ? '' : '*';
        const searchSuffix = searchString.endsWith('*') ? '' : '*';

        samsApi.assets.searchTags(`${searchPrefix}${searchString}${searchSuffix}`)
            .then((res: IAutoTaggingSearchResult) => {
                if (cancelled !== true) {
                    const {gettext} = superdeskApi.localization;
                    const result = convertTagSearchResultToAssetTags(res).toArray();
                    const currentTagCodes = this.state.tags.map(
                        (tag) => tag.code,
                    );

                    result.unshift({
                        code: `${NEW_CODE_PREFIX}${searchString}`,
                        name: gettext('Create new tag: "{{ tag }}"', {tag: searchString}),
                    });

                    callback(result.filter(
                        (tag) => !currentTagCodes.includes(tag.code),
                    ));
                }
            });

        return {
            cancel: () => {
                cancelled = true;
            },
        };
    }

    fieldEnabled(field: keyof IAssetItem) {
        return (this.props.fields == null || this.props.fields.includes(field)) ?
            true :
            null;
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const allowedStates = this.props.allowedStates ?? [
            ASSET_STATE.DRAFT,
            ASSET_STATE.INTERNAL,
            ASSET_STATE.PUBLIC,
        ];

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
                                type="text"
                                label={gettext('Name')}
                                required={true}
                                value={this.props.asset.name ?? ''}
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
                                type="text"
                                label={gettext('Description')}
                                value={this.props.asset.description ?? ''}
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
                                {!allowedStates.includes(ASSET_STATE.DRAFT) ? null : (
                                    <Option value={ASSET_STATE.DRAFT}>
                                        {gettext('Draft')}
                                    </Option>
                                )}
                                {!allowedStates.includes(ASSET_STATE.INTERNAL) ? null : (
                                    <Option value={ASSET_STATE.INTERNAL}>
                                        {gettext('Internal')}
                                    </Option>
                                )}
                                {!allowedStates.includes(ASSET_STATE.PUBLIC) ? null : (
                                    <Option value={ASSET_STATE.PUBLIC}>
                                        {gettext('Public')}
                                    </Option>
                                )}
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
                                key={(this.state.tags || []).length}
                                label={gettext('Tags')}
                                value={''}
                                keyValue="name"
                                items={[]}
                                search={(searchString, callback) => this.searchTags(searchString, callback)}
                                onSelect={this.onChange.tags}
                                onChange={noop}
                                disabled={this.props.disabled === true}
                            />
                        </FormRow>
                    </FormGroup>
                )}
                {this.state.tags.length !== 0 && (
                    <FormGroup>
                        <FormRow>
                            {this.state.tags?.map((tag) => (
                                this.props.disabled ? (
                                    <Label
                                        key={this.state.tags.indexOf(tag)}
                                        text={tag.name}
                                        style="translucent"
                                        size="large"
                                    />
                                ) : (
                                    <Tag
                                        key={this.state.tags.indexOf(tag)}
                                        text={tag.name}
                                        onClick={() => {
                                            this.changeTag('tags', tag, 'remove');
                                        }}
                                    />
                                )
                            ))}
                        </FormRow>
                    </FormGroup>
                )}
            </React.Fragment>
        );
    }
}

export const AssetEditor = connect(mapStateToProps)(AssetEditorComponent);
