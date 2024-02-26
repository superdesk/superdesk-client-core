import * as React from "react";
import { ISuperdesk, IArticle } from "superdesk-api";
import { Input, Button, RadioButtonGroup } from "superdesk-ui-framework/react";
import articleText from './articleText.json';

export const getTranslateWidgetComponent = (
  superdesk: ISuperdesk,
  label: string
) => {
  console.log("Translate widget activated with label:", label);
  interface TranslatingWidgetProps {
    article: IArticle; // Ensure this matches the IArticle interface
  }
  const [isTranslateClicked, setIsTranslateClicked] = useState(false);

  function handleTranslateClick() {
    setIsTranslateClicked(true)
  }
  return class TranslatingWidget extends React.PureComponent<
    TranslatingWidgetProps,
    any
  > {
    constructor(props: TranslatingWidgetProps) {
      console.log("superdesk:", superdesk);
      super(props);
    }

    render() {
      return (
        <div className="translate-widget" style={{width: '95%', margin: '0', height: '100%'}}>
          <header className="header" style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: '24px', paddingBottom: '12px', marginTop: '16px', borderBottom: '1px solid #ddd'}}>
            <h1 style={{margin: '0', fontSize: '24px', fontWeight: 400, color: '#4d4d4d'}}>Translate Widget</h1>
          </header>
          <div className="columns" style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', height: '90%'}}>
            <div className="input-column" style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', padding: '16px', gap: '32px', height: '100%', borderRight: '1px solid #ddd'}}>
              <section className="language-selection">
                <RadioButtonGroup
                  group={{ groupLabel: "Input Languages" }}
                  options={[
                    { value: "en", label: "English" },
                    { value: "fr", label: "French" },
                    { value: "sp", label: "Spanish" },
                  ]}
                  value="en"
                  onChange={() => false}
                />
              </section>
              <section className="input-section" style={{display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: '75vh'}}>
                <Input
                  label="Headline"
                  value={articleText.english.headline}
                  type="text"
                  disabled={true}
                  onChange={() => false}
                />
                <Input
                  label="Extended Headline"
                  value={articleText.english.extendedHeadline}
                  type="text"
                  disabled={true}
                  onChange={() => false}
                />
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1', overflow: 'auto'}}>
                  <label 
                    htmlFor="bodyHtml" 
                    style={{ 
                      marginBottom: '5px', 
                      color: 'rgb(100, 113, 130, 0.5)', 
                      fontSize: '1.1rem', 
                      textTransform: 'uppercase', 
                      fontWeight: 500, 
                      letterSpacing: '0.08em', 
                      position: 'relative', 
                      minHeight: '1.6rem', 
                      lineHeight: '100%', 
                      margin: 0,
                      display: 'inline-flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'flex-start' 
                    }}
                  >
                    BODY HTML
                  </label>
                  <input 
                    type="text" 
                    id="bodyHtml"
                    value={articleText.english.body}
                    style={{
                      border: 'none',
                      borderBottom: '1px solid rgb(204, 204, 204, 0.3)',
                      borderTopLeftRadius: '2px',
                      borderTopRightRadius: '2px',
                      padding: '0 0.8rem',
                      fontSize: '16px',
                      outline: 'none',
                      flex: '1',
                      overflow: 'auto',
                      width: '100%',
                      display: 'block',
                      position: 'relative', 
                      background: 'rgb(111, 125, 144,6%)'
                    }}
                    disabled
                  />
                </div>
              </section>
              <Button
                text="Translate Article"
                type="primary"
                expand={true}
                onClick={handleTranslateClick}
              />
            </div>
            <div className="output-column" style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', padding: '16px', paddingRight: '0', gap: '32px', height: '94%'}}>
              <section className="language-selection" style={{marginLeft: '8px'}}>
                <RadioButtonGroup
                  group={{ groupLabel: "Output Languages" }}
                  options={[
                    { value: "en", label: "English" },
                    { value: "fr", label: "French" },
                    { value: "sp", label: "Spanish" },
                  ]}
                  value="fr"
                  onChange={() => false}
                />
              </section>
              <section className="output-section" style={{display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: '75vh', paddingLeft: '8px'}}>
                <Input
                  label=" Translated Headline"
                  value={isTranslateClicked ? articleText.french.headline : ""}
                  type="text"
                  onChange={() => false}
                />
                <Input
                  label="Translated Extended Headline"
                  value={isTranslateClicked ? articleText.french.extendedHeadline : ""}
                  type="text"
                  onChange={() => false}
                />
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1', overflow: 'auto'}}>
                  <label 
                    htmlFor="translatedBodyHtml" 
                    style={{ 
                      marginBottom: '5px', 
                      color: '#647182', 
                      fontSize: '1.1rem', 
                      textTransform: 'uppercase', 
                      fontWeight: 500, 
                      letterSpacing: '0.08em', 
                      position: 'relative', 
                      minHeight: '1.6rem', 
                      lineHeight: '100%', 
                      margin: 0,
                      display: 'inline-flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'flex-start' 
                    }}
                  >
                    TRANSLATED BODY HTML
                  </label>
                  <input 
                    type="text" 
                    id="translatedBodyHtml"
                    value={isTranslateClicked ? articleText.french.body : ''}
                    style={{
                      border: 'none',
                      borderBottom: '1px dotted rgba(22, 25, 29, 0.2)',
                      borderTopLeftRadius: '2px',
                      borderTopRightRadius: '2px',
                      padding: '0 0.8rem',
                      fontSize: '16px',
                      outline: 'none',
                      flex: '1',
                      overflow: 'auto',
                      width: '100%',
                      display: 'block',
                      position: 'relative', 
                      background: 'rgb(111, 125, 144,6%)'
                    }}
                  />
                </div>
              </section>
              { isTranslateClicked ?
              <Button
              text="Replace Article"
              type="primary"
              expand={true}
              onClick={()=> true}
            /> : ''}
            </div>
          </div>
        </div>
      );
    }
  };
};
function useState(arg0: boolean): [any, any] {
  throw new Error("Function not implemented.");
}

