import * as React from 'react';
import {Autocomplete as AutoCompleteUI} from 'superdesk-ui-framework/react';

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
        const {getLabel} = this.props;
        const {suggestions} = this.state;
        const suggestionStrings = suggestions == null ? [] : suggestions.map((suggestion) => getLabel(suggestion));

        return (
            <div>
                <div>test: {JSON.stringify(suggestionStrings)}</div>
                <AutoCompleteUI
                    label={this.props.fieldLabel}
                    items={suggestionStrings}
                    onChange={(term) => {
                        this.search(term);
                    }}
                />
            </div>
        );
    }
}
