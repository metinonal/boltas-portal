const xlsx = require("xlsx");

// Excel tarihlerini dönüştürme
function excelDateToJSDate(excelDate) {
    const jsDate = new Date((excelDate - 25569) * 86400 * 1000); // Excel'den JS tarihine
    return jsDate.toISOString().split("T")[0]; // YYYY-MM-DD formatında döndür
}

// Excel'den veriyi okuyup JSON formatına dönüştür
function parseExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const menu = [];
    const headerRows = [8, 15, 22, 29, 36]; // Tarih başlıklarının olduğu satırlar

    headerRows.forEach((rowIndex) => {
        for (let colIndex = 0; colIndex < data[rowIndex].length; colIndex++) {
            const dateCell = data[rowIndex][colIndex];
            if (dateCell) {
                const date =
                    typeof dateCell === "number"
                        ? excelDateToJSDate(dateCell)
                        : dateCell;

                const meals = [];
                for (let i = 1; i <= 5; i++) {
                    const meal = data[rowIndex + i] ? data[rowIndex + i][colIndex] : null;
                    if (meal) {
                        meals.push(meal);
                    }
                }
                if (meals.length > 0) {
                    menu.push({ date, meals });
                }
            }
        }
    });

    return menu; // JSON verisini döndür
}

module.exports = { parseExcel };
