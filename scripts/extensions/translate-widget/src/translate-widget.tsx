import * as React from "react";
import { ISuperdesk, IArticle } from "superdesk-api";
import { Input, Button, RadioButtonGroup } from "superdesk-ui-framework/react";

export const getTranslateWidgetComponent = (
  superdesk: ISuperdesk,
  label: string
) => {
  console.log("Translate widget activated with label:", label);
  interface TranslatingWidgetProps {
    article: IArticle; // Ensure this matches the IArticle interface
  }

  interface IState {
    isTranslateClicked: boolean;
}

  const articleText = {
    "english": {
        "headline": "Canada Ukraine",
        "extendedHeadline": "Canada & Ukraine relations",
        "body": "As the world prepares to mark the anniversary of the Russian invasion of Ukraine, Canadian support for sending the embattled nation more ammunition and military supplies has grown since last fall, a new Leger poll suggests. Saturday will herald two full years since Russia launched a full-scale invasion and plunged the country into a grinding, brutal war. The federal Liberal government has vowed to stand with Ukraine for as long as it takes. But as the conflict has dragged on, it has grown into a domestic political flashpoint in both Canada and the United States. The Canadians I speak to from coast to coast to coast are still unequivocal that we need to be there for Ukraine, Prime Minister Justin Trudeau told a news conference Thursday in Nova Scotia. We are working with partners around the world to make sure we're sending more military equipment, whatever we can, and continue to purchase more on the world markets to send to Ukraine.One in four respondents to the online survey conducted last weekend for The Canadian Press said Canada should be sending Ukraine even more military supplies. Just 20 per cent said the same in a comparable survey in October. Still, Canadians appear divided on just how much is too much.The latest survey found 23 per cent of respondents said they believe Canada should send fewer munitions to Ukraine, while 34 per cent said they want to see material support levels remain the same. As for money,38 per cent said Canada should maintain the same level of spending, while 31 per cent said the government should spend less. Only 16 per cent said they want spending levels increased. To date, Canada has committed more than $9 billion in overall aid to Ukraine, Trudeau said. A significant majority of people polled, about 60 per cent, said they see no prospects for peace any time soon and fear the war could drag on for several years. Another 33 per cent predicted two more years of conflict. The survey polled some 1,529 Canadian adults Feb. 16-18. Online surveys cannot be assigned a margin of error because they do not randomly sample the population.Earlier this week, Defence Minister Bill Blair said Canada would send more than 800 drones to Ukraine beginning this spring, a $95-million portion of the government's existing $500-million military aid package.All the while, the conflict has become a popular domestic talking point for both the Liberal government and their Opposition Conservative rivals. The Conservatives accuse the government of failing Ukraine and want Trudeau to deliver more lethal supplies. Canada has promised billions in military support, but not all of it has actually materialized.For their part, the Liberals accuse the Opposition of abandoning Ukraine by voting against a modernized Canada-Ukraine free trade agreement — a deal the Tories opposed because it included a carbon price. Canada had been united in its commitment to Ukraine until the Conservatives decided to vote against the agreement, Trudeau complained Thursday. When it comes to humanitarian support, respondents to the Leger poll were less polarized. Some 41 per cent said Canada should maintain its current levels of aid, while 28 per cent supported an increase. Only 15 per cent of people said Canada should send less humanitarian aid. Since the invasion in 2022, Leger's surveys suggest fewer Canadians feel the conflict has the potential to develop into a world war, though 58 per cent of respondents still fear that possibility. Three-quarters of respondents feared a global conflict could be in the offing in March 2022, an earlier Leger poll showed.As for which country will win the war,47 per cent of respondents in the latest survey said they didn't know. The rest were divided, with 28 per cent expecting Ukraine to defeat the invading force and 25 per cent saying Russia.This report by The Canadian Press was first published Feb. 22, 2024."
    },
    "french": {
        "headline": "Canada Ukraine",
        "extendedHeadline": "Relations entre le Canada et l'Ukraine",
        "body": "Alors que le monde se prépare à marquer l'anniversaire de l'invasion russe de l'Ukraine, le soutien du Canada à l'envoi de munitions et de fournitures militaires supplémentaires à ce pays en guerre s'est accru depuis l'automne dernier, suggère un nouveau sondage Léger. Samedi marquera deux années complètes depuis que la Russie a lancé une invasion à grande échelle et plongé le pays dans une guerre acharnée et brutale. Le gouvernement libéral fédéral s'est engagé à soutenir l'Ukraine aussi longtemps qu'il le faudra. Mais à mesure que le conflit s'éternise, il est devenu un point d'éclair politique au Canada et aux États-Unis. Les Canadiens avec qui je parle d'un océan à l'autre sont toujours sans équivoque sur le fait que nous devons être là pour l'Ukraine, a déclaré le premier ministre Justin Trudeau lors d'une conférence de presse jeudi en Nouvelle-Écosse. Nous travaillons avec des partenaires du monde entier pour nous assurer que nous envoyons davantage d'équipements militaires, autant que possible, et que nous continuons à en acheter davantage sur les marchés mondiaux pour les envoyer en Ukraine. Un répondant sur quatre au sondage en ligne mené le week-end dernier pour La Presse Canadienne a déclaré que le Canada devrait envoyer encore plus de fournitures militaires à l'Ukraine. Seulement 20 pour cent ont déclaré la même chose lors d'une enquête comparable réalisée en octobre. Pourtant, les Canadiens semblent divisés sur la question de savoir à quel point c'est trop. Le dernier sondage révèle que 23 pour cent des personnes interrogées estiment que le Canada devrait envoyer moins de munitions à l'Ukraine, tandis que 34 pour cent souhaitent que les niveaux de soutien matériel restent les mêmes. Quant à l'argent, 38 pour cent ont déclaré que le Canada devrait maintenir le même niveau de dépenses, tandis que 31 pour cent ont déclaré que le gouvernement devrait dépenser moins. Seulement 16 pour cent ont déclaré souhaiter une augmentation des niveaux de dépenses. À ce jour, le Canada a engagé plus de 9 milliards de dollars en aide globale à l'Ukraine, a déclaré Trudeau. Une grande majorité des personnes interrogées, environ 60 pour cent, ont déclaré qu'elles ne voyaient aucune perspective de paix dans un avenir proche et craignaient que la guerre ne s'éternise pendant plusieurs années. 33 pour cent prédisent encore deux années de conflit. L'enquête a été menée auprès de quelque 1 529 adultes canadiens du 16 au 18 février. Les enquêtes en ligne ne peuvent pas se voir attribuer une marge d'erreur car elles ne échantillonnent pas la population de manière aléatoire. Plus tôt cette semaine, le ministre de la Défense, Bill Blair, a déclaré que le Canada enverrait plus de 800 drones en Ukraine à partir du printemps, ce qui représente une part de 95 millions de dollars du programme d'aide militaire actuel de 500 millions de dollars du gouvernement. Pendant ce temps, le conflit est devenu un sujet de discussion national populaire tant pour le gouvernement libéral que pour ses rivaux de l'opposition conservatrice. Les conservateurs accusent le gouvernement d'avoir laissé tomber l'Ukraine et veulent que Trudeau livre davantage de fournitures mortelles. Le Canada a promis des milliards de dollars en soutien militaire, mais tout cela ne s'est pas concrétisé. De leur côté, les libéraux accusent l'opposition d'avoir « abandonné » l'Ukraine en votant contre un accord de libre-échange modernisé entre le Canada et l'Ukraine — un accord auquel les conservateurs se sont opposés parce qu'il prévoyait un prix sur le carbone. Le Canada était uni dans son engagement envers l'Ukraine jusqu'à ce que les conservateurs décident de voter contre l'accord, a déploré Trudeau jeudi. En ce qui concerne le soutien humanitaire, les répondants au sondage Léger sont moins polarisés. Quelque 41 pour cent ont déclaré que le Canada devrait maintenir ses niveaux d'aide actuels, tandis que 28 pour cent étaient favorables à une augmentation. Seulement 15 pour cent des personnes interrogées ont déclaré que le Canada devrait envoyer moins d'aide humanitaire. Depuis l'invasion de 2022, les sondages de Léger suggèrent que moins de Canadiens pensent que le conflit pourrait se transformer en guerre mondiale, même si 58 pour cent des répondants craignent toujours cette possibilité. Les trois quarts des personnes interrogées craignent qu'un conflit mondial ne survienne en mars 2022, selon un précédent sondage Léger. Quant à savoir quel pays gagnera la guerre, 47 pour cent des personnes interrogées lors de la dernière enquête ont déclaré ne pas le savoir. Les autres étaient divisés, 28 pour cent s'attendant à ce que l'Ukraine batte la force d'invasion et 25 pour cent pensaient que la Russie. Ce rapport de La Presse Canadienne a été publié pour la première fois le 22 février 2024."
    }
}

  return class TranslatingWidget extends React.PureComponent<
    TranslatingWidgetProps,
    IState
  > {

    constructor(props: TranslatingWidgetProps) {
      console.log("superdesk:", superdesk);
      super(props);
      this.state = {
        isTranslateClicked: false,
    };

    this.handleTranslateClick = this.handleTranslateClick.bind(this)
    }

    handleTranslateClick() {
      console.log("button clicked")
      this.setState({isTranslateClicked: true})
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
                  <textarea
                    id="bodyHtml"
                    value={articleText.english.body}
                    disabled
                    style={{
                      border: 'none',
                      borderBottom: '1px solid rgba(204, 204, 204, 0.3)',
                      borderTopLeftRadius: '2px',
                      borderTopRightRadius: '2px',
                      padding: '0.8rem',
                      fontSize: '16px',
                      outline: 'none',
                      overflow: 'auto',
                      width: '100%',
                      height: '100%',
                      resize: 'none',
                      background: 'rgba(111, 125, 144, 0.06)',
                    }}
                  />
                </div>
              </section>
              <Button
                text="Translate Article"
                type="primary"
                expand={true}
                onClick={this.handleTranslateClick}
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
                  value={this.state.isTranslateClicked ? articleText.french.headline : ""}
                  type="text"
                  onChange={() => false}
                />
                <Input
                  label="Translated Extended Headline"
                  value={this.state.isTranslateClicked ? articleText.french.extendedHeadline : ""}
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
                  <textarea
                    id="translatedBodyHtml"
                    value={this.state.isTranslateClicked ? articleText.french.body : ''}
                    style={{
                      border: 'none',
                      borderBottom: '1px solid rgba(204, 204, 204, 0.3)',
                      borderTopLeftRadius: '2px',
                      borderTopRightRadius: '2px',
                      padding: '0.8rem',
                      fontSize: '16px',
                      outline: 'none',
                      overflow: 'auto',
                      width: '100%',
                      height: '100%',
                      resize: 'none',
                      background: 'rgba(111, 125, 144, 0.06)',
                    }}
                  />
                </div>
              </section>
              { this.state.isTranslateClicked ?
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

