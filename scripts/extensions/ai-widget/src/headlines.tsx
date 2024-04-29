import React from 'react';
import {ReactNode} from 'react';
import {IArticle, ISuperdesk} from 'superdesk-api';
import {
    Spacer,
    IconButton,
    ContentDivider,
    Container,
    ButtonGroup,
    Button,
    Text,
    Loader,
    Heading,
} from 'superdesk-ui-framework/react';
import {superdesk} from './superdesk';
import {OrderedMap} from 'immutable';
import {convertToRaw, ContentState} from 'draft-js';

interface IProps {
    article: IArticle;
    error: boolean;
    loading: boolean;
    headlines: Array<string>;
    generateHeadlines: () => void;
    superdesk: ISuperdesk;
    fieldsData?: OrderedMap<string, unknown>;
    onFieldsDataChange?(fieldsData?: OrderedMap<string, unknown>): void;
}

export default class HeadlinesTab extends React.Component<IProps> {
    componentDidMount(): void {
        if (this.props.headlines.length < 1) {
            this.props.generateHeadlines();
        }
    }

    render(): ReactNode {
        const {error, loading, headlines, article, generateHeadlines} = this.props;
        const {gettext} = this.props.superdesk.localization;

        if (error) {
            return (
                <Spacer v alignItems="center" gap="8" justifyContent="center" noWrap>
                    <Button
                        style="hollow"
                        onClick={generateHeadlines}
                        text={gettext('Regenerate')}
                    />
                    <Heading type="h6" align="center">
                        {gettext('There was an error when trying to generate headlines.')}
                    </Heading>
                </Spacer>
            );
        }

        if (loading) {
            return <Loader overlay />;
        }

        return (
            <Spacer v gap="0" noWrap noGrow>
                {headlines.map((headline, i) => (
                    <React.Fragment key={i}>
                        <Container gap="small" direction="column">
                            <Text size="small" weight="medium">
                                {headline}
                            </Text>
                            <ButtonGroup>
                                <Button
                                    size="small"
                                    text={gettext('Apply')}
                                    onClick={() => {
                                        if (superdesk.instance.authoringReactViewEnabled) {
                                            const rawState = convertToRaw(ContentState.createFromText(headline));

                                            this.props.onFieldsDataChange?.(
                                                this.props.fieldsData?.set(
                                                    'headline',
                                                    superdesk.helpers.editor3ToOperationalFormat(
                                                        {rawContentState: rawState},
                                                        'en',
                                                    ),
                                                ));
                                        } else {
                                            superdesk.entities.article.patch(
                                                article,
                                                {headline},
                                                {patchDirectlyAndOverwriteAuthoringValues: true},
                                            );
                                        }
                                    }}
                                    type="default"
                                    style="hollow"
                                />
                                <IconButton
                                    ariaValue={gettext('Copy')}
                                    icon="copy"
                                    onClick={() => {
                                        navigator.clipboard.writeText(headline);
                                    }}
                                />
                            </ButtonGroup>
                        </Container>

                        <ContentDivider type="dashed" margin="small" />
                    </React.Fragment>
                ))}
            </Spacer>
        );
    }
}
