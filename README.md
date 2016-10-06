# Superdesk Client

[![Build Status](https://travis-ci.org/superdesk/superdesk-client-core.svg?branch=master)](https://travis-ci.org/superdesk/superdesk-client-core)
[![Code Climate](https://codeclimate.com/github/superdesk/superdesk-client-core/badges/gpa.svg)](https://codeclimate.com/github/superdesk/superdesk-client-core)
### Installation

For installation instructions, please refer to the README file at: [https://github.com/superdesk/superdesk/](https://github.com/superdesk/superdesk/ "")

### Build configuration

To configure the build, the `superdesk.config.js` file must export a function that returns the configuration object. The configuration object can contain the keys described belowed. Dot-notation is used to illustrate the depth and group of a certain key. We use a function instead of a simple JSON object to allow the convenience of using grunt flags, as well as give access to environment variables for more diverse configurations.

##### Server

- `server.url` - superdesk rest api server url
- `server.ws` - superdesk websocket server url

##### Services

- `iframely.key` - iframely api key
- `raven.dsn` - sentry api key
- `analytics.ga` - google analytics id
- `analytics.piwik.url` - piwik analytics url
- `analytics.piwik.id` - piwik application id

##### Features

- `features.preview`: `false` - enables print preview in authoring
- `features.alchemy`: `false` - allow alchemy widget for keywords
- `features.elasticHighlight`: `false` - allow highlighting of search terms by elasticsearch
- `features.noTakes`: `false` - disable takes related functionality

##### Workspace
- `workspace.content`: `false` - enable content view in workspace (obsolete)
- `workspace.ingest`: `false` - enable ingest view in workspace (obsolete)

##### Editor

- `editor.toolbar`: `object|false` - editor toolbar configuration, set to `false` to disable toolbar
- `editor.embeds`: `true` - enable embedding in article body
- `editor.vidible`: `false` - enables Vidible as embed provider

##### Date & Time

- `defaultTimezone`: `'Europe/London'` - default timezone for date time pickers
- `view.dateformat`: `'MM/DD/YYYY'` - presented date format for datepickers
- `view.timeformat`: `'HH:mm'` - presented time format for timepickers
- `shortTimeFormat`: `'hh:mm'` - format for current day in item list
- `shortWeekFormat`: `'dddd, hh:mm'` - format for current week in item list
- `shortDateFormat`: `'MM/DD'` - format for other days in item list
- `longDateFormat`: `'LLL'` - format with full date and time

##### Authoring

- `previewSubjectFilterKey`: `null` - full preview in authoring displays only matching subjects

##### UI

- `ui.italicAbstract`: `true` - render abstract using italics
- `ui.sendAndPublish`: `true` - display the send and publish button.

##### List

You can configure what will be displayed in list views, there are 3 areas in list which you can configure:

- `priority` - second box, you can use there `priority` and `urgency`, in case you use also `secondLine` both

- `firstLine` - main area - defaults are:
    - `wordcount`
    - `slugline`
    - `headline`
    - `versioncreated`

- `secondLine` - optional second line - defaults are:
    - `profile`
    - `state` - workflow state
    - `embargo` - flag if item is embargoed
    - `update` - flag if item is an update
    - `takekey`
    - `takepackage` - link to other takes
    - `signal`
    - `broadcast`
    - `flags` - flags for "not for publication", "sms"
    - `updated` - flag if an item was updated
    - `category` - anpa category
    - `provider` - ingest provider info
    - `expiry` - expiry of spiked items
    - `desk` - where an item was fetched for ingested, where an item is for others

##### Miscellaneous

- `defaultRoute` - sets the route that the app will go to upon logging in (home route).
- `langOverride` - allows to override some labels in the UI (breaking, not recommended). It should be an object containing keys for language identifier and values as objects mapping labels to their translation. Example value: `{'en': {'Category':'Service'}}` would display _Service_ in place of _Category_ for the english (_en_) version.
- `requiredMediaMetadata`: `array` - describes a list of fields that are required for media items (images/video)
