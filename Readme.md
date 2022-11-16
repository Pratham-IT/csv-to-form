# Csv To Form

> `Csv To Form` is a library that helps to paste bulk data on tabular form.

Demo : https://csv-to-form.netlify.app/

## Installation

   ```npm
   npm i "csv-to-form"
   ```


   ```yarn
   yarn add "csv-to-form"
   ```

## Usages
> Add data-header attribute on th, which will be used as key of object when paste payload will be provided

> Data pasted on column with th class `watch` will be returned as pasted payload. Use config.watcher to use custom class

> Data pasted on column with th class `skip-paste` will be ignored. Use config.cellFilter to use custom class.

```js
import {useCsvPaster} from "csv-to-form/csv-to-form.js";

window.addEventListener("DOMContentLoaded", (ev) => {
    useCsvPaster(config);
})

```

### Config Options

```js
{
    elem : HTMLTableElement, //elem where paste listener will be added
    watcher : (elem) => {} // use to fetch needed paste cell data,
    cellFilter : (elem) => {} // use to filter cell for paste,
    onCellPasteComplete : (elem) => {} // function to execute after each paste on cell
}

```

### Emitted Events 
```js
addRows : (ev)  `emitted when table row has to be added with count on ev.detail`
pasteCompleted : (payload)  `emitted when paste is completed with data on watched cell as Array<Object>`
```
