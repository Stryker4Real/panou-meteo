const formular = document.querySelector("#formular-meteo");
const campOras = document.querySelector("#oras");
const titluVreme = document.querySelector("#titlu-vreme");

formular.addEventListener("submit", function (event) {
    event.preventDefault();

    const oras = campOras.value.trim();

    if (oras === "") {
        campOras.setCustomValidity("Introdu un nume de oraș.");
        campOras.reportValidity();
        return;
    }

    titluVreme.textContent = "Vremea în " + oras;
});

campOras.addEventListener("input", function () {
    campOras.setCustomValidity("");
});

const butonTema = document.querySelector("#schimba-tema");

butonTema.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
    butonTema.textContent = "	☀️ Mod luminos";
} else {
    butonTema.textContent = "	🌙 Mod întunecat";
}
});