const configOptions = {
    elem : null,
    watcher: (elem) => elem.classList.contains('watch'),
    cellFilter: (elem) => !elem.classList.contains('skip-paste'),
    onCellPasteComplete : () => {},
    handleOld : false
}

export const useCsvPaster = (config) => {
    config = {...configOptions, ...config};
    if(!config.elem) return;
    const dispatchEvent = async (named, data) => {
        if (!data) return;
        await new Promise((resolve) => {
            const event = new CustomEvent(named, {detail: data});
            config.elem.dispatchEvent(event);
            resolve();
        });
    }

    const getFormattedPaste = (event) => {
        const target = (event.target);
        const currentCell = target.closest('td');
        const currentRow = currentCell.closest('tr');
        const raw = event.clipboardData.getData('text/plain');
        const data = [];
        if (!raw.includes("\t") && !raw.includes("\n")) {
            return data;
        }
        let rawRowData = [];
        if(raw.includes("\r\n")){
            rawRowData = raw.split("\r\n");
        }
        else {
            rawRowData = raw.split("\n");
        }
        let oldHandler = (callBack, cellIndex) => true;
        if(config.handleOld){
            const cells = Array.from(config.elem.rows).filter(x => x.rowIndex >= currentRow.rowIndex)
                .reduce((cells, row) => (cells.concat(...row.cells)), []);
            oldHandler = (callBack, cellIndex) => {
                const elems = cells.filter(x => x.cellIndex === cellIndex);
                return elems.some(callBack);
            }
        }
        const headers = Array.from(config.elem.tHead.rows[0].cells)
            .filter(cell => cell.cellIndex >= currentCell.cellIndex && config.cellFilter(cell) && oldHandler(config.cellFilter, cell.cellIndex))
            .map(x => ({cellIndex : x.cellIndex, cell : x}));
        rawRowData.forEach((row, idx) => {
            let cellRawData = row.split('\t');
            let cellData = [];
            let cellObj = {};
            let isWatched = false;
            headers.forEach(({cell, cellIndex}, idx) =>{
                let copiedValue = cellRawData[idx]
                if(!copiedValue) return;
                cellData[cellIndex] = {cellIndex : cellIndex, value : copiedValue};
                cellObj[cell.dataset.header] = copiedValue;
                isWatched = isWatched || (config.watcher(cell) && oldHandler(config.watcher, cellIndex));
            });
            const rowIndex = currentRow.rowIndex+idx;
            cellObj["rowIndex"] = rowIndex;
            data.push({rowIndex, cellData, cellObj, isWatched});
        });
        return data;
    }

    const setInput = (cellElem, input) => {
        let pasteElem = cellElem.querySelector('input, textarea, select');
        if (pasteElem instanceof HTMLInputElement && pasteElem.type == 'radio') {
            const radioElems = Array.from(pasteElem.querySelectorAll('input[type="radio"]'));
            pasteElem = radioElems.find(elem => elem.closest('label').textContent === input);
            pasteElem.checked = true;
        }
        if (pasteElem instanceof HTMLInputElement && pasteElem.type == 'checkbox') {
            pasteElem.checked = (input == 'true' || input == '1' || input == 'on' || input == 'yes');
        }
        if (pasteElem instanceof HTMLSelectElement) {
            const optionElems = Array.from(pasteElem.querySelectorAll('option'));
            input = optionElems.find(elem => elem.textContent === input)?.value;
        }
        pasteElem.value = input;
        pasteElem.dispatchEvent(new Event('change', {bubbles: true}));
        pasteElem.dispatchEvent(new Event('input', {bubbles: true}));
        config.onCellPasteComplete(pasteElem);
    }

    const notifyAdjustableRow = async (paste) => {
        if (paste.length + getStartingRowIndex(paste) > config.elem.rows.length - 1) {
            const rowsToAdd = paste.length + getStartingRowIndex(paste) + 1 - config.elem.rows.length;
            await dispatchEvent('addRows', rowsToAdd);
        }
    }

    const handlePaste = async (data) => {
        const rows = Array.from(config.elem.rows);
        data.forEach(rowData => rowData.cellData.forEach(cell => {
            setInput(rows[rowData.rowIndex].cells[cell.cellIndex], cell.value);
        }));
    }


    config.elem.addEventListener('paste', async (event) => {
        const paste = getFormattedPaste(event);
        if (paste.length === 0) return;
        event.preventDefault();
        await notifyAdjustableRow(paste);
        await handlePaste(paste);
        const watchedData = paste.filter(x => x.isWatched).map(x => x.cellObj);
        await dispatchEvent('pasteComplete', watchedData);
    });

    const getStartingRowIndex = (data) => data[0].rowIndex;
    const getStartingCellIndex = (data) => data[0].cellData[0].cellIndex;
}
