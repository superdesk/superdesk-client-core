import React from 'react';
import {IEditorStore, initializeSpellchecker} from '../store';
import ng from 'core/services/ng';
import {isEqual} from 'lodash';

interface IProps {
    spellchecking: IEditorStore['spellchecking'];
    dispatch(): void;
}

interface IState {
    loading: boolean;
}

export class Editor3InitializeSpellchecker extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: props.spellchecking.enabled === true,
        };

        this.load = this.load.bind(this);
    }

    private load() {
        if (this.props.spellchecking.enabled === true) {
            const spellcheck = ng.get('spellcheck');
            const language = this.props.spellchecking.language;

            spellcheck.getDictionary(language).then((dict) => {
                spellcheck.isActiveDictionary = !!dict.length;
                spellcheck.setLanguage(language);
                spellcheck.setSpellcheckerStatus(true);

                initializeSpellchecker(this.props.dispatch, spellcheck).then(() => {
                    this.setState({loading: false});
                });
            });
        }
    }

    componentDidMount(): void {
        this.load();
    }

    componentDidUpdate(prevProps: Readonly<IProps>): void {
        if (
            this.props.spellchecking.enabled !== prevProps.spellchecking.enabled
            || this.props.spellchecking.language !== prevProps.spellchecking.language
        ) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({loading: true}, this.load);
        }
    }

    render() {
        if (this.state.loading) {
            return null;
        } else {
            return this.props.children;
        }
    }
}
