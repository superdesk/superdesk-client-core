import React, {ReactNode} from 'react';
import {IRestApiResponse, ITranslation} from 'superdesk-api';
import {Spacer, Button, Text, TreeSelect} from 'superdesk-ui-framework/react';
import {ITranslationLanguage} from '../ai-assistant';
import {superdesk} from '../superdesk';

interface IProps {
    setActiveLanguage: (language: ITranslationLanguage) => void;
    activeLanguage: ITranslationLanguage;
    generateTranslations: () => void;
}

type ITranslationLanguageWithLabel = Pick<ITranslation, '_id' | 'label'>;

interface IState {
    languages: Array<ITranslationLanguageWithLabel>;
}

export default class TranslationFooter extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            languages: [],
        };
    }

    componentDidMount(): void {
        superdesk.httpRequestJsonLocal<IRestApiResponse<ITranslationLanguageWithLabel>>({
            method: 'GET',
            path: '/languages',
        }).then((response) => {
            this.setState({
                languages: response._items,
            })
        });
    }

    render(): ReactNode {
        const {gettext} = superdesk.localization;
        const {activeLanguage, setActiveLanguage, generateTranslations} = this.props;

        const availableLanguages = this.state.languages;

        if (Object.keys(availableLanguages ?? {}).length < 1) {
            return (
                <Text>
                    {gettext('Languages are not available.')}
                </Text>
            )
        }

        return (
            <Spacer h gap='8' justifyContent='space-between' alignItems='end'>
                <TreeSelect
                    getId={({_id}) => _id}
                    getLabel={({label}) => label as string}
                    zIndex={1050}
                    getOptions={() => availableLanguages.map((language) => ({value: language}))}
                    kind="synchronous"
                    onChange={(value) => {
                        setActiveLanguage(value[0]._id)
                    }}
                    value={[{_id: activeLanguage, label: availableLanguages.find((x) => x._id === activeLanguage)?.label}]}
                    inlineLabel
                    labelHidden
                    fullWidth
                    label={gettext('Selected language:')}
                    required
                />
                <Button
                    expand
                    onClick={generateTranslations}
                    text={gettext('Translate')}
                    style="hollow"
                />
            </Spacer>
        )
    }
}
