/**
 * FIXME: THIS IS A PLACEHOLDER COMPONENT FOR TESTING ONLY
 *
 * It should be replaced by a proper implementation before merging to develop
 * https://github.com/superdesk/superdesk-ui-framework/issues/597
 */

import {assertNever} from 'core/helpers/typescript-helpers';
import React from 'react';
import {ITreeNode, ITreeWithLookup} from 'superdesk-api';
import {MultiSelectTemplate} from './multi-select-tree-with-template-tree-only';
import {showPopup} from './popupNew';

interface IPropsBase<T> {
    values: Array<T>;
    onChange(values: Array<T>): void;
    optionTemplate?: React.ComponentType<{item: T}>;
    valueTemplate?: React.ComponentType<{item: T}>; // not required, it should fallback `optionTemplate` if not provided
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
        const {onChange, getId, getLabel, canSelectBranchWithChildren} = props;
        const optionTemplateDefault: React.ComponentType<{item: T}> = ({item}) => (<span>{getLabel(item)}</span>);
        const OptionTemplate = this.props.optionTemplate ?? optionTemplateDefault;
        const ValueTemplate = this.props.valueTemplate ?? OptionTemplate;
        const values = Array.isArray(this.props.values) ? this.props.values : [];

        const input = (() => {
            if (props.kind === 'synchronous') {
                return (
                    <button
                        onClick={(event) => {
                            showPopup(
                                event.target as HTMLElement,
                                'bottom-start',
                                ({closePopup}) => (
                                    <MultiSelectTemplate
                                        options={props.getOptions().nodes}
                                        values={values}
                                        onChange={(val) => {
                                            this.props.onChange(val);
                                            closePopup();
                                        }}
                                        optionTemplate={OptionTemplate}
                                        canSelectBranchWithChildren={canSelectBranchWithChildren}
                                    />
                                ),
                                1060,
                            );
                        }}
                    >
                        +
                    </button>
                );
            } else if (props.kind === 'asynchronous') {
                return (
                    <button
                        onClick={(event) => {
                            const {target} = event;

                            props.searchOptions('paris', (result) => {
                                showPopup(
                                    target as HTMLElement,
                                    'bottom-start',
                                    ({closePopup}) => (
                                        <div>
                                            <MultiSelectTemplate
                                                options={result.nodes}
                                                values={values}
                                                onChange={(val) => {
                                                    this.props.onChange(val);
                                                    closePopup();
                                                }}
                                                optionTemplate={OptionTemplate}
                                                canSelectBranchWithChildren={canSelectBranchWithChildren}
                                            />
                                        </div>
                                    ),
                                    999,
                                );
                            });
                        }}
                    >
                        +
                    </button>
                );
            } else {
                assertNever(props);
            }
        })();

        return (
            <div>
                {input}

                {
                    values.map((item, i) => (
                        <span key={i}>
                            <ValueTemplate item={item} />
                            <button
                                onClick={() => {
                                    onChange(
                                        values.filter((_value) => getId(_value) !== getId(item)),
                                    );
                                }}
                            >
                                x
                            </button>
                        </span>
                    ))
                }
            </div>
        );
    }
}
