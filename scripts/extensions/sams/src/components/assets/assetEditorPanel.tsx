// External modules
import * as React from 'react';

// Types
import {ASSET_STATE, IAssetItem, ISetItem} from '../../interfaces';
import {superdeskApi} from '../../apis';

// UI
import {FormLabel, Input, Option, Select} from 'superdesk-ui-framework/react';
import {FormGroup, FormRow} from '../../ui';
import {getHumanReadableFileSize} from '../../utils/ui';

interface IProps {
    asset: Partial<IAssetItem>;
    disabled?: boolean;
    onChange(field: string, value: string): void;
    sets: Array<ISetItem>;
}

export class AssetEditorPanel extends React.PureComponent<IProps> {
    onChange: Dictionary<string, (value: string) => void>;

    constructor(props: IProps) {
        super(props);

        this.onChange = {
            name: (value: string) => this.props.onChange('name', value.trim()),
            description: (value: string) => this.props.onChange('description', value.trim()),
            filename: (value: string) => this.props.onChange('filename', value.trim()),
            state: (value: string) => this.props.onChange('state', value),
            set_id: (value: string) => this.props.onChange('set_id', value),
        };
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

                <FormGroup>
                    <FormRow>
                        <Input
                            label={gettext('Name')}
                            value={this.props.asset.name}
                            onChange={this.onChange.name}
                            disabled={this.props.disabled === true}
                        />
                    </FormRow>
                </FormGroup>
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
            </React.Fragment>
        );
    }
}
