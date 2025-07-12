*(français plus bas)*

# Kanban
*Kanban2* is a widget to display a Kanban board.

*(it replaces the previous version also available on this server)*.

## Features
* Dynamic columns: list, order, title and color depend directly on Grist table configuration.
* Possibility of adding new tasks directly in the widget
* Possibility of editing tasks directly in the widget
* Drag-and-drop cards from one column to another
* Cards can be reordered within a column
* Customize general display and cards

![image](images/kanban.png)

<img src="images/edit.png" width="300" align="center">

*Example available on [Grist](https://docs.getgrist.com/i7qAzQSXzeYe/Kanban?utm_id=share-doc).*

## Installation
1. Prepare your table to be compatible with the widget:
    * A *Status* column that must be of the *Choice* type, with each element corresponding to a column. Customize the color and order of the choices to adjust the Kanban display.
    * A *Task* column containing the main text of the card.
    * A *Dead line* column of type *Date*, used to organize cards in a column. Either by indicating a date, or by reorganizing them.
    * The other columns are optional.
2. Add a new *Custom* view to your page, choosing as source the table on which the Kanban is to be based.
3. Choose the *Customized URL* widget and paste the following URL into the field: https://varamil.github.io/grist-widget/kanban2/min/index.html then click on *Add widget*.
4. When the widget is selected, associate the various columns in the right panel.
5. Still in the right panel, click on *Open configuration*.
6. In *Columns > Behavior*, adjust the options for each column.
7. Modify other options as required
8. Click on the *Apply* button at the top of the page to see the result of the configuration.
9. Don't forget to click on the *Save* button to save the configuration on the Grist side
![image](images/save.png)
10. The widget is now functional

## Configuration 
### Table columns
In addition to the mandatory columns, the following columns can be assigned:
* *Reference*: associates a reference with the task, which is then displayed specifically on the card, in the top-right corner.
* *Type*: associates a type with the task. Appears on the card as a label at top-left corner.
* *Responsible*: who is responsible for the task. Appears as a label at bottom right.
* *Created by*: who created the task. In general, an initialization formula is used on the Grist side, with the formula `user.Name`. This information then appears when you edit a card, at the very bottom of the editing form.
* *Created on*: when the task was created. In general, an initialization formula is used on the Grist side, with the formula `NOW()`. This information then appears when you edit a card, at the very bottom of the editing form.
* *Last update date*: when the card was last modified. In general, an initialization formula is used on the Grist side, with the formula `NOW()` reapplied each time another field is modified.
* *Notes*: additional notes for the task which do not appear directly on the card. They are accessible when editing.
* *Card color*: allows you to change the color of the cards. Must be of type *Choice* or *Text*. In the first case, the choice background color is used to define the background color of the card; in the second case, the text value must correspond to a color in HTML format (a # followed by 6 hexadecimal characters).

### The options
In Grist's right panel, when you click on *Open configuration*, the widget displays a form allowing you to customize it.
* *Columns > Behavior*: allows you to configure the behavior and display of each Kanban column. Click on the chevron ">" to access the sub-options.
    * *Add button* : if checked, displays a button to add a card to this column.
    * *Done*: if checked, cards in this column are considered finished (a stamp appears on the card).
    * *Confetti*: if checked, confetti appears when a card enters this column.
* *Card options*: configure the behavior of the 3 main fields (reference, type and in charge) in the card editing form. By default, the widget checks whether the associated Grist column is of type *Choice* or *Reference*, and if so, offers the user a list based on these data. If this is not the case, or if you wish to propose a different list, you can :
    * List the values to be proposed in the field on the right, separating each value with a “;”.
    * Indicate a reference to a column or table (in which case the 1st column of the table is used). The reference must be in `$TableId` or `$TableId.ColumnId` format, where the table and column ids correspond to those used in Grist.
* *Display*: general kanban options.
    * *Tilt*: if checked, cards are randomly rotated, giving a “post-it” look to the cards, but the cards then appear slightly blurred, so some may prefer to disable this option to have straight cards.
    * *Compact*: if checked, uses a compact display, spaces are reduced, the add button is placed in the column title and not at the top of the cards.
    * *Read only*: if checked, the kanban is read-only.
* *Localization*: offers the user the option of making their own translation of the widget (for languages not offered by default). To create a new translation, first click on the *Extract* button, which will list all the texts to be translated. Then, by clicking on the chevron “>”, define the translation for each element. By saving the options, your translation will be taken into account. Feel free to share your translations by creating an *issue* on this Github. Click on the *Export* button to copy your translations to the clipboard, and then simply paste the content into your *issue*.

## Use
Once configured, the widget can be used autonomously without having to return to the table.

In general, you can:
* add cards via the add button, 
* edit them by simply clicking on them, 
* move them from one column to another
* delete them by clicking on them and then clicking on the bin,
* rearrange them (when there is no deadline) to change the order in a column (and thus show the first tasks as having higher priority).

## Requirements
A Grist table with read and/or write access.

## Authors
Céline Delval - [Original post](https://forum.grist.libre.sh/t/custom-widget-kanban/506/17) - original author who laid the groundwork for the widget,

Varamil - [GitHub](https://github.com/Varamil) - who took care of Grist integration and localization.



# Français
*Kanban2* est un widget pour afficher un tableau sous forme de Kanban. 

*(il remplace la précédente version disponible également sur ce serveur)*

## Fonctionnalités
* Colonnes dynamiques, la liste, l'ordre, le titre, la couleur dépend directement de la configuration du tableau Grist
* Possibilité d'ajouter directement de nouvelle tâche dans le widget
* Possibilité d'éditer les tâches directement dans le widget
* Déplacement des cartes d'une colonne à l'autre par glisser-déposer
* Possibilité de réordonner les cartes dans une colonne
* Personnalisation de l'affichage général et des cartes

![image](images/kanban.png)

<img src="images/edit.png" width="300" align="center">

*Exemple disponible sur [Grist](https://docs.getgrist.com/i7qAzQSXzeYe/Kanban?utm_id=share-doc)*

## Installation
1. Préparer votre tableau pour être compatible avec le widget :
    * Une colonne *Statut* qui doit être de type *Choix unique* et dont chaque élément correspondra à une colonne. Personnalisez la couleur et l'ordre des choix pour ajuster l'affichage du Kanban.
    * Une colonne *Tâche* qui contiendra le texte principal de la carte.
    * Une colonne *Date limite* de type *Date*, elle sert à organiser les cartes dans une colonne. Soit en indiquant une date, soit en les réorganisant.
    * Les autres colonnes sont optionnelles
2. Ajouter une nouvelle vue de type *Personnalisée* à votre page en choisissant comme source la table sur laquelle doit se baser le Kanban
3. Choisir le widget *URL personnalisé* et coller dans le champ l'URL suivante :  https://varamil.github.io/grist-widget/kanban2/min/index.html puis cliquer sur *Ajouter un widget*
4. Dans le volet de droite quand le widget est sélectionné, associer les différentes colonnes
5. Toujours dans le volet de droite, cliquer sur *Ouvrir la configuration*
6. Dans *Colonnes > Comportement* ajuster les options pour chaque colonne
7. Modifier les autres options si besoin
8. Cliquer sur le bouton *Appliquer* en haut de la page pour voir le résultat de la configuration.
9. Ne pas oublier de cliquer sur le bouton *Enregistrer* pour sauvegarder côté Grist la configuration
![image](images/save.png)
10. Le widget est maintenant fonctionnel

## Configuration 
### Les colonnes du tableau
En plus des colonnes obligatoires les colonnes suivantes peuvent être affectées :
* *Référence* : associe une référence à la tâche, elle est ensuite affichée de manière spécifique sur la carte, en haut à droite.
* *Type* : associe un type à la tâche. Apparait sur la carte sous forme d'une étiquette à haut à gauche.
* *Responsable* : qui doit s'occuper de la tâche. Est représenté par une étiquette en bas à droite.
* *Créé par* : qui a créé la tâche. En général, on utilise une formule d'initialisation côté Grist avec comme formule `user.Name`. L'information apparait ensuite quand on édite une carte, tout en bas du formulaire d'édition.
* *Créé le* : quand la tâche a été créée. En général, on utilise une formule d'initialisation côté Grist avec comme formule `NOW()`. L'information apparait ensuite quand on édite une carte, tout en bas du formulaire d'édition.
* *Date de dernière mise à jour* : quand la carte a été modifiée pour la dernière fois. En général on utilise une formule d'initialisation côté Grist avec comme formule `NOW()` qui est réappliquée chaque fois qu'un autre champ est modifié.
* *Notes* : notes complémentaires pour la tâche qui n'apparaissent pas directement sur la carte. Elles sont accessibles quand on l'édite.
* *Couleur carte* : permet de changer la couleur des cartes. Doit être de type *Choix unique* ou *Texte*. Dans le premier cas, la couleur du choix sert à définir la couleur de fond de la carte, dans le second cas, la valeur du texte doit correspondre à une couleur au format HTML (un # suivi de 6 caractères hexadécimaux).

### Les options
Dans le volet de droite de Grist, quand on clique sur *Ouvrir la configuration*, le widget affiche un formulaire permettant de le personnaliser.
* *Colonnes > Comportement*: permet de configurer le comportement et l'affichage de chacune des colonnes du Kanban. Cliquer sur le chevron ">" pour accéder aux sous-options.
    * *Bouton d'ajout* : si coché, affiche un bouton pour ajouter une carte à cette colonne.
    * *Fait* : si coché, les cartes dans cette colonne sont considérées comme terminées (un tampon apparait sur la carte).
    * *Confetti* : si coché, des confettis apparaissent quand une carte entre dans cette colonne.
* *Options des cartes* : permet de configurer le comportement des 3 champs principaux (référence, type et responsable) dans le formulaire d'édition d'une carte. Par défaut le widget regarde si la colonne Grist associée est de type *Choix* ou de type *Référence*, et dans ce cas, il propose à l'utilisateur une liste basée sur ces données. Si ce n'est pas le cas ou si vous souhaitez proposer une autre liste vous pouvez :
    * Lister les valeurs à proposer dans le champ à droite, en séparant chaque valeur par un ";"
    * Indiquer une référence vers une colonne ou une table (et alors la 1ère colonne de la table est utilisée). La référence doit être au format `$TableId` ou `$TableId.ColonneId`, où les id de table et de colonne correspondent à celles qui sont utilisées dans Grist.
* *Affichage* : options générales du Kanban.
    * *Cartes pivotées* : si coché, les cartes sont aléatoirement pivotées, rendant un aspet "post-it" aux cartes, mais les cartes apparaissent alors légèrement floutées, certains préfèreront désactiver cette option pour avoir des carte droite.
    * *Compact* : si coché, utilise un affichage compact, les espaces sont réduits, le bouton d'ajout est placé dans le titre de la colonne et non en haut des cartes.
    * *Lecture seule* : si coché, le Kanban est alors en lecture seule.
* *Localisation* : offre à l'utilisateur la possibilité de faire sa propre traduction du widget (pour les langues qui ne sont pas proposées par défaut). Pour créer une nouvelle traduction, il faut dans un premier temps cliquer sur le bouton *Extraire* qui va liste tous les textes à traduire. Puis en cliquant sur le chevron ">", définir la traduction de chaque élément. En enregistrant les options, votre traduction sera alors prise en compte. N'hésitez pas à partager vos traductions en créant une *issue* sur ce Github. Cliquez sur le bouton *Exporter* pour copier vos traduction dans le presse-papier, et vous n'aurez qu'à coller le contenu dans votre *issue*.

## Utilisation
Une fois configuré, le widget peut être utilisé de manière autonome sans avoir à revenir au tableau. 

De manière général, vous pouvez:
* ajouter des cartes via le bouton d'ajout, 
* les éditer en cliquant simplement dessus, 
* les déplacer d'une colonne à l'autre
* les supprimer en cliquant dessus puis en cliquant sur la corbeille,
* les réorganiser (quand il n'y a pas de date limite) pour modifier l'ordre dans une colonne (et ainsi figurer les premières tâches comme étant plus prioritaires)


## Exigences
Une table Grist avec un accès en lecture et/ou écriture.

## Auteurs
Céline Delval - [Post originel](https://forum.grist.libre.sh/t/custom-widget-kanban/506/17) - auteure initiale qui a posée les bases du widget,

Varamil - [GitHub](https://github.com/Varamil) - qui s'est occupé de l'intégration dans Grist et de la localisation.



