# Grist Message Widget
A widget to display a simple chat interface storing all messages in a row without additionnal table.

## Features
* Display messages in modern cards
* Rich text support (via [Quill](https://github.com/slab/quill)), including images and formulas
* Include a form to post a new message
* Can display the sender name based Grist user name (*optional*)
* Everything is stored as html in row, no additional table required
* Localized (english, french and spanish)

![image](images/example.png)

## Usage
1. Add a *Custom URL* widget with this URL https://varamil.github.io/grist-widget/Messages/index.html to your Grist page
2. In the widget configuration, select the column you want to display
3. *Optional*, select a column for user (see below)
4. Adding a new message will update the row selected on linked widget

## Configuration
* Select the column in the source table where to store the messages
* *Optional*, you can select the column in the source table where to read the last sender. You need to use an auto update column with `user.Name` as formula and *Apply on changes to* checked (optionnaly you can restrict it to the column used for messages). Clearly it's a trick because we cann't access user name with API, so when a new message is posted, the Message column is updated which trigger the User column, then this updated value is read back, and the Message column is finally updated with all information (author, date and content). Basically you can use *Updated By* shortcut ([doc](https://support.getgrist.com/authorship/#an-updated-by-column))

![image](images/user_config.png)

## Requirements
Grist table with at least one column containing data for the messages.

## Author
Varamil - [GitHub](https://github.com/Varamil)
