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
    const headerRows = [8, 21, 34, 47, 60]; // Tarih başlıklarının olduğu satırlar

    headerRows.forEach((rowIndex) => {
        for (let colIndex = 1; colIndex <= 11; colIndex += 2) { // Yemek ve kalori sütunlarını dolaş (B, D, F, H, J)
            const dateCell = data[rowIndex][colIndex - 1]; // Yemek sütunundaki tarih bilgisi
            if (dateCell) {
                const date =
                    typeof dateCell === "number"
                        ? excelDateToJSDate(dateCell)
                        : dateCell;

                const meals = [];
                for (let i = 1; i <= 11; i++) { // Sadece 11 satır aşağıya doğru tara
                    const food = data[rowIndex + i] ? data[rowIndex + i][colIndex - 1] : null; // Yemek bilgisi
                    const calorie = data[rowIndex + i] ? data[rowIndex + i][colIndex] : null; // Kalori bilgisi

                    if (food) {
                        meals.push({
                            name: food,
                            calorie: calorie || null // Kalori bilgisi yoksa null döndür
                        });
                    }
                }

                if (meals.length > 0) {
                    menu.push({ date, meals });
                }
            }
        }
    });

    return menu; // JSON verisini d��ndür
}

module.exports = { parseExcel };
