import * as React from 'react';
import {throttle} from 'lodash';

interface IProps<T> {
    value: string;
    onChange(value: string): void;

    getSuggestions(searhString: string): Promise<Array<T>>;
    getKey(suggestion: T): React.Key;
    onSuggestionSelect(suggestion: T): void;
    RenderSuggestion: React.ComponentType<{suggestion: T; onClick(): void}>;
}

interface IState<T> {
    suggestions?: Array<T> | null;
}

export class Autocomplete<T> extends React.PureComponent<IProps<T>, IState<T>> {
    getSuggestionsThrottled: (searchString: string) => Promise<Array<T>>;

    constructor(props: IProps<T>) {
        super(props);

        this.state = {};

        this.search = this.search.bind(this);
        this.getSuggestionsThrottled = throttle((term: string) => {
            return this.props.getSuggestions(term);
        }, 500);
    }
    search(term: string) { // TODO: avoid race conditions
        this.setState({suggestions: null});
        this.props.onChange(term);

        this.getSuggestionsThrottled(term)?.then((results) => {
            this.setState({suggestions: results});
        });
    }
    render() {
        const {value, RenderSuggestion, onSuggestionSelect} = this.props;
        const {suggestions} = this.state;

        return (
            <div>
                <input
                    type="text"
                    value={value}
                    onChange={(event) => {
                        this.search(event.target.value);
                    }}
                />

                {
                    suggestions == null ? null : (
                        <ul>
                            {
                                suggestions.map((suggestion) => {
                                    return (
                                        <RenderSuggestion
                                            key={Math.random().toString()}
                                            suggestion={suggestion}
                                            onClick={() => {
                                                onSuggestionSelect(suggestion);
                                            }}
                                        />
                                    );
                                })
                            }
                        </ul>
                    )
                }
            </div>
        );
    }
}
