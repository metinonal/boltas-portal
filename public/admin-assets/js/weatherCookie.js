// Sayfa yüklendiğinde seçilen şehri geri yükle
document.addEventListener("DOMContentLoaded", () => {
    const citySelect = document.getElementById("citySelect");
    const savedCity = getCookie("selectedCity");

    if (savedCity) {
        citySelect.value = savedCity;
    }
});

// Şehir seçimi değiştiğinde çereze kaydet
document.getElementById("citySelect").addEventListener("change", (e) => {
    const selectedCity = e.target.value;
    if (selectedCity) {
        setCookie("selectedCity", selectedCity, 30); // 30 gün boyunca geçerli olacak
    }
});

// Çerez (cookie) oluşturma fonksiyonu
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/`;
}

// Çerez okuma fonksiyonu
function getCookie(name) {
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookiesArray = decodedCookie.split(';');
    for (let i = 0; i < cookiesArray.length; i++) {
        let cookie = cookiesArray[i].trim();
        if (cookie.indexOf(name + "=") == 0) {
            return cookie.substring(name.length + 1);
        }
    }
    return "";
}