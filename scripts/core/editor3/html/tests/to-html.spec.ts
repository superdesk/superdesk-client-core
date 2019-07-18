/* tslint:disable:trailing-comma */
/* tslint:disable:max-line-length */
/* tslint:disable:whitespace */
/* eslint-disable max-len, quotes, quote-props, key-spacing, comma-spacing, comma-dangle, indent */

import * as testUtils from '../../components/tests/utils';
import {AtomicBlockParser} from '../to-html';
import {ContentState, convertToRaw, convertFromRaw} from 'draft-js';
import {getInitialContent} from 'core/editor3/store';
import {editor3StateToHtml} from '../to-html/editor3StateToHtml';

describe('core.editor3.html.to-html snapshots', () => {
    it('converts a sentence without formatting', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English hēah-hlāw, meaning \"high mounds\".","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}}],"entityMap":{}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
            '<p>The name of Highlaws comes from the Old English hēah-hlāw, meaning "high mounds".</p>'
        );
    });

    it('converts a sentence with simple inline styles', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English hēah-hlāw, meaning \"high mounds\".","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":0,"length":3,"style":"BOLD"},{"offset":4,"length":4,"style":"ITALIC"},{"offset":9,"length":2,"style":"UNDERLINE"},{"offset":12,"length":8,"style":"STRIKETHROUGH"},{"offset":21,"length":5,"style":"SUBSCRIPT"},{"offset":27,"length":4,"style":"SUPERSCRIPT"}],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}}],"entityMap":{}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
            '<p><b>The</b> <i>name</i> <u>of</u> <s>Highlaws</s> <sub>comes</sub> <sup>from</sup> the Old English hēah-hlāw, meaning "high mounds".</p>'
        );
    });

    it('converts headings', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English hēah-hlāw","type":"header-one","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}},{"key":"32mrs","text":", meaning \"high mounds\". In the past,","type":"header-two","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"d2ggv","text":"variant spellings included Heelawes, Hielawes,","type":"header-three","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"3eqv5","text":"Highlows, Hielows, and Hylaws.","type":"header-four","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"8lcpm","text":"[2] The hamlet appears in a survey of Holm Cultram dating back","type":"header-five","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"emuqc","text":"to the year 1538, during the reign of Henry VIII.","type":"header-six","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"90o9n","text":"There were at least thirteen families resident in Highlaws at that time.[3] Abdastartus is a genus of lace bugs in the family Tingidae. There are about five described species in Abdastartus.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
`<h1>The name of Highlaws comes from the Old English hēah-hlāw</h1>
<h2>, meaning "high mounds". In the past,</h2>
<h3>variant spellings included Heelawes, Hielawes,</h3>
<h4>Highlows, Hielows, and Hylaws.</h4>
<h5>[2] The hamlet appears in a survey of Holm Cultram dating back</h5>
<h6>to the year 1538, during the reign of Henry VIII.</h6>
<p>There were at least thirteen families resident in Highlaws at that time.[3] Abdastartus is a genus of lace bugs in the family Tingidae. There are about five described species in Abdastartus.</p>`
        );
    });

    it('converts a blockquote', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English hēah-hlāw, meaning \"high mounds\".","type":"blockquote","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}},{"key":"2u79k","text":"In the past, variant spellings included Heelawes, Hielawes, Highlows, Hielows, and Hylaws.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
`<blockquote>The name of Highlaws comes from the Old English hēah-hlāw, meaning "high mounds".</blockquote>
<p>In the past, variant spellings included Heelawes, Hielawes, Highlows, Hielows, and Hylaws.</p>`
        );
    });

    it('converts a code block', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English hēah-hlāw, meaning \"high mounds\".","type":"code-block","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}},{"key":"2u79k","text":"In the past, variant spellings included Heelawes, Hielawes, Highlows, Hielows, and Hylaws.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
`<pre><code>The name of Highlaws comes from the Old English hēah-hlāw, meaning "high mounds".</code></pre>
<p>In the past, variant spellings included Heelawes, Hielawes, Highlows, Hielows, and Hylaws.</p>`
        );
    });

    it('converts a link', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English hēah-hlāw, meaning \"high mounds\".","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[{"offset":12,"length":8,"key":0}],"data":{"MULTIPLE_HIGHLIGHTS":{}}}],"entityMap":{"0":{"type":"LINK","mutability":"MUTABLE","data":{"link":{"href":"https://en.wikipedia.org/wiki/Highlaws"}}}}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
            '<p>The name of <a href="https://en.wikipedia.org/wiki/Highlaws">Highlaws</a> comes from the Old English hēah-hlāw, meaning "high mounds".</p>'
        );
    });

    it('converts a simple table', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}},{"key":"fhokc","text":" ","type":"atomic","depth":0,"inlineStyleRanges":[],"entityRanges":[{"offset":0,"length":1,"key":0}],"data":{"data":"{\"cells\":[[{\"blocks\":[{\"key\":\"k8sb\",\"text\":\"three\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}},{\"blocks\":[{\"key\":\"a25i9\",\"text\":\"column\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}},{\"blocks\":[{\"key\":\"ej3lv\",\"text\":\"table\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}],[{\"blocks\":[{\"key\":\"f0qc0\",\"text\":\"example\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}},{\"blocks\":[{\"key\":\"50s2o\",\"text\":\"right\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}},{\"blocks\":[{\"key\":\"escgd\",\"text\":\"here\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}]],\"numRows\":2,\"numCols\":3,\"withHeader\":false}"}},{"key":"2u79k","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{"0":{"type":"TABLE","mutability":"MUTABLE","data":{"data":{"cells":[[{"blocks":[{"key":"k8sb","text":"three","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}},{"blocks":[{"key":"a25i9","text":"column","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}},{"blocks":[{"key":"ej3lv","text":"table","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}],[{"blocks":[{"key":"f0qc0","text":"example","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}},{"blocks":[{"key":"50s2o","text":"right","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}},{"blocks":[{"key":"escgd","text":"here","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}]],"numRows":2,"numCols":3,"withHeader":false}}}}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
            '<table><tbody><tr><td><p>three</p></td><td><p>column</p></td><td><p>table</p></td></tr><tr><td><p>example</p></td><td><p>right</p></td><td><p>here</p></td></tr></tbody></table>'
        );
    });

    it('converts a table with inline styles', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}},{"key":"fhokc","text":" ","type":"atomic","depth":0,"inlineStyleRanges":[],"entityRanges":[{"offset":0,"length":1,"key":0}],"data":{"data":"{\"cells\":[[{\"blocks\":[{\"key\":\"k8sb\",\"text\":\"three\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[{\"offset\":0,\"length\":5,\"style\":\"BOLD\"}],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}},{\"blocks\":[{\"key\":\"a25i9\",\"text\":\"column\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[{\"offset\":0,\"length\":6,\"style\":\"ITALIC\"}],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}},{\"blocks\":[{\"key\":\"ej3lv\",\"text\":\"table\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[{\"offset\":0,\"length\":5,\"style\":\"UNDERLINE\"}],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}],[{\"blocks\":[{\"key\":\"f0qc0\",\"text\":\"example\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[{\"offset\":0,\"length\":7,\"style\":\"SUBSCRIPT\"}],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}},{\"blocks\":[{\"key\":\"50s2o\",\"text\":\"right\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[{\"offset\":0,\"length\":5,\"style\":\"SUPERSCRIPT\"}],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}},{\"blocks\":[{\"key\":\"escgd\",\"text\":\"here\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[{\"offset\":0,\"length\":4,\"style\":\"STRIKETHROUGH\"}],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}]],\"numRows\":2,\"numCols\":3,\"withHeader\":false}"}},{"key":"2u79k","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{"0":{"type":"TABLE","mutability":"MUTABLE","data":{"data":{"cells":[[{"blocks":[{"key":"k8sb","text":"three","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":0,"length":5,"style":"BOLD"}],"entityRanges":[],"data":{}}],"entityMap":{}},{"blocks":[{"key":"a25i9","text":"column","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":0,"length":6,"style":"ITALIC"}],"entityRanges":[],"data":{}}],"entityMap":{}},{"blocks":[{"key":"ej3lv","text":"table","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":0,"length":5,"style":"UNDERLINE"}],"entityRanges":[],"data":{}}],"entityMap":{}}],[{"blocks":[{"key":"f0qc0","text":"example","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":0,"length":7,"style":"SUBSCRIPT"}],"entityRanges":[],"data":{}}],"entityMap":{}},{"blocks":[{"key":"50s2o","text":"right","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":0,"length":5,"style":"SUPERSCRIPT"}],"entityRanges":[],"data":{}}],"entityMap":{}},{"blocks":[{"key":"escgd","text":"here","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":0,"length":4,"style":"STRIKETHROUGH"}],"entityRanges":[],"data":{}}],"entityMap":{}}]],"numRows":2,"numCols":3,"withHeader":false}}}}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
            '<table><tbody><tr><td><p><b>three</b></p></td><td><p><i>column</i></p></td><td><p><u>table</u></p></td></tr><tr><td><p><sub>example</sub></p></td><td><p><sup>right</sup></p></td><td><p><s>here</s></p></td></tr></tbody></table>'
        );
    });

    it('converts an image', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}},{"key":"fi1d","text":" ","type":"atomic","depth":0,"inlineStyleRanges":[],"entityRanges":[{"offset":0,"length":1,"key":0}],"data":{}},{"key":"60vvd","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{"0":{"type":"MEDIA","mutability":"MUTABLE","data":{"media":{"flags":{"marked_for_not_publication":false,"marked_for_sms":false,"marked_archived_only":false,"marked_for_legal":false},"language":"en","_updated":"2019-03-28T17:26:54+0000","description_text":"pin dec","source":"Superdesk","type":"picture","priority":6,"_current_version":2,"versioncreated":"2019-03-28T17:26:54+0000","task":{"stage":"5c374805149f116db6aae6ad","user":"5acb79292e03ed5d2a84bbd6","desk":"5c374805149f116db6aae6af"},"urgency":3,"alt_text":"pin alt","_created":"2019-03-28T17:26:53+0000","genre":[{"name":"Article (news)","qcode":"Article"}],"guid":"tag:localhost:5000:2019:9df37ab0-4d96-4f95-8da5-06b744ef8604","renditions":{"baseImage":{"width":933,"mimetype":"image/jpeg","href":"http://localhost:5000/api/upload-raw/5c9d03de149f116747b67317.jpg","media":"5c9d03de149f116747b67317","height":1400},"thumbnail":{"width":79,"mimetype":"image/jpeg","href":"http://localhost:5000/api/upload-raw/5c9d03de149f116747b67319.jpg","media":"5c9d03de149f116747b67319","height":120},"viewImage":{"width":426,"mimetype":"image/jpeg","href":"http://localhost:5000/api/upload-raw/5c9d03de149f116747b6731b.jpg","media":"5c9d03de149f116747b6731b","height":640},"original":{"width":3648,"mimetype":"image/jpeg","href":"http://localhost:5000/api/upload-raw/5c9d03dd149f116747b6730f.jpg","media":"5c9d03dd149f116747b6730f","height":5472}},"state":"in_progress","expiry":null,"byline":null,"headline":"A picture of pineapple","_etag":"a2c443900319548148e9073b9c5cc4c76c9331c5","_id":"urn:newsml:localhost:5000:2019-03-28T18:26:53.805271:f47e37fd-a6bd-4a5e-b91d-01b581f04e8c","_type":"archive","_links":{"self":{"title":"Archive","href":"archive/urn:newsml:localhost:5000:2019-03-28T18:26:53.805271:f47e37fd-a6bd-4a5e-b91d-01b581f04e8c"}},"_latest_version":2,"selected":false}}}}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
`<!-- EMBED START Image {id: "editor_0"} -->
<figure>
    <img src="http://localhost:5000/api/upload-raw/5c9d03dd149f116747b6730f.jpg" alt="pin alt" />
    <figcaption>pin dec</figcaption>
</figure>
<!-- EMBED END Image {id: "editor_0"} -->`
        );
    });

    it('converts unordered list', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of","type":"unordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}},{"key":"fgkp6","text":"Highlaws comes","type":"unordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"6g9h6","text":"from the Old English","type":"unordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"7v7b1","text":"hēah-hlāw","type":"unordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
`<ul>
  <li>The name of</li>
  <li>Highlaws comes</li>
  <li>from the Old English</li>
  <li>hēah-hlāw</li>
</ul>`
        );
    });

    it('converts an ordered list', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of","type":"ordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}},{"key":"fgkp6","text":"Highlaws comes","type":"ordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"6g9h6","text":"from the Old English","type":"ordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"7v7b1","text":"hēah-hlāw","type":"ordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
`<ol>
  <li>The name of</li>
  <li>Highlaws comes</li>
  <li>from the Old English</li>
  <li>hēah-hlāw</li>
</ol>`
        );
    });

    it('converts two different lists next to each other', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English","type":"ordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}},{"key":"6oe0d","text":"hēah-hlāw, meaning \"high mounds\". In the past, variant","type":"unordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"aegg","text":"spellings included Heelawes, Hielawes, Highlows,","type":"ordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"a1qv7","text":"Hielows, and Hylaws.","type":"ordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
`<ol>
  <li>The name of Highlaws comes from the Old English</li>
</ol>
<ul>
  <li>hēah-hlāw, meaning "high mounds". In the past, variant</li>
</ul>
<ol>
  <li>spellings included Heelawes, Hielawes, Highlows,</li>
  <li>Hielows, and Hylaws.</li>
</ol>`
        );
    });

    it('converts an embed', inject(() => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}},{"key":"2s495","text":" ","type":"atomic","depth":0,"inlineStyleRanges":[],"entityRanges":[{"offset":0,"length":1,"key":0}],"data":{}},{"key":"egj1u","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{"0":{"type":"EMBED","mutability":"MUTABLE","data":{"data":{"url":"https://www.youtube.com/watch?v=G5-KJgVsoUM","type":"video","version":"1.0","title":"Mother Mother - It's Alright","author":"MotherMotherVEVO","author_url":"https://www.youtube.com/channel/UCVzJrFuVWzf8mPiuV3o2_pQ","provider_name":"YouTube","description":"Music video by Mother Mother performing It's Alright. © 2019 Mother Mother Music Inc., under exclusive license to Universal Music Canada Inc.\n\nhttp://vevo.ly/V49vkg","thumbnail_url":"https://i.ytimg.com/vi/G5-KJgVsoUM/maxresdefault.jpg","thumbnail_width":1280,"thumbnail_height":720,"html":"<div><div style=\"left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.2493%;\"><iframe src=\"//cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DG5-KJgVsoUM&amp;key=87ca3314a9fa775b5c3a7726100694b0\" style=\"border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;\" allowfullscreen scrolling=\"no\" allow=\"autoplay; encrypted-media\"></iframe></div></div>","cache_age":86400}}}}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
            '<div class="embed-block"><div><div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.2493%;"><iframe src="//cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DG5-KJgVsoUM&amp;key=87ca3314a9fa775b5c3a7726100694b0" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen scrolling="no" allow="autoplay; encrypted-media"></iframe></div></div></div>'
        );
    }));

    it('converts nested inline styles', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English hēah-hlāw, meaning \"high mounds\". In the past, variant spellings included Heelawes, Hielawes, Highlows, Hielows, and Hylaws.","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":4,"length":43,"style":"BOLD"},{"offset":21,"length":5,"style":"UNDERLINE"},{"offset":32,"length":3,"style":"ITALIC"}],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}}],"entityMap":{}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
            '<p>The <b>name of Highlaws </b><u><b>comes</b></u><b> from </b><i><b>the</b></i><b> Old English</b> hēah-hlāw, meaning "high mounds". In the past, variant spellings included Heelawes, Hielawes, Highlows, Hielows, and Hylaws.</p>'
        );
    });

    it('converts overlapping inline styles', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English hēah-hlāw, meaning \"high mounds\". In the past, variant spellings included Heelawes, Hielawes, Highlows, Hielows, and Hylaws.","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":0,"length":66,"style":"BOLD"},{"offset":4,"length":89,"style":"ITALIC"},{"offset":27,"length":142,"style":"UNDERLINE"},{"offset":165,"length":5,"style":"SUPERSCRIPT"}],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{}}}],"entityMap":{}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
            '<p><b>The </b><i><b>name of Highlaws comes </b></i><u><i><b>from the Old English hēah-hlāw, meaning</b></i></u><u><i> "high mounds". In the past</i></u><u>, variant spellings included Heelawes, Hielawes, Highlows, Hielows, and </u><sup><u>Hyla</u></sup><sup>w</sup>s.</p>'
        );
    });

    it('converts inline styles overlapping with a links', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English hēah-hlāw, meaning \"high mounds\". In the past, variant spellings included Heelawes, Hielawes, Highlows, Hielows, and Hylaws.","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":12,"length":14,"style":"BOLD"},{"offset":55,"length":6,"style":"BOLD"},{"offset":48,"length":18,"style":"UNDERLINE"}],"entityRanges":[{"offset":21,"length":10,"key":0},{"offset":36,"length":21,"key":1}],"data":{"MULTIPLE_HIGHLIGHTS":{}}}],"entityMap":{"0":{"type":"LINK","mutability":"MUTABLE","data":{"link":{"href":"https://en.wikipedia.org/wiki/Highlaws"}}},"1":{"type":"LINK","mutability":"MUTABLE","data":{"link":{"href":"https://en.wikipedia.org/wiki/Highlaws"}}}}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
            '<p>The name of <b>Highlaws </b><a href="https://en.wikipedia.org/wiki/Highlaws"><b>comes</b> from</a> the <a href="https://en.wikipedia.org/wiki/Highlaws">Old English <u>hēah-hl</u><u><b>āw</b></u></a><u><b>, me</b></u><u>aning</u> "high mounds". In the past, variant spellings included Heelawes, Hielawes, Highlows, Hielows, and Hylaws.</p>'
        );
    });

    it('converts an attachement', () => {
        const rawContentState: any = {"blocks":[{"key":"fcbn3","text":"The name of Highlaws comes from the Old English hēah-hlāw, meaning \"high mounds\".","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[{"offset":12,"length":8,"key":0}],"data":{"MULTIPLE_HIGHLIGHTS":{}}}],"entityMap":{"0":{"type":"LINK","mutability":"MUTABLE","data":{"link":{"attachment":"5c9dd26d149f114c61d84db0"}}}}};

        expect(editor3StateToHtml(convertFromRaw(rawContentState))).toBe(
            '<p>The name of <a data-attachment="5c9dd26d149f114c61d84db0">Highlaws</a> comes from the Old English hēah-hlāw, meaning "high mounds".</p>'
        );
    });
});

describe('core.editor3.html.to-html', () => {
    it('should correctly parse lists', () => {
        const contentState = testUtils.blocksWithText([
            // style, depth, text
            ['unordered-list-item', 0, '1'],
            ['unordered-list-item', 0, '2'],
            ['unordered-list-item', 1, '11'],
            ['unordered-list-item', 1, '22'],
            ['unordered-list-item', 1, '3'],
            ['unordered-list-item', 2, '4'],
            ['unordered-list-item', 2, '5'],
            ['unordered-list-item', 3, '6'],
            ['unordered-list-item', 3, '6.5'],
            ['unordered-list-item', 2, 'x'],
            ['unordered-list-item', 1, '7'],
            ['unordered-list-item', 1, '33'],
            ['unordered-list-item', 0, '8'],
        ]);

        const result = editor3StateToHtml(contentState);

        expect(result).toBe(
`<ul>
  <li>1</li>
  <li>2
    <ul>
      <li>11</li>
      <li>22</li>
      <li>3
        <ul>
          <li>4</li>
          <li>5
            <ul>
              <li>6</li>
              <li>6.5</li>
            </ul>
          </li>
          <li>x</li>
        </ul>
      </li>
      <li>7</li>
      <li>33</li>
    </ul>
  </li>
  <li>8</li>
</ul>`
        );
    });

    it('should correctly parse abruptly ending lists', () => {
        const contentState = testUtils.blocksWithText([
            // style, depth, text
            ['unordered-list-item', 0, '1'],
            ['unordered-list-item', 1, '2'],
            ['unordered-list-item', 2, '3'],
            ['unordered-list-item', 3, '4'],
            ['unstyled', 0, 'abc'],
        ]);

        const result = editor3StateToHtml(contentState);

        expect(result).toBe(
`<ul>
  <li>1
    <ul>
      <li>2
        <ul>
          <li>3
            <ul>
              <li>4</li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </li>
</ul>
<p>abc</p>`
        );
    });

    it('should add anotation to HTML', () => {
        const rawContentState: any = {
            entityMap: {},
            blocks: [{
                inlineStyleRanges: [{
                    length: 5,
                    style: 'ANNOTATION-1',
                    offset: 6,
                }, {
                    length: 5,
                    style: 'ANNOTATION-2',
                    offset: 12,
                }],
                data: {
                    MULTIPLE_HIGHLIGHTS: {
                        lastHighlightIds: {ANNOTATION: 2},
                        highlightsData: {
                            'ANNOTATION-1': {
                                data: {
                                    email: 'admin@admin.ro',
                                    date: '2018-03-30T14:57:53.172Z',
                                    msg: '{"blocks":[{"key":"ejm11","text":"Annotation 1","type":"unstyled",' +
                                        '"depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],' +
                                        '"entityMap":{}}',
                                    author: 'admin',
                                    annotationType: 'regular',
                                },
                                type: 'ANNOTATION',
                            },
                            'ANNOTATION-2': {
                                data: {
                                    email: 'admin@admin.ro',
                                    date: '2018-03-30T14:58:20.876Z',
                                    msg: '{"blocks":[{"key":"9i73f","text":"Annotation 2","type":"unstyled",' +
                                        '"depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},' +
                                        '{"key":"d3vb3","text":"Line 2","type":"unstyled","depth":0,' +
                                        '"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
                                    author: 'admin',
                                    annotationType: 'regular',
                                },
                                type: 'ANNOTATION',
                            },
                        },
                    },
                },
                text: 'lorem ipsum dolor',
                type: 'unstyled',
                depth: 0,
                key: '2sso6',
                entityRanges: [],
            }],
        };
        const result = editor3StateToHtml(getInitialContent({editorState: rawContentState}));

        expect(result).toBe('<p>lorem <span annotation-id="1">ipsum</span> <span annotation-id="2">dolor</span></p>');
    });
});

describe('core.editor3.html.to-html.AtomicBlockParser', () => {
    it('should correctly parse embeds', () => {
        const {block, contentState} = testUtils.embedBlockAndContent();
        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<div class="embed-block"><h1>Embed Title</h1></div>');
    });

    it('should correctly parse images', () => {
        const {block, contentState} = testUtils.imageBlockAndContent();
        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe(
`<!-- EMBED START Image {id: "editor_0"} -->
<figure>
    <img src="image_href" alt="image_alt_text" />
    <figcaption>image_description</figcaption>
</figure>
<!-- EMBED END Image {id: "editor_0"} -->`);
    });

    it('should correctly parse images without alt and description', () => {
        const {block, contentState} = testUtils.createBlockAndContent('MEDIA', {
            media: {renditions: {original: {href: 'image_href'}}},
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe(
`<!-- EMBED START Image {id: "editor_0"} -->
<figure>
    <img src="image_href" alt="" />
</figure>
<!-- EMBED END Image {id: "editor_0"} -->`
        );
    });

    it('should correctly parse tables', () => {
        const cs = (txt) => convertToRaw(ContentState.createFromText(txt));
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 2,
                cells: [
                    [cs('a'), undefined, cs('c')],
                    [cs('d'), cs('e'), cs('f')],
                ],
            },
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><tbody><tr><td><p>a</p></td><td></td><td><p>c</p></td></tr>' +
            '<tr><td><p>d</p></td><td><p>e</p></td><td><p>f</p></td></tr></tbody></table>');
    });

    it('should correctly parse single row tables', () => {
        const cs = (txt) => convertToRaw(ContentState.createFromText(txt));
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 1,
                cells: [[cs('a'), cs('b'), cs('c')]],
            },
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><tbody><tr><td><p>a</p></td><td><p>b</p></td><td><p>c</p></td></tr></tbody></table>');
    });

    it('should correctly parse tables with headers', () => {
        const cs = (txt) => convertToRaw(ContentState.createFromText(txt));
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 3,
                withHeader: true,
                cells: [
                    [cs('a'), undefined, cs('c')],
                    [cs('d'), cs('e'), cs('f')],
                    [cs('g'), cs('h'), cs('i')],
                ],
            },
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><thead><tr><th><p>a</p></th><th></th><th><p>c</p></th></tr></thead>' +
            '<tbody><tr><td><p>d</p></td><td><p>e</p></td><td><p>f</p></td></tr>' +
            '<tr><td><p>g</p></td><td><p>h</p></td><td><p>i</p></td></tr></tbody></table>');
    });

    it('should correctly parse single row tables with headers', () => {
        const cs = (txt) => convertToRaw(ContentState.createFromText(txt));
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 1,
                withHeader: true,
                cells: [[cs('a'), cs('b'), cs('c')]],
            },
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><thead><tr><th><p>a</p></th><th><p>b</p></th><th><p>c</p></th></tr></thead></table>');
    });

    it('should correctly parse empty tables', () => {
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 2,
                cells: [],
            },
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><tbody><tr><td></td><td></td><td></td></tr>' +
            '<tr><td></td><td></td><td></td></tr></tbody></table>');
    });
});
