** En cours de rédaction, sujet à de fort changement **

*WidgetSDK* n'est pas un widget pour Grist mais une bibliothèque qui permet de simplifier le développement de nouveaux widgets pour Grist. L'objectif est de minimiser les copier/coller de code entre les widgets et de simplifier l'accès à des fonctionnalités avancées.

# Fonctionnalités
* Gestion simplifiée de l'encodage des données (notamment des références) en lecture et en écriture.
* Accès simple au métadonnées des colonnes des tableaux (de quel type, quelle est la liste des choix, les options associées...).
* Fournir une interface utilisateur pour la configuration du widget, configurable avec un simple objet.
* Gestion des timings de chargement pour s'assurer du bon ordonnancement des dépendances, i.e. qu'une donnée est bien disponible au moment où on en a besoin.
* Localisation par défaut des widgets avec une possibilité, directement dans le widget, de proposer sa propre traduction.

# Avantages
* Un code plus clair et facile à lire côté widget
* Moins de code côté widget, 
* Accès à des fonctionnalités avancées de Grist qui ne sont pas forcément bien documentées
* Un code plus facile à maintenir et à faire évoluer car dans une bibliothèque commune
* La localisation par défaut

# Installation 
Le plus simple est de copier le dossier *template* disponible sur ce même dépôt, car il contient :
* Un *index.html* qui chargera les bons scripts
* Un *widget.js* qui contient le script du widget préconfiguré avec de nombreux commentaires pour guider le développeur
* (*optionnel*) La possibilité de compiler le widget via *pnpm* pour en obtenir une version minifiée.

Pour plus de détails, voir le README présent dans le template.

Pour une installation sans le template, il faut :
1. Inclure dans le header de votre *index.html* :
```HTML
<script src="https://varamil.github.io/grist-widget/widgetSDK/min/widgetSDK.umd.js"></script>
<link rel="stylesheet" href="https://varamil.github.io/grist-widget/widgetSDK/min/widgetSDK.css">
```
2. *Optionnel* avoir un `<div>` avec un `id` qui servira pour injecter l'interface utilisateur pour la configuration du widget
3. Dans votre script, créer un objet `WidgetSDK`, puis configurer les différents modules

Encore une fois, le template est le meilleur des exemples. Un autre bon exemple d'utilisation, est le widget [Kanban2](https://github.com/Varamil/grist-widget/tree/main/kanban2).

# Détails de la bibliothèque
Dans les paragraphes qui suivent, on considère que `W = new WidgetSDK()` et contient l'objet principal du SDK.

## La localisation
### Initialisation
Une fois l'object créé, vous pouvez activer la gestion de la localisation avec une ligne de code du type:
```JavaScript
    T = await W.loadTranslations(['widget.js']);
```
où `T` est une variable globale, qui contiendra la fonction à appeler à chaque fois qu'un texte doit être traduit. 

Il est conseillé d'`await` la fonction, pour s'assurer que la localisation est bien chargée avant de passer aux autres configurations (qui vont utiliser cette localisation). 

Ensuite, la fonction `loadTranslations` peut prendre 3 arguments:
1. *stripts* (`Array<string>`) : tableau qui contient la liste des scripts à analyser pour extraire les textes à traduire. Le moment venu le widget viendra charger ces fichiers à la recherche de fonctions `T('texte à traduire')`.
2. *langue* (`string`) : *optionnel*, langue par défaut des textes employés par le widget. Si cette langue est celle de l'utilisateur, alors les textes ne seront pas traduit, sinon la bibliothèque essaiera de charger le fichier de langue. La valeur doit être au format ISO à deux lettres. Par défaut, défini à `en`.
3. *json* (`string|Object`) : *optionnel*, permet fournir directement soit le chemin vers le fichier de langue à utiliser, soit directement l'objet qui contient les traductions.

### Utiliser la localisation 
Ensuite dans le widget, pour chaque texte qui sera affiché à l'utilisateur, il faudra appeler la fonction `T`, ***même si le développeur ne prévoit pas de faire de localisation***. En effet, la bibliothèque propose automatiquement aux utilisateurs de pouvoir faire leur propre traduction, mais pour qu'elle sache quels textes doivent être traduit (et pour qu'ils le soient), il faut que la fonction `T` soit utilisée.

Pour un texte simple « *par exemple* » il suffit d'utiliser simplement `T('par exemple')` dans votre code. À noter que les trois types de guillemets sont pris en charge (`'`, `"` et `` ` ``).

Noter également que pour `W.configureOptions()` et `W.ready()` il ne faut pas utiliser la fonction `T` dans les textes qui sont passés à ces fonctions. En effet, comme ces fonctions utilisent des objets bien définis, la bibliothèque sait quels sont les éléments à traduire. 

Si jamais le texte à traduire doit contenir des valeurs dynamiques, vous pouvez utiliser dans le texte des mots commençant par `%` pour indiquer leur valeur dans le second argument de la fonction `T`.

Ainsi, vous pouvez utiliser `T('Bonjour %nom !', {nom:MaVariableNom})`, où `%nom` va être emplacée par la valeur de `MaVariableNom`. 

### Les fichiers de localisation
Par défaut, la bibliothèque va chercher dans le dossier *i18n* situé dans le même dossier que le script principal. Ensuite, en fonction de la langue, elle va chercher un fichier nommé *xx.json* où *xx* est la langue au format ISO à deux lettres (en, fr, de, es...).

Le troisième argument de la fonction `loadTranslations` peut être utilisé pour écraser ce comportement.

Au niveau des fichiers et de leur contenu, ce sont de simple JSON où chaque clée correspond au texte original et chaque valeur correspond à la traduction dans la langue associée au fichier.

Il faut biensûr intégrer les `%` pour l'intégration des valeur dynamiques. 

## Les métadonnées des colonnes
Il suffi d'appeler la fonction `W.initMetaData()` pour initier la collecte des information auprès de Grist.

Ensuite, dans l'objet `W`, les propriétées suivantes sont disponibles:
* *meta* : contient toutes les métadonnées brutes de colonnes de tous les tableaux du document Grist, sert principalement quand il y a des réfrences entre tableaux. 
* *col* : contient toutes les métadonnées des colonnes du tableau auquel le widget est rattaché. C'est une sorte de filtre sur `meta`, et chaque colonne est accessible via son *id* (`W.col.MaColonne` pour accéder aux métadonnées de la colonne dont l'id Grist est *MaColonne*).
* *map* : contient la correspondance entre les noms définis dans `ready` et ceux de déinis dans la table. Correspond à l'objet `mappings` fourni par les fonctions `onRecord` et `onRecords`. Permet d'y accéder facilement. Se référer à la documentation Grist pour l'utilisation de cet objet.

À noter que `meta` existe dès l'initialisation (même si les métadonnées ne sont pas encore disponibles), alors que `col` n'est défini qu'une fois l'API Grist chargée.

### `W.meta`
C'est un objet à utiliser plutôt si vous avez besoin d'informations relatives à d'autres tables que celle ratachée à votre widget. Sinon il vaut mieux utiliser `W.col` qui sera plus adapté (se repporter au paragraphe suivant pour plus de détails).

La fonction la plus utile est `async getColMeta(colId)` qui permet d'obtenir un objet de type `ColMeta` qui permet d'accéder facilement aux métadonnées de la colonne dont l'id est *colId*. Se repporter au paragraphe suivant pour plus de détail sur l'object retourné.

Un peu plus général, la fonction `async getMeta(tableID=null)` permet de soit récupérer toutes métadonnées de la table en cours (si `tableID` n'est pas fourni), ou de la table spécifiée. Retourne un object du même type que `W.col`, se repporter au paragraphe suivant pour plus de détail.

L'autre fonction qui peut être utile est `isLoaded()` qui retourne un booléen indiquant si les métadonnées ont fini d'être chargées. 

### `W.col`

C'est un objet dont chaque propriété est un objet de type `ColMeta` correspondant à chacune des colonnes du tableau associées au widget. Les propriétés sont nommées selon les id des colonnes. Ainsi `W.col.MaColonne` permet d'accéder aux métadonnées de la colonne dont l'id Grist est *MaColonne* (sans le $).

Notez également que pour les colonnes de type *Référence* ou *Référence multiples*, la propriété `W.col.MaColonne_id` est également disponible et permet d'accéder au ids des références là où `W.col.MaColonne` contient les valeurs.

Chaque objet de type `ColMeta` contient les propriétées d'origine fournies par Grist, mais aussi plusieurs fonctions qui facilite l'accès:
* `getColor(ref)` : Pour une colonne de *Choix*, permet d'obtenir la couleur de fond du choix *ref*.
* `getTextColor(ref)` : comme `getColor`, mais retourne la couleur du texte.
* `getIsFormula()` : retourn vrai si la colonne est de type formule ET s'il y a une formule de définie.
* `async getChoices()` : permet d'obtenir les liste des choix possibles pour la colonne. La fonction est asynchrone car si les choix sont des références il faut pouvoir récupérer les valeurs associées. Pour les colonnes de type *Choix*, les valeurs retournées peuvent être directement utilisées par `getColor` et `getTextColor`.
* `async parse(value)` : permet de convertir une valeur fournie par Grist en son équivalent tel que l'utilisateur la voit dans le navigateur. Gère les différents types d'encodage et les références.
* `async encode(value)` : fait l'inverse de `parse`, retourne une valeur telle qu'elle soit conpréhensible par Grist.

## Les options pour le widget
Grist offrent uniquement des options pour définir la correspondance entre les colonnes d'un tableau et l'usage que va en faire le widget. Mais il est souvent utile de proposer à l'utilisateur d'autres options, pour personnaliser son expérience.

Néanmoins, au final c'est souvent beaucoup de code pour générer le formulaire de configuration, parfois pour juste quelques options, et on se retrouve vite à faire la même choses dans chacun des widgets que l'on développe.

L'idée est de générer le formulaire de configuration à partir d'une simple configuration et d'accéder aux options choisis par l'utilisateur au moyen d'un simple objet.

### Initialisation des options
Pour définir les options disponibles et gérer l'accès de l'utilisateur à celles-ci, il faut utiliser la fonction suivante:
```JavaScript
W.configureOptions(
        [
            // Tableau dont chaque élément est une option 
        ], 
        '#config-view', // élément DOM ou ID où insérer l'interface des options
        '#main-view', // élément DOM ou ID où le widget est encapsulé, utilisé pour le cacher quand les options sont affichées
        {onOptChange:optionsChanged} //souscription aux évènements, onOptLoad also available
    );
```

Le premier argument est un tableau où chaque élément défini une option. Les détails sont présentés au paragraphe suivant. 

Le second argument est soit directement un élément du DOM où insérer le formulaire utilisateur, soit l'id d'une balise HTML. 

Le troisième argument, suit la même logique, mais permet de gérer l'affichage ou non du widget (afin d'afficher le formulaire d'option). Il faut donc que tout le code HTML du widget soit contenu dans l'élement indiqué ici.

Le dernier argument est un objet qui permet d'indiquer les callback à utiliser quand certains évènements surviennent. Pour l'instant:
* *onOptChange* : déclenché dès que l'utilisateuer applique de nouvelles options
* *onOptLoad* : déclenché quand les options ont fini d'être chargées lors de l'initialisation de Grist.

### Configurtion d'une option

Pour les options les plus simples, la fonction statique 
```JavaScript
WidgetSDK.newItem('option_id', default_value, 'title',  'subtitle', 'group')
``` 
suffie à définir une option :
* *option_id* : l'identifiant de l'option, c'est ce qui servira à accéder à sa valeur. Doit être une chaîne alpha numérique unique parmis toutes les options.
* *default_value* : n'importe quelle valeur, est en premier lieu utilisée comme valeur par défaut tant que l'utilisateur ne la change pas. En second lieu, est utilisée pour définir le type de champ qui sera proposé à l'utilisateur dans le formulaire.
* *title* : un titre (court) qui sera affiché en face de l'option
* *subtitle* : une description (brève) qui sera affichée en face de l'option
* *group* : un titre pour le groupe auquel sera rattachée l'option. Doit être commun à plusieurs options.

***Remarque*** : ne pas utiliser la fonction `T` pour *title*, *subtitle* et *group*, la bibliothèque sait que ce sont des textes à traduire, donc elle le gère automatiquement.  

Pour des cas plus complexes, un élément du tableau peut être un objet avec les propriétées suivantes:
* *id* : obligatoire, l'identifiant de l'option, c'est ce qui servira à accéder à sa valeur. Doit être une chaîne alpha numérique unique parmis toutes les options.
* *default* : recommandé, la valeur qui sera associée à l'option par défaut. Est utilisée pour définir le *type* si celui n'est pas explicitement fourni.
* *title*: recommandé, un titre (court) qui sera affiché en face de l'option.
* *subtitle* : recommandé, une description (brève) qui sera affichée en face de l'option.
* *description* : optionnel, une description (longue) que l'utilisateur pourra afficher pour avoir plus de détails sur l'utilisation de l'option par le widget
* *group* : recommandé, un titre pour le groupe auquel sera rattaché l'option. Doit être commun à plusieurs options.
* *label* : optionnel, pour les options de type bouton, texte à afficher dans celui-ci.
* *hidden* : si vrai, l'option ne sera pas affichée dans le formulaire utilisateur, mais sera accessible comme n'importe quelle option. Utile pour stocker des valeurs dans Grist.
* *type*: optionnel pour les cas simples, recommandé pour les cas plus complexe. Défini comment l'option est présentée à l'utilisateur. Si possible le type est automatiquement déduit de *default*, mais il y a de nombreux cas où ce n'est pas possible. Les valeurs possibles sont : `boolean`, `number`, `string`, `longstring`, `dropdown`, `button`, `object`, `template`, `templateform`. Voir plus loin pour le détail de chaque type.
* *values* : optionnel, pour les types `dropdown`, défini la liste à afficher. Peut être un tableau ou une référence vers une colonne d'un tableau Grist (au format `$TableId.ColonneId`).
* *columnId*: optionnel, id de colonne tel qu'il apparait dans `grist.ready`. Permet de lier l'option à la valeur d'une colonne défini dynamiquement par l'utilisateur (contrairement à *values* qui est plus statique). Si le *type* n'est pas défini, il est alors automatiquement défini à `dropdown`.
* *format* : optionnel, fonction à utiliser pour convertir la valeur de l'option en un format plus facilement exploitable par la bibliothèque (par exemple un objet complexe).
* *parse* : optionnel, fonction inverse de *format*, pour reconvertir la valeur retournée par le formulaire utilisateur en une valeur du type initial.
* *event*: optionnel, permet d'associer un évènement à l'option. Doit contenir un objet dont chaque propriété correspond à un évènement, la clé étant au format HTML (ex: `onClick` pour un clic), et la valeur le *JavaScript* à exécuter suite à l'évènement.  
* *template* : optionnel, objet ou tableau d'objets du même type que les options standards. Défini un modèle pour une liste dynamique d'options. Si *values* ou *columnId* sont défini, permet alors d'associer une ou plusieurs options à chacune des valeurs. Sinon, permet à l'utilisateur d'ajouter dynamiquement autant d'élément qu'il le souhaite, avec pour chacun l'ensemble des options définies dans le modèle associées.

***Remarque*** : ne pas utiliser la fonction `T` pour *title*, *subtitle*, *description*, *group* et *label*, la bibliothèque sait que ce sont des textes à traduire, donc elle le gère automatiquement.  

### Les types d'options
Les configuration peuvent être du type sivant:
* `boolean` : affiche l'option comme un bouton toggle, 
* `number` : affiche l'option comme un *input* numérique,  
* `string` : affiche l'option comme un champ texte sur la même ligne que le titre,  
* `longstring` : comme `string`, mais un *textaera* est utilsé et l'option doit être dépliée pour accéder au champ,  
* `dropdown` : si le nombre d'éléments de la liste est inférieur à 10, affiche l'option comme un menu déroulant, sinon, affiche l'option comme un champ texte avec de l'autocomplétion,  
* `button` : permet d'afficher un bouton pour que l'utilisateur exécute une action. 
* `object` : affiche l'option comme `longstring` mais en convertissant au préalable l'objet en JSON,  
* `template` : défini un template pour des options dynamiques,  
* `templateform` : défini un template de plusieurs options différente.

### Les types par défaut
Si *type* n'est pas défini, la bibliothèque essaye de déterminer le type le plus approprié en fonction des autres données :
* `dropdown` : selon
    * si *columnId* est défini, 
    * si *values* est défini
* `boolean` : si la valeur par défaut est de type *boolean*,
* `number`  : si la valeur par défaut est de type *number*,
* `button` : si un *label* et un *event* sont déinis,
* `object` : si *default* est de type *object*,
* `string` : dans les autres cas.

### Accéder à une option
Une fois les options configurées, elles sont accessibles dans le code via `W.opt.OptionID` où *OptionID* est l'id tel qu'il a été défini durant la configuration. 

À noter que tant que Grist n'a pas été initialisé, les options ont leur valeur par défaut. Vous pouver appeler la fonction `await W.isLoaded()` pour attendre que les options sont chargées complètement.

## Fonctions Grist encapsulées
Pour intégrer au mieux les différents modules listés ci-dessus, plusieurs fonction de Grist sont disponibles dans la bibliothèque. Elles font exactement la même chose que les fonctions originelles, mais il est recommandé d'utiliser celles fournie par la bibliothèque pour gérer l'ordenancement des chargements et la bonne initialisation des valeurs.

Voici la liste des fonctions directement accessibles dans `W`:
* `ready` : 
    * ajoute la localisation aux textes affichés dans l'interface, 
    * indique quelle fonction utiliser pour afficher les options.
* `onRecords` : 
    * s'assure que le widget est correctement initialisé avant de procéder au traitement des *records*. 
    * Permet aussi de faire un mapping complet des donnés reçues. Au niveau des options il est recommandé d'utiliser ces valeurs `{expandRefs:false, keepEncoded:false, mapRef:true}` (*mapRef* n'est pas une option de Grist mais une pour WidgetSDK, qui indique que les données doivent être décodées). 
    * Noter également que les propriétés *title* et *description* des colonnes n'ont pas besoin de la fonction `T`, la bibliothèque va automatiquement chercher à les traduires.
* `onRecord` : comme *onRecords*.
* `async updateRecords(rec, encode)` : simplifie la mise à jour des données dans le tableau.
    * `rec` : contient les données à mettre à jour au même format que le fourni `onRecords` ou `onRecord` (i.e. pas d'encapsulation comme pour `TableOperations.update()`, la bibliothèque le gère automatiquement). 
    * `encode` : *optionnel*, par défaut si les données ont été décodées lors du `onRecords` ou `onRecord`, alors elle seront réencodées. Permet d'écraser ce comportement.
* `async createRecords(rec, encode)` : comme `updateRecords` mais pour l'ajout de nouvelle données.
* `async destroyRecords(id)` : simplifie la suppression de lines dans le tableau. `id` est soit un id soit un tableau d'id des lignes à supprimer.
* `async fetchSelectedRecord(id)` : permet de récupérer les données assiciées à une ligne à partir de son `id`. Gère automatiquement le décodage des données.
* `onMappingChange` : permet d'exécuter la fonction spécifiée quand les métadonnées des colonnes de la table changes (pour ainsi refléter ces changement dans votre widget sans attendre que l'utilisateur rafraîchisse la page).