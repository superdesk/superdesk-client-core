import {sdApi} from 'api';
import React from 'react';
import {ReactNode} from 'react';
import {IArticle} from 'superdesk-api';
import {
    Spacer,
    IconButton,
    ContentDivider,
    Container,
    ButtonGroup,
    Button,
    Text,
} from 'superdesk-ui-framework/react';

interface IProps {
    onClose: () => void;
    article: IArticle;
}

export default class HeadlinesTab extends React.Component<IProps, any> {
    render(): ReactNode {
        const sampleData = [
            'Praesent commodo cursus magna, vel scelerisque nisl consectetur et aenean eu leo quam ultricies.',
            'v2 Praesent commodo cursus magna, vel scelerisque nisl consectetur et aenean eu leo quam ultricies.',
            'v3 Praesent commodo cursus magna, vel scelerisque nisl consectetur et aenean eu leo quam ultricies.',
            'v4 Praesent commodo cursus magna, vel scelerisque nisl consectetur et aenean eu leo quam ultricies.',
        ];

        return (
            <Spacer v gap="0" noWrap noGrow>
                {
                    sampleData.map((x, i) => (
                        <React.Fragment key={i}>
                            <Container gap="small" direction="column">
                                <Text size="small" weight="medium">
                                    {x}
                                </Text>
                                <ButtonGroup>
                                    <Button
                                        size="small"
                                        text="Apply"
                                        onClick={() => {
                                            sdApi.article.patch(
                                                this.props.article,
                                                {
                                                    headline: x,
                                                },
                                                {patchDirectlyAndOverwriteAuthoringValues: true},
                                            );
                                        }}
                                        type="default"
                                        style="hollow"
                                    />
                                    <IconButton
                                        ariaValue="Copy"
                                        icon="copy"
                                        onClick={() => {
                                            navigator.clipboard.writeText(x);
                                        }}
                                    />
                                </ButtonGroup>
                            </Container>

                            <ContentDivider type="dashed" margin="small" />
                        </React.Fragment>
                    ))
                }
            </Spacer>
        );
    }
}
