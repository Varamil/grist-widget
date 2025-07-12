*English*: to be done.

** En cours de rédaction, sujet à de fort changement **

# Français
*WidgetSDK* n'est pas un widget pour Grist mais une bibliothèque qui permet de simplifier le développement de nouveaux widgets Grist. L'objectif est de minimiser les copier/coller de code entre les widgets et de simplifier l'accès à des fonctionnalités avancées.

## Fonctionnalités
* Gestion simplifiée de l'encodage des données (notamment des réfréences) en lecture et en écriture
* Accès simple au méta données des colonnes des tableaux (de quel type, quelle est la liste des choix, les options associées...)
* Fournir une interface utilisateur pour la configuration du widget, configurable avec un simple objet
* Gestion des timings de chargement pour s'assurer du bon ordonnancement des dépendances, i.e. qu'une donnée est bien disponible au momment où on en a besoin
* Localisation par défaut des widgets avec une possibilité, directement dans le widget, de proposer sa propre traduction

## Avantages
* Un code plus clair et facile à lire côté widget
* Moins de code côté widget, 
* Accès à des fonctionnalité avancées de Grist qui ne sont pas forcément bien documentées
* Un code plus facile à maintenir et à faire évoluer car dans une bibliotèque commune
* La localisation par défaut

## Installation 
Le plus simple est de copier le dossier *template* disponible sur ce même dépot, car il contient:
* Un *index.html* qui chargera les bons scripts
* Un *widget.js* qui contient le script du widget préconfiguré avec de nombreux commentaires pour guider le développeur
* (*optionnel*) La possibilité de compiler le widget via *pnpm* pour en obtenir une version minifiée
Pour plus de détails, voir le README présent dans le template.

Pour une installation sans le template, il faut:
1. Inclure dans le header de votre *index.html* :
```
<script src="https://varamil.github.io/grist-widget/widgetSDK/min/widgetSDK.umd.js"></script>
<link rel="stylesheet" href="https://varamil.github.io/grist-widget/widgetSDK/min/widgetSDK.css">
```
2. *Optionnel* avoir un `<div>` avec un `id` qui servira pour injecter l'interface utilisateur pour la configuration du widget
3. Dans votre script, créer un objet `WidgetSDK`, puis configurer les différents modules

Encore une fois, le template est le meilleur des exemples. Un autre bon exemple d'utilisation, est le widget [Kanban2](https://github.com/Varamil/grist-widget/tree/main/kanban2).

## Détails de la bibliothèque
Dans les paragraphes qui suivent, on considère que `W = new WidgetSDK()` et contient l'objet principal du SDK.

### La localisation
Une fois l'object créé, vous pouvez activer la gestion de la localisation avec une ligne de code du type:
```
    T = await W.loadTranslations(['widget.js']);
```
où `T` est une variable global, qui contiendra la fonction à appeler à chaque fois qu'un texte doit être traduit. 

Il est conseillé d'`await` la fonction, pour s'assurer que la localisation est bien chargée avant de passer aux autres configurations (qui vont utiliser cette localisation). 

Ensuite, la fonction `loadTranslations` peut prendre 3 arguments:
1. *Array\<string\>* : tableau qui contient la liste de script à analyser pour extraire les textes à traduire. Le moment venu 


### Les méta données des colonnes
Il suffi d'appeler la fonction `W.initMetaData()` pour initier la collecte des information auprès de Grist.

Ensuite, dans l'objet `W`, les propriétées suivantes sont disponibles:
* *meta*: contient toutes les méta données brutes de colonnes de tous les tableaux du document Grist, sert principalement quand il y a des réfrences entre tableaux. 
* *col*: contient toutes les méta données des colonnes du tableau auquel le widget est rattaché. C'est une sorte de filtre sur `meta`, et chaque colonne est accessible via son *id* (`W.col.MaColonne` pour accéder aux méta données de la colonne dont l'id Grist est *MaColonne*).

À noter que `meta` est disponible dès l'initialisation, alors que `col` n'est défini qu'une fois l'API Grist chargée.

#### `W.meta`
La fonction la plus utile est `async getColMeta(colId)` qui permet d'obtenir un objet de type `ColMeta` qui permet d'accéder facilement aux méta données de la colonne dont l'id est *colId*. Se repporter au paragraphe suivant pour plus de détail sur l'object retourné.

L'autre fonction qui peut être utilise est `isLoaded()` qui retourne un booléen indiquant si les méta données ont fini d'être chargées. 

#### `W.col`

C'est un objet dont chaque propriété est un objet de type `ColMeta` correspondant à chacune des colonnes du tableau associé au widget. Les propriétés sont nommées selon les id des colonnes. Ainsi `W.col.MaColonne` permet d'accéder aux méta données de la colonne dont l'id Grist est *MaColonne* (sans le $).

Chaque objet de type `ColMeta` contient les propriétées d'origine fournies par Grist, mais aussi plusieurs fonctions qui facilite l'accès:
* `getColor(ref)` : Pour une colonne de *Choix*, permet d'obtenir la couleur de fond du choix *ref*.
* `getTextColor(ref)` : comme `getColor`, mais retourn la couleur du texte.
* `getIsFormula()` : retourn vrai si la colonne est de type formule ET s'il y a une formule de définie.
* `async getChoices()` : permet d'obtenir les liste des choix possibles pour la colonne. La fonction est asynchrone car si les choix sont des références il faut pouvoir récupérer les valeurs associées. Les valeurs retournées peuvent être directement utilisées par `getColor` et `getTextColor`.
* `async parse(value)` : permet de convertir une valeur fournie par Grist en son équivalent tel que l'utilisateur la voit dans le navigateur. Gère les différents types d'encodage et les références.
* `async encode(value)` : fait l'inverse de `parse`, retourne une valeur telle qu'elle soit conpréhensible par Grist.


### Les options pour le widget
Grist offrent uniquement des options définir à quoi correspondent les colonnes d'un tableau pour que le widget puisse les exploiter correctement. Mais il est souvent utile de proposer à l'utilisateur d'autres options, pour personnaliser son expérience.

Mais au final, c'est souvent beaucoup de code pour générer le formulaire de configuration, parfois pour juste quelques options, et on se retrouve vite à faire la même choses dans chaqu'un des widgets que l'on développe.

L'idée est de générer le formulaire de configuration à partir d'un simple objet et d'accéder aux options choisis par l'utilisateur au moyen d'un simple objet.

#### Initialisation des options
Pour définir les options disponibles et gérer l'accès de l'utilisateur à celles-ci, il faut utiliser la fonction suivante:
```
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

Le second argument est soit directement un élément du DOM où inéser le formulaire utilisateur, soit un id d'une balise HTML. 

Le troisième argument, suit la même logique, mais permet de gérer l'affichage ou non du widget (afin d'afficher le formulaire d'option). Il faut donc que tout le code HTML du widget soit contenu dans l'élement indiqué ici.

Le dernier argument est un objet qui permet d'indiquer les callback à utiliser quand certains évènements surviennent. Pour l'instant:
* *onOptChange* : déclenché dès que l'utilisateuer applique de nouvelles options
* *onOptLoad* : déclenché quand les options ont fini d'être chargées lors de l'initialisation de Grist.

#### Configurtion d'une option

Pour les options les plus simples, la fonction statique `WidgetSDK.newItem('option_id', default_value, 'title',  'subtitle', 'group')` suffie à définir une option :
* *option_id* : l'identifiant de l'option, c'est ce qui servira à accéder à sa valeur. Doit être une chaîne alpha numérique unique parmis toutes les options.
* *default_value* : n'importe quelle valeur, est en premier lieu utilisé comme valeur par défaut tant que l'utilisateur ne la change pas. En second lieu, est utilisé pour définir le type de champ qui sera proposé à l'utilisateur dans le formulaire.
* *title* : un titre (court) qui sera affiché en face de l'option
* *subtitle* : une description (brève) qui sera affiché en face de l'option
* *group* : un titre pour le groupe auquel sera rattaché l'option. Doit être commun à plusieurs options

Mais pour des cas plus complexes, un élément du tableau peut être un objet avec les propriétées suivantes:
* *id* : obligatoire, l'identifiant de l'option, c'est ce qui servira à accéder à sa valeur. Doit être une chaîne alpha numérique unique parmis toutes les options.
* *default* : recommandé, la valeur qui sera associée à l'option par défaut. Est utilisée pour définir le *type* si celui n'est pas explicitement fourni.
* *title*: recommandé, un titre (court) qui sera affiché en face de l'option
* *subtitle* : recommandé, une description (brève) qui sera affiché en face de l'option
* *description* : optionnel, une description (longue) que l'utilisateur pourra afficher pour avoir plus de détails sur l'utilisation de l'option par le widget
* *group* : recommandé, un titre pour le groupe auquel sera rattaché l'option. Doit être commun à plusieurs options
* *hidden* : si vrai, l'option ne sera pas affichée dans le formulaire utilisateur, mais sera accessible comme n'importe quelle option. Utile pour stocker des valeurs dans Grist
* *type*: optionnel pour les cas simples, recommandé pour les cas plus complexe. Défini comment l'option est présentée à l'utilisateur. Si possible le type est automatiquement déduit de *default*, mais il y a de nombreux cas où ce n'est pas possible. Les valeurs possibles sont : `boolean`, `number`, `string`, `longstring`, `dropdown`, `object`, `template`, `templateform`, `lookup`. Voir plus loin pour le détail de chaque type.
* *values* : optionnel, pour les types `dropdown`, défini la liste à afficher. Peut être un tableau où une référence vers une colonne d'un table Grist (au format `$TableId.ColonneId`).
* *columnId*: optionnel, id de colonne tel qu'il apparait dans `grist.ready`. Permet de  lier lier l'option à la valeur d'une colonne défini dynamiquement par l'utilisateur (contrairement à *values* qui est plus statique). Si le *type* n'est pas défini, il est alors automatiquement défini à `dropdown`.
* *format* : optionnel, fonction à utiliser pour convertir la valeur de l'option en un format plus facilement exploitable par la bibliothèque (par exemple un objet complexe).
* *parse* : optionnel, fonction inverse de *format*, pour reconvertir la valeur retournée par le formulaire utilisateur en une valeur du type initial.
* *template* : optionnel, objet ou tableau d'objet du même type que les options standard. Défini un modèle pour une liste dynamique d'options. Si *values* ou *columnId* sont défini, permet alors d'associer une ou plusieurs options à chacune des valeurs. Sinon, permet d'ajouter dynamiquement autant d'élément qu'il le souhaite, avec pour chacun l'ensemble des options définies dans le modèle associées.




