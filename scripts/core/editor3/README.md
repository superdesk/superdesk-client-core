# Editor

Provides an Angular directive and a React component that can be used to instantiate a rich-text editor based on Facebook's
[DraftJS](https://draftjs.org/) editor.

### Features

The following features are supported by the editor via its toolbar:

- Inline text styles: bold, italic, underline
- Block styles: H1-H6, quote, ordered and unordered lists
- Anchor links
- Embedded media using [iframe.ly](https://iframely.com/)
- Embedded media using uploads (images, video and audio)
- Find & Replace API
- Tables (basic)
- Highlights: Inline comments and Annotations

### Configuration

The options that the editor can be instantiated with are more or less the same between the AngularJS directive and the React component and are
both thoroughly documented in the corresponding files. See:

- [React component props](https://github.com/superdesk/superdesk-client-core/blob/5e9d90424608b320633cc24e0ba1d550ac9f6699/scripts/core/editor3/react.jsx#L53-L99)
- [AngularJS directive attributes](https://github.com/superdesk/superdesk-client-core/blob/5e9d90424608b320633cc24e0ba1d550ac9f6699/scripts/core/editor3/directive.js#L30-L137)

## Technical Details

To get acquainted with the editor, a good place to start is the `components/Editor3.jsx` file, the `components/toolbar/index.js` file and
the `components/blockRenderer.js` file. Everything else will fall into place from here.

The data that the editor is initialized with can be understood by looking into the `store`.

### Tables

Tables are a feature of the Editor that has been implemented in a tricky manner because the support for this does not exist in DraftJS.
The way tables work is that an atomic block is created inside the editor which contains a JSX table, where each cell is a basic instance
of a DraftJS editor. As you can imagine, this is quite tricky and error-prone but can work within a limited set of features such as the
current version.

There are other functionalities and occurrences where an atomic block contains a child instance of an editor, such as the image captions
and title. The important thing to note here is that in order to be able to interact with a child editor inside the parent DraftJS editor,
the parent needs to be locked (eg. set to read-only) while activity goes on inside the child editor. Because of this, whenever the cursor is
placed inside a table cell, the parent editor needs to be locked, and then unlocked when the parent editor gets focused again. This has been
a source of errors and bugs and is important to consider and understand.

### AngularJS Service

The `service.js` file contains an AngularJS service (named `editor3`) which can be used to access and interact with the editor store. This is
used to query the HTML of the editor or to trigger find & replace actions from an external component. The service will only control the last
editor that has the `data-find-replace-target` attribute set.

### Highlights

Highlights is a functionality of the editor which provides an API that allows binding metadata to a text selection inside the editor. Using this API,
inline commenting was implemented, a feature which allows putting comments on text selections (similar to Google Docs), as well as text
annotations, a feature which allows putting metadata on a text subset which will be added as an annotation in the output HTML.

Highlights are stored in the metadata of the first block in the editor. DraftJS v0.10.0 will provide an entity store which might be able to be
used as a target for storing these. Storing the information in the first block seemed to work fine so far because the ID of the first block
never changes, but this might not be reliable in the long run.

Highlights are updated on each change that occurs in the editor. Whenever content is added, removed or changed the positions of these highlights
in the editor are recalculated using a diff-ing algorithm. The implementation is in `reducers/highlights`.

### File layout

The structure of this module (as of commit [`5e9d904`](https://github.com/superdesk/superdesk-client-core/commit/5e9d90424608b320633cc24e0ba1d550ac9f6699)) with a slight description of each file can be seen below:

```js
├── actions
│   ├── editor3.jsx                       // Redux Action Creators - General Editor Actions
│   ├── find-replace.jsx                  // Redux Action Creators - Find & Replace
│   ├── highlights.jsx                    // Redux Action Creators - Highlights
│   ├── popups.jsx                        // Redux Action Creators - Popup actions
│   ├── spellchecker.jsx                  // Redux Action Creators - Spellchecker
│   ├── table.jsx                         // Redux Action Creators - Tables
│   └── toolbar.jsx                       // Redux Action Creators - General Toolbar Actions
├── components
│   ├── annotations                       // React Components - Annotations
│   │   ├── AnnotationInput.jsx           // React Components - Annotations - Creation Popup
│   │   └── AnnotationPopup.jsx           // React Components - Annotations - Viewing Popup
│   ├── comments
│   │   ├── CommentInput.jsx              // React Components - Comments - Creation Popup
│   │   ├── CommentPopup.jsx              // React Components - Comments - Viewing Popup
│   │   └── mentionsStyle.js              // React Components - Comments - User mentions styling (used by react-mentions dependency)
│   ├── embeds
│   │   ├── EmbedBlock.jsx                // React Components - Embeds - Editor Block
│   │   ├── EmbedInput.jsx                // React Components - Embeds - Creation Popup
│   │   ├── QumuWidget.jsx                // React Components - Embeds - Qumu Widget Editor Block
│   │   └── loadIframely.jsx              // React Components - Embeds - iframe.ly initialization script
│   ├── links
│   │   ├── AttachmentList.jsx            // React Components - Links - Creation Popup Tab for linking to item attachements (Superdesk specific)
│   │   ├── LinkDecorator.jsx             // React Components - Links - Decorator (see https://draftjs.org/docs/advanced-topics-decorators.html)
│   │   ├── LinkInput.jsx                 // React Components - Links - Creation Popup
│   │   ├── LinkToolbar.jsx               // React Components - Links - Mini toolbar (shows under regular toolbar when cursor is on link)
│   │   └── entityUtils.js                // React Components - Links - Utilities to simplify working with DraftJS entities
│   ├── media
│   │   └── MediaBlock.jsx                // React Components - Uploaded Media (audio, video, image) - Editor Block
│   ├── spellchecker                      // React Components - Spellchecker (mostly Superdesk specific using the Tansa service)
│   │   ├── SpellcheckerContextMenu.jsx   // React Components - Spellchecker - Context Menu (shows when right-clicking typos)
│   │   └── SpellcheckerDecorator.jsx     // React Components - Spellchecker - Decorator (see https://draftjs.org/docs/advanced-topics-decorators.html)
│   ├── tables                            // React Components - Tables - See specific section in README document.
│   │   ├── TableBlock.jsx                // React Components - Tables - Editor Block
│   │   └── TableCell.jsx                 // React Components - Tables - Table Cell
│   ├── toolbar
│   │   ├── index.jsx                     // React Components - Toolbar - Actual component which puts everything together
│   │   ├── BlockStyleButtons.jsx         // React Components - Toolbar - Block styling buttons (header, quote, etc)
│   │   ├── IconButton.jsx                // React Components - Toolbar - Generic Icon button
│   │   ├── InlineStyleButtons.jsx        // React Components - Toolbar - Inline text styling buttons (bold, italic, etc)
│   │   ├── SelectionButton.jsx           // React Components - Toolbar - Generic button which gets enabled only when text is selected
│   │   ├── StyleButton.jsx               // React Components - Toolbar - Generic button that can be toggled (used by inline and block styles)
│   │   ├── TableControls.jsx             // React Components - Toolbar - Set of buttons used for tables (add row/col, toggle header)
│   │   └── ToolbarPopup.jsx              // React Components - Toolbar - General component wrapping all popups (for creating annotations, links, embeds, etc)
│   ├── Editor3.jsx                       // React Components - DraftJS Editor - Base Editor Implementation
│   ├── HighlightsPopup.jsx               // React Components - Highlights Popup - Shows when a highlight (comment or annotation) is selected.
│   ├── blockRenderer.jsx                 // React Components - DraftJS Block Renderer - renders atomic blocks (see https://draftjs.org/docs/advanced-topics-block-components.html)
│   ├── customStyleMap.jsx                // React Components - DraftJS Custom Style map (see https://draftjs.org/docs/advanced-topics-inline-styles.html)
│   └── handlePastedText.js               // React Components - DraftJS Text Pasting callback (see https://draftjs.org/docs/api-reference-editor.html)
├── html
│   ├── from-html                         // Create an Editor-compatible ContentState from HTML
│   └── to-html                           // Create HTML from Editor's DraftJS ContentState
│       ├── AtomicBlockParser.js          // Creates HTML from atomic blocks
│       └── HTMLGenerator.js              // Wrapper classs for HTML generation
├── reducers
│   ├── highlights                        // Highlights. See corresponding section in README document.
│   │   ├── highlights.js                 // Contains a function to update highlights positions when content changes
│   │   ├── index.js                      // Exports and highlight types
│   │   ├── offsets.jsx                   // Exports a function to reposition highlights based on new editor state
│   │   ├── store.jsx                     // Functions to load, save and replace highlights.
│   │   └── styles.jsx                    // Functions to work with (re)drawing the highlights in the editor
│   ├── editor3.jsx                       // Redux Reducers - Editor Generic
│   ├── find-replace.jsx                  // Redux Reducers - Find & Replace related
│   ├── highlight.jsx                     // Redux Reducers - Highlights specific
│   ├── spellchecker.jsx                  // Redux Reducers - Spellchecker (correct, add to dictionary, etc.)
│   ├── table.jsx                         // Redux Reducers - Tables (add/remove rows/cols, toggle headers, etc)
│   └── toolbar.jsx                       // Redux Reducers - Toolbar buttons
├── store                                        
│   └── index.js                          // Redux Store - Creates the Redux store based on various options and settings
├── directive.js                          // AngularJS Directive version of Editor
├── react.jsx                             // React Component version of Editor
├── service.js                            // Service for external interaction with editor (see "Service" section)
└── styles.scss                           // SASS Styles for everything editor related
```
