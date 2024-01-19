# Publish preview

Superdesk is headless and its output doesn't provide any visual styles. Publish preview allows authors to see how an article would look like when published on their website. To set it up, it's required that the website provides a HTTP endpoint for preview. The endpoint will receive the article in the format that is configured in a destination and has to return HTML. An example is provided in `../preview-test-server`. "Preview endpoint URL" has to be added to a destination in Settings > Subscribers. "Preview" button would then appear in the publish pane.
