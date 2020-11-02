import * as React from 'react';
// import {Autocomplete as AutoCompleteUI} from 'superdesk-ui-framework/react';

interface IProps<T> {
    fieldLabel: string;

    value: string;
    onChange(value: string): void;

    getSuggestions(searhString: string, callback: (result: Array<T>) => void): {cancel: () => void};
    onSuggestionSelect(suggestion: T): void;
    getLabel(suggestion: T): string;
}

interface IState<T> {
    suggestions?: Array<T> | null;
}

export class Autocomplete<T> extends React.PureComponent<IProps<T>, IState<T>> {
    latestCall?: {cancel: () => void};

    constructor(props: IProps<T>) {
        super(props);

        this.state = {};

        this.search = this.search.bind(this);
    }
    search(term: string) {
        this.setState({suggestions: null});
        this.props.onChange(term);

        this.latestCall?.cancel();

        this.latestCall = this.props.getSuggestions(term, (results) => {
            this.setState({suggestions: results});
        });
    }
    render() {
        const {value, onChange, getLabel, onSuggestionSelect} = this.props;
        const {suggestions} = this.state;

        return (
            <div>
                <label className="sd-input__label">{this.props.fieldLabel}</label>
                <input
                    type="text"
                    value={value}
                    onChange={(event) => {
                        onChange(event.target.value);
                        this.search(event.target.value);
                    }}
                />

                <div>
                    {(suggestions ?? []).map((suggestion, i) => (
                        <div key={i}>
                            <button
                                onClick={() => {
                                    onSuggestionSelect(suggestion);
                                }}
                            >{getLabel(suggestion)}</button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
