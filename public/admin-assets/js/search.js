const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#top-search');

searchForm.addEventListener('submit', function (event) {
    event.preventDefault(); // formun sayfayı yenilemesini engeller
    const query = searchInput.value.trim();
    if (query) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
});

searchInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        // Burada ekstra işlem gerekmez çünkü formun submit olayı zaten yukarıda ele alındı.
    }
});

document.querySelector('#searchQuery').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // formun default submit davranışını engeller
        const query = this.value.trim();
        if (query) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        }
    }
});
