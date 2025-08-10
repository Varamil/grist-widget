[*(français plus bas)*](#french)

# Export Table
*Export Table* is a widget designed to simplify column management in *Grist* tables. It is not a “production” widget, but rather a document “administration” widget.

## ⚠️ Warning ⚠️
This widget affects the structure of tables, so even though it has been tested in various situations, it is possible that the document may become corrupted after applying the changes.

It is always strongly recommended to use the *Work on a copy* feature provided by Grist, and then, if everything went well, apply the changes to the main document.

The widget is therefore provided as it is, and ***the author cannot be held responsible for any problems that the widget may cause***.

That being said, there is no particular cause for concern. However, during my tests with the *grist.docApi.applyUserActions* function provided by Grist, I noticed that it was not sufficiently protected and that providing it with malformed data could corrupt the database. Normally, there is no longer any cause for concern, but a future update to Grist could pose a problem, for example.

## Features
* Copy columns from one table and paste them into another
* Copy the properties of a column and paste them into another column (not necessarily in the same table)
* The columns and properties to be copied can be selected precisely
* Actions can be performed within the same document or across different documents

Examples of use cases:
* Copy/paste columns between a test document and a production document once the structure has been validated.
* Copy/paste the choices from a *Choice* type column (texts and colors).

## Installation
1. Add a new *Custom* page by selecting any table as the source (it will not be used, but Grist requires you to select a table).
2. Select the *Custom URL* widget and paste the following URL into the field:  https://varamil.github.io/grist-widget/exportTable/min/index.html then click on *Add widget*
3. In the right panel when the widget is selected, grant access rights to the widget.
4. The widget can now be used.

## Use
### Copy/past columns
1. On the page, select the *Target table*, the one you want to *copy*.
2. The *Table Structure* section should appear. All subsequent actions must be performed in this section.
2. (*optional*) In the *Columns* section, click on the line to display the columns of the selected table. You can then choose which ones to copy by checking them.
3. Click on the *Copy* button, and the data will be copied to the clipboard (be careful not to copy anything else (including ctrl+c) before completing the following steps).
4. (*optional*) If the target table is not the same, select the destination table in the *Target Table* section.
5. Click on the *Paste* button, and the new columns will be added to the selected table. *Note: if the data to be pasted has been copied from outside the browser, clicking on the button may bring up a context menu with the "Paste" option. Simply click on it to confirm (these are security measures to prevent web pages from accessing your clipboard).*

***Remarks:***

* If a column with the same ID already exists, it will be updated.
* New columns are added to the table, but what you see on the pages are widgets that display the table the way you have configured it, and by default, new columns are not displayed in existing widgets. You will need to do this manually.

### Copy/paste column properties
1. On the page, select the *Target table*, the one to which you want to *copy* the properties of a column.
2. The *Column* section should appear.
3. In the *Target column* section, select the column whose properties you want to copy.
4. The *Column properties* section should appear. All of the following actions are performed in this section.
5. (*optional*) In the *Properties* section, click on the line to display the properties of the selected column. You can then choose which ones to copy by checking them.
6. Click on the *Copy* button, and the data will be copied to the clipboard (be careful not to copy anything else (including ctrl+c) before completing the following steps).
7. (*optional*) If the target table is not the same, select the destination table in the *Target Table* section.
8. Select the column in which to paste the properties in the *Target Column* section.
5. Click the *Paste* button, and the new properties will be applied to the selected column. *Note: if the data to be pasted has been copied from outside the browser, clicking on the button may bring up a context menu with the "Paste" option. Simply click on it to confirm (these are security measures to prevent web pages from accessing your clipboard).*

## Limits

For the moment, dependencies for initialization formulas are not managed (because the identifiers in the source table are not the same as those in the target table). This copy must therefore be done manually.

Row formatting is also not supported.

## Requirements
A Grist table with read AND write access.

## Author
Varamil - [GitHub](https://github.com/Varamil)



# <a name="french"></a>Français
*Export Table* est un widget pour simplifier la gestion des colonnes dans les tables *Grist*. Ce n'est pas un widget de "production" mais plutôt un widget "d'administration" des documents.

## ⚠️ Attention ⚠️
Ce widget touche à la structure des tables, donc même s'il a été testé dans différentes situations, il est possible que le document soit corrompu après application des modifications. 

Il est toujours fortement recommandé d'utiliser la fonction *Travailler sur une copie* fournie par Grist, puis si tout s'est bien passé, appliquer les modifications au document principal.

Le widget est donc fourni tel quel, et ***l'auteur ne pourra être tenu responsable des problèmes que le widget pourrait engendrer***. 

Ceci étant dit, il n'y a pas d'inquiétude particulière à avoir, simplement, durant mes tests avec la fonction *grist.docApi.applyUserActions* fournie par Grist, j'ai pu constater qu'elle n'était pas suffisamment protégée, et que si on lui fournissait des données mal formatées, cela pouvait corrompre la base. Normalement il n'y a plus de soucis, mais par exemple, une mise à jour future de Grist pourrait poser problème.

## Fonctionnalités
* Copier des colonnes depuis une table et les coller dans une autre
* Copier les propriétés d'une colonne et le coller dans une autre colonne (par forcément dans la même table)
* Les colonnes et les propriétés à copier peuvent être sélectionnées finement
* Les actions peuvent être opérées dans un même document ou dans des documents différents

Exemples de cas d'utilisation :
* Copier/coller des colonnes entre un document de test et un document de production une vois la structure validée.
* Copier/coller les choix d'une colonne de type *Choix* (textes et couleurs).

## Installation
1. Ajouter une nouvelle page de *Personnalisée* en choisissant comme source n'importe quelle table (elle ne sera pas utilisée, mais Grist force le choix d'une table)
2. Choisir le widget *URL personnalisé* et coller dans le champ l'URL suivante :  https://varamil.github.io/grist-widget/exportTable/min/index.html puis cliquer sur *Ajouter un widget*
3. Dans le volet de droite quand le widget est sélectionné, accorder les droits d'accès au widget.
4. Le widget peut maintenant être utilisé.

## Utilisation
### Copier/coller des colonnes 

1. Dans la page, sélectionnez la *table cible*, celle que vous voulez *copier*.
2. La section *Structure de la table* doit apparaitre, toutes les actions suivantes se sont à réaliser dans cette section.
2. (*optionnel*) Dans la partie *Colonnes*, cliquer sur la ligne pour faire apparaître les colonnes de la table sélectionnée. Vous pouvez alors choisir lesquelles vont être copiées en les cochant.
3. Cliquez sur le bouton *Copier*, les données sont alors copiées dans le presse-papier (attention, ne plus rien copier (ctrl+c inclus) avant d'avoir fini les étapes suivantes).
4. (*optionnel*) Si la table cible n'est pas la même, sélectionnez la table de destination dans la partie *Table cible*.
5. Cliquez sur le bouton *Coller*, les nouvelles colonnes sont alors ajoutées à la table sélectionnée. *Remarque : si les données à coller ont été copiées depuis l'extérieur du navigateur, en cliquant sur le bouton, un menu contextuel avec l'option "Coller" peut apparaitre. Il suffit alors de cliquer dessus pour valider (ce sont des mesures de sécurités pour ne pas que les pages web accèdent à votre presse-papier).*

***Remarques :***

* Si une colonne avec le même identifiant existe déjà, alors elle sera mise à jour.
* Les nouvelles colonnes sont ajoutées à la table, mais ce que vous visualisez dans les pages ce sont des widgets qui affichent la table de la manière dont vous l'avez configuré, et par défaut, les nouvelles colonnes ne sont pas affichées dans les widgets existants. Vous devrez le faire à la main.

### Copier/coller des propriétés de colonne
1. Dans la page, sélectionnez la *table cible*, celle sur laquelle *copier* les propriétés d'une colonne.
2. La section *Colonne* doit apparaitre.
3. Dans la partie *Colonne cible*, sélectionner la colonne pour laquelle copier ses propriétés.
4. La section *Propriétés de la colonne* doit apparaitre, toutes les actions suivantes se sont à réaliser dans cette section.
5. (*optionnel*) Dans la partie *Propriétés*, cliquer sur la ligne pour faire apparaître les propriétés de la colonne sélectionnée. Vous pouvez alors choisir lesquelles vont être copiées en les cochant.
6. Cliquez sur le bouton *Copier*, les données sont alors copiées dans le presse-papier (attention, ne plus rien copier (ctrl+c inclus) avant d'avoir fini les étapes suivantes).
7. (*optionnel*) Si la table cible n'est pas la même, sélectionnez la table de destination dans la partie *Table cible*.
8. Sélectionnez la colonne dans laquelle coller les propriétés dans la partie *Colonne cible*.
5. Cliquez sur le bouton *Coller*, les nouvelles propriétés sont alors appliquées à la colonne sélectionnée. *Remarque : si les données à coller ont été copiées depuis l'extérieur du navigateur, en cliquant sur le bouton, un menu contextuel avec l'option "Coller" peut apparaitre. Il suffit alors de cliquer dessus pour valider (ce sont des mesures de sécurités pour ne pas que les pages web accèdent à votre presse-papier).*

## Limitations
Pour le moment, les dépendances pour les formules d'initialisation ne sont pas gérées (car les identifiants de la table de départ ne sont pas ceux de la table cible). Il faut donc faire cette copie à la main. 

Les mises en forme de ligne ne sont pas non plus prises en charge. 

## Exigences
Une table Grist avec un accès en lecture ET écriture.

## Auteur
Varamil - [GitHub](https://github.com/Varamil).
