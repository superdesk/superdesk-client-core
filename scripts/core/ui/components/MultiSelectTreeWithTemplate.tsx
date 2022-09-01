import {assertNever} from 'core/helpers/typescript-helpers';
import React from 'react';
import {ITreeNode, ITreeWithLookup} from 'superdesk-api';
import {TreeSelect} from 'superdesk-ui-framework/react';

interface IPropsBase<T> {
    values: Array<T>;
    onChange(values: Array<T>): void;
    optionTemplate?: React.ComponentType<{item: T}>;
    valueTemplate?: React.ComponentType<{item: T}>;
    getId(item: T): string;
    getLabel(item: T): string;
    canSelectBranchWithChildren?(branch: ITreeNode<T>): boolean;
    allowMultiple?: boolean;
    readOnly?: boolean;
}

interface IPropsSync<T> extends IPropsBase<T> {
    kind: 'synchronous';
    getOptions(): ITreeWithLookup<T>;
}

type ICancelFn = () => void;

interface IPropsAsync<T> extends IPropsBase<T> {
    kind: 'asynchronous';

    /**
     * The function will be called when a search is initiated from UI.
     * `callback` will be invoked with matching options after they are retrieved.
     * A function to cancel the asynchronous search is returned.
     */
    searchOptions(term: string, callback: (options: ITreeWithLookup<T>) => void): ICancelFn;
}

type IProps<T> = IPropsSync<T> | IPropsAsync<T>;

export class MultiSelectTreeWithTemplate<T> extends React.PureComponent<IProps<T>> {
    render() {
        const {props} = this;
        const {getId, getLabel} = props;
        const optionTemplateDefault: React.ComponentType<{item: T}> = ({item}) => (<span>{getLabel(item)}</span>);
        const OptionTemplate = this.props.optionTemplate ?? optionTemplateDefault;
        const ValueTemplate = this.props.valueTemplate ?? OptionTemplate;
        const values = Array.isArray(this.props.values) ? this.props.values : [];

        if (props.kind === 'synchronous') {
            return (
                <TreeSelect
                    kind="synchronous"
                    label=""
                    inlineLabel
                    labelHidden
                    getOptions={() => props.getOptions().nodes}
                    value={values}
                    onChange={(val) => {
                        this.props.onChange(val);
                    }}
                    getLabel={getLabel}
                    getId={getId}
                    selectBranchWithChildren={false}
                    optionTemplate={(item) => <OptionTemplate item={item} />}
                    valueTemplate={(item) => <ValueTemplate item={item} />}
                    allowMultiple={this.props.allowMultiple}
                    singleLevelSearch
                    readOnly={this.props.readOnly}
                />
            );
        } else if (props.kind === 'asynchronous') {
            return (
                <TreeSelect
                    kind="asynchronous"
                    label=""
                    inlineLabel
                    labelHidden
                    searchOptions={(term, callback) => {
                        props.searchOptions(term, (res) => {
                            callback(res.nodes);
                        });
                    }}
                    value={values}
                    onChange={(val) => {
                        this.props.onChange(val);
                    }}
                    getLabel={getLabel}
                    getId={getId}
                    selectBranchWithChildren={false}
                    optionTemplate={(item) => <OptionTemplate item={item} />}
                    valueTemplate={(item) => <ValueTemplate item={item} />}
                    allowMultiple={this.props.allowMultiple}
                    readOnly={this.props.readOnly}
                />
            );
        } else {
            return assertNever(props);
        }
    }
}
