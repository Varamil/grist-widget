# Grist Drop-down Widget

A simple and compact drop-down widget for Grist documents.

## Features

- Displays options from a selected column in a drop-down menu
- Acts as a source for selection in other Grist widgets
- Compact design for efficient use of space
- [new] *optional* Drop-down value synchronisation, if value changed on one page, openning linked pages will select the same value

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

Example available [here](https://docs.getgrist.com/t4hM2ynV2J3b/linked-drop-down?utm_id=share-doc).

## Configuration

- **Options to select**: Choose the column to populate the drop-down menu

## Requirements

- Grist document with at least one column containing data for the drop-down options

## Author

Antol Peshkov - [GitHub](https://github.com/Antol)

Varamil - [GitHub](https://github.com/Varamil) (synchronization update)

## License

This project is open source and available under the [MIT License](LICENSE).
