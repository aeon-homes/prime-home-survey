# Aeon Annual Home Survey

The Aeon Home Survey app is a full-stack web app that converts Aeon’s offline home survey data of its properties and units into an online database, and stores that alongside survey input from Aeon residents to be exported for offline usage (or, as a stretch goal, viewed online). The main purpose of the web app is to allow Aeon staff to monitor completion of the home survey and support a door-to-door campaign by Aeon staff or volunteers to engage residents to complete the survey on a tablet-friendly view.

## Built With

- Node
- Express
- AngularJS
- AngularJS Material
- PostreSQL
- Heroku
- PapaParse
- Nodemailer
- Chart.js

### Prerequisites

- Node
- NPM

### Completed Features

The following are tasks completed for the project.

- [x] Survey Feature - Survey is initiated once a property name and unit number have been entered.  Surveys are tracked by property name rather than by unit number.  Unit number helps         in tracking who has completed the survey.
- [x] Survey Feature - Survey will be able to be adminstered in four different languages; English, Hmong, Somali, Spanish.
- [x] Survey Feature - Once survey is complete the resident has the ability to review their responses and go back to change responses.  At this time they will also be directed on next steps.
- [x] Administrator Feature - The Admin will be able to import the current year csv files which will include properties, unit information, surveys complete.
- [x] Administrative Feature - The Admin will be able to export a csv file when the survey process is complete.
- [x] Site Manager Feature - The site manager would be able to log into a view where they would be able to see whether a survey for a unit has been completed, the unit is currently occupied, and if the resident has received their incentive for completing the survey.  The site manager would be able to update whether the resident has received the incentive.
- [x] Administrative Feature - The administrator would be able to add/delete/modify survey questions, add/delete/modify site managers, add/delete/modify properties.
- [x] Administrative Feature - The administrator view would include a display of the percentage of units who have completed surveys as a total across all properties.
- [x] Data Reporting and Analysis Feature - Administrators will be able to select a property (or all properties) from a dropdown.  Then, they will be able to generate calculation reports based on needs of the organization.  Reports will include date ranges and will include visuals such as graphs or similar for visual representation.

## Deployment

- The app can be opened with the Heroku live link: https://aeon-home-survey.herokuapp.com
- Deploy the app to a hosting environment of your choice, like Heroku.
- Deploy a Postgres database and configure the database using the database.sql file.
- Refer to Google Doc being provided as walkthrough for entire app.

## Authors

Adam Biessener, Roxie Charchian, Sam Fortin, Caleb Miskowiec, and Ryan Templin


## Acknowledgments

Thank you to our client, Aeon, for giving us the opportunity to work on this project.  A special thank you to Aeon staff Brita Blesi and Julie DeBilzan for their assistance during the development process in answering questions and providing information.  We would also like to thank our Prime instructors Luke Schlangen and Kris Szafranski for their support during the development of this project as well as the entire Prime staff.  Finally, we would also like to thank the Betelgeuse cohort for their support.
