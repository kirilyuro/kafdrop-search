# kafdrop-search
Chrome extension utility that helps find stuff in [Kafdrop](https://github.com/obsidiandynamics/kafdrop).  
A [general description of how this works](https://github.com/kirilyuro/kafdrop-search/blob/main/wiki.md#how-does-it-work) (and the **underlying assumptions**).
 
Originally generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.0.5.

## Installation

* Download the [latest release](https://github.com/kirilyuro/kafdrop-search/releases/latest) archive
* Extract it
* Load it into Chrome as an unpacked extension:
  * Open [Extensions](chrome://extensions/)
  * Turn on `Developer mode`
  * `Load unpacked` from the extracted directory
  
## Usage

1. Open the extension and enter your search parameters:
  * `Topic` - the Kafka topic to search (autocompletes with the existing topics in Kafka).
  * `Key` - the key of the record to search.
  * `Timestamp` - an _approximate_ timestamp of the record in ISO-8601 UTC (e.g. `2022-01-12T34:56:78.999Z`).
  * `Partition` - auto-calculated based on the selected topic and record key.
2. Click `Search`. Once the search is finished, it will open a Kafdrop page.  
If the search was successful, it will contain the record you were searching for.

### Settings

* `Kafdrop URL` - set the relevant Kafdrop URL, change to use Kafdrop instances in various environments.  
(the default is `http://localhost:9000/`)
* `Auto-scroll pages` - amount of pages to scroll (backwards & forwards) at the end of the search.  
Increasing this will increase the likelihood of finding your record, but it will cause more calls to the Kafdrop API  
(increasing this by N will cause 2N extra calls).  
(the default is `10`)

## Development

### Getting started

Run `npm install` (tested with `node v10.24.1` / `npm v6.14.12`)

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

You can then load the built extension into Chrome as an unpacked extension:
* Open [Extensions](chrome://extensions/)
* Turn on `Developer mode`
* `Load unpacked` from the `dist/kafdrop-search/` directory.

To automatically update artifacts on changes, run `ng build --watch`.


### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
