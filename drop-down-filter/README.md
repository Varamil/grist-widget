*(français plus bas)*

# Grist Drop-down Filter Widget

A simple and compact drop-down widget for Grist documents filtering.

## Features

- Displays options from a selected column in a drop-down menu, doublon are automatically removed
- Acts as a source for filtering in other Grist widgets
- Compact design for efficient use of space
- *optional* Drop-down value synchronisation, if value changed on one page, openning linked pages will select the same value

## Usage
### Main configuration
1. Add the widget to your Grist document
2. In the widget configuration, select the column you want to use for options
3. The drop-down will populate with values from the selected column
4. Selecting an option will update the cursor position in linked widgets

### Link several drop-down *optional*
1. In the widget configuration, click on *Open the configuration*
2. The widget will change to let you enter a *Session ID*
3. Set any value you want, should be unique
4. Click on *Apply* and validate on Grist *Save*
5. Redo the procedure for each drop-down you want to link together, and use the **same** ID.

Example available [here](https://docs.getgrist.com/5EghdYeZyAFD/drop-down-filter?utm_id=share-doc).

## Configuration

- **Options to select**: Choose the column to populate the drop-down menu

## Requirements

- Grist document with at least one column containing data for the drop-down options

## Author

Varamil - [GitHub](https://github.com/Varamil)

## License

This project is open source and available under the [MIT License](LICENSE).

# Français
Ce widget est un simple menu déroulant permetant de filtrer d'autres widgets par rapport à la sélection.

À ne pas confondre avec le widget *drop-down* qui sélectionne une ligne en particulier, ici la valeur sélectionnée agit comme un filtre.

## Fonctionnalités
- Affiche dans un menu déroulant les valeurs présente dans une colonne. Les valeurs en doublon sont ignorées. 
- Agit comme une source de filtrage pour les autres widget Grist
- Design compact pour minimiser la placer occupée.
- *optionnel* La valeur du menu déroulant peut être synchronisée, si la valeur est changée sur une page, ouvrir une page liée sélectionnera automatiquement la même valeur.

## Utilisation 
### Configuration principale
1. Ajoutez le widget à votre document Grist
2. Dans la configuration du widget, sélectionnez la colonne à utiliser comme source de valeurs
3. Le menu déroulant va alors se remplir avec les valeurs de la colonne sélectionnée
4. Sélectionner une valeur du menu mettra automatiquement à jour les widgets liés en n'affichant que les lignes correspondant à la sélection.

### Lier plusieurs menus *optionnel*
1. Dans la configuration du widget, cliquer sur *Ouvrir la configuration*
2. Le widget va changer et va vous permettre d'entrer un identifiant de session (*Session ID*)
3. Utilisez n'importe quelle valeur, mais elle doit être unique
4. Cliquez sur *Apply* et validez avec le *Enregistrer* de Grist
5. Refaire la même procédure pour chaque menu que vous souhaitez lier, mais en utilisant la **même** ID

Exemple dosponible [ici](https://docs.getgrist.com/5EghdYeZyAFD/drop-down-filter?utm_id=share-doc).

## Configuration

- **Options to select**: Choisissez la colonne à utiliser pour peupler le menu

## Prérequis

- La table source doit avoir au moins une colonne contenant des données. 

## Auteur

Varamil - [GitHub](https://github.com/Varamil)

## License

Ce projet est open source et disponible sous license [MIT](LICENSE).