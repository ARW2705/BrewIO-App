# BrewIO Mobile App

---

Make your home brewing a breeze! Design and manage your beer recipes and use the detailed brew process steps so you don't forget a thing.

* Build recipes from ingredients database
* Create variants of a recipe for experimentation
* Calculates values such as IBU, Original Gravity, estimated ABV and more
* Plan a detailed production process from brew day to packaging
* Follow each step with built in timers and calendars



## Getting Started

---

### Prerequisites

To clone and run this application, you'll need [Git](https://git-scm.com/), [Node.js](https://nodejs.org/en/), and [Ionic CLI](https://ionicframework.com/docs/cli/)

Additionally, the [BrewIO server app](https://github.com/ARW2705/BrewIO-Server) is required. Once server setup is complete, update the [base-url](https://github.com/ARW2705/BrewIO-App/blob/master/src/shared/constants/base-url.ts) to your domain/IP address.

### Installation

Clone this repository  
`$ git clone https://github.com/ARW2705/BrewIO-App.git`

Change to project directory  
`$ cd brewIO-app`

Install Dependencies  
`$ npm install`

Serve locally  
`$ ionic serve`

You may also deploy directly to your device following Ionic's [instructions](https://ionicframework.com/docs/v3/intro/deploying/).


## Future Plans

---

### Features
* Stand alone version (local storage only)
* Inventory tracking
* Device notifications
* Peripheral brewing device integration (temperature controllers, etc.)
* Share recipes with friends

### Improvements
* Expanded caching
* Quick scaling
* Metric support


## Built With

---

* [Ionic](https://ionicframework.com/) - Mobile app framework
* [Cordova](https://cordova.apache.org/) - Mobile device platform integration
* [NPM](https://www.npmjs.com/) - Dependency management


## License

---

This project is licensed under the MIT License - see the [LICENSE](https://github.com/ARW2705/BrewIO-App/blob/master/LICENSE) file for details.
