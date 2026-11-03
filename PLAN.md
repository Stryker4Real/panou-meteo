# Panou Meteo — planul proiectului

Proiect obligatoriu la **Aplicații Web** (aplicația nr. 9 din listă).
Echipă de 2–3 studenți · termen: ultima săptămână a modulului.

> **Ce face aplicația:** afișează vremea curentă și prognoza pe 5 zile pentru orașele căutate,
> iar orașele preferate se salvează pe server, într-o bază de date.

---

## 1. Decizii tehnice

| Ce | Alegere | De ce |
|---|---|---|
| Limbaj | **JavaScript** peste tot (client + server) | Cerut de profesor |
| Server | **Node.js (LTS) + Express 5** | Cerut de profesor: „Express pe API și tot” |
| Frontend | HTML + CSS + JavaScript simplu (fără React, fără build) | Exact ce se predă la curs; ușor de explicat la prezentare |
| Bază de date | **SQLite** (pachetul `better-sqlite3`) | Un singur fișier `data/meteo.db`, nu are nevoie de server separat, datele rămân după repornire |
| API meteo extern | **Open-Meteo** (geocoding + forecast) | Gratuit, **fără cheie API**, are date în limba română |
| Grafice | SVG desenat din JavaScript | Fără biblioteci; fiecare linie poate fi explicată |
| Dev | `node --watch server.js` | Repornește serverul la fiecare salvare, fără `nodemon` |

**Express face două lucruri:**
1. servește paginile din `public/` (HTML, CSS, JS) — `express.static`;
2. expune API-ul nostru la `/api/...` — browserul nu vorbește niciodată direct cu Open-Meteo, ci doar cu serverul nostru.

```
 Browser (HTML/CSS/JS)                 Server Node.js + Express                Externe
┌──────────────────────┐  fetch /api  ┌──────────────────────────┐   fetch   ┌──────────────┐
│ index.html  oras.html│ ───────────▶ │ routes/  → services/     │ ────────▶ │  Open-Meteo  │
│ favorite.html  ...   │ ◀─────────── │ validare · erori · cache │ ◀──────── │ (vreme, geo) │
└──────────────────────┘     JSON     └────────────┬─────────────┘           └──────────────┘
                                                   │ SQL
                                            ┌──────▼──────┐
                                            │ SQLite      │ favorite · setări · istoric
                                            │ meteo.db    │
                                            └─────────────┘
```

---

## 2. Cerințele profesorului → cum le îndeplinim

| Cerință | Cum o acoperim |
|---|---|
| Căutarea unui oraș | Bară de căutare în antet, pe toate paginile, cu sugestii (geocoding) |
| Condițiile curente | Card mare pe Acasă și pe pagina orașului: temperatură, resimțită, vânt, umiditate, presiune, UV |
| Prognoză pe 5 zile | Listă cu min/max, iconiță, probabilitate de precipitații |
| Orașe favorite salvate | CRUD complet pe `/api/favorites`, salvate în SQLite |
| Apelarea unui API extern | Serverul apelează Open-Meteo cu `fetch` |
| JavaScript asincron | `async/await` în client și în server, `Promise.all` pentru mai multe orașe |
| Tratarea erorilor | Oraș negăsit, API picat, timeout, fără internet, date invalide — fiecare are mesaj clar (vezi §8) |
| HTML, CSS, JS + framework | HTML/CSS/JS + Express pe Node.js |
| Date persistente | SQLite — favoritele, setările și istoricul rămân după reload și după repornirea serverului |
| Minim 4 pagini cu navigare | 5 pagini: Acasă, Oraș, Favorite, Istoric, Setări (+ Login/Cont pentru 19/20) |
| Formulare validate | Căutare, adăugare/editare favorit, setări — validare în browser **și** pe server |
| Layout responsive | Mobile-first; testat la 375px, 768px, 1280px; bară de navigare jos pe telefon |
| Git cu commit-uri de la fiecare membru | Branch-uri pe funcționalitate + pull request-uri (vezi §11) |
| README | Ce face aplicația + cum se rulează (vezi §12) |
| Fiecare membru explică orice parte a codului | Cod simplu, fără framework de frontend, sesiuni de „code walkthrough” săptămânale |

---

## 3. Pagini și navigare

Navigare comună: antet cu logo, căutare și meniu (Acasă · Favorite · Istoric · Setări).
Pe telefon meniul devine o bară fixă jos, cu iconițe.

| # | Pagină | Fișier | Conține |
|---|---|---|---|
| 1 | **Acasă** | `index.html` | Vremea acum în orașul implicit, prognoză 5 zile, orașele favorite pe scurt |
| 2 | **Oraș** | `oras.html?lat=..&lon=..&name=..` | Detalii complete: următoarele 24 h (grafic), 5 zile, răsărit/apus, vânt, UV, buton ★ favorite |
| 3 | **Favorite** | `favorite.html` | Lista orașelor salvate, formular adăugare/editare (nume afișat, notă), ștergere, oraș implicit |
| 4 | **Istoric** | `istoric.html` | Căutările anterioare (din baza de date), filtrare, ștergere |
| 5 | **Setări** | `setari.html` | °C/°F, unitatea vântului, oraș implicit, temă luminoasă/întunecată |
| — | Componente | poza „06 Componente si stari” | Doar pentru design: culori, butoane, stări de eroare (nu intră în aplicație) |

Pozele cu drafturile sunt în folderul **`Drafturi/`**: fiecare ecran pe laptop și pe telefon, în tema luminoasă și în cea întunecată.

---

## 4. Structura proiectului

```
panou-meteo/
├── package.json
├── server.js                  ← pornește Express, leagă rutele, servește public/
├── .gitignore                 ← node_modules/, data/*.db, .env
├── README.md
├── data/
│   └── meteo.db               ← creat automat la prima pornire (nu intră în Git)
├── src/
│   ├── db.js                  ← conexiunea SQLite + crearea tabelelor
│   ├── routes/
│   │   ├── weather.js         ← GET /api/geocode, GET /api/weather
│   │   ├── favorites.js       ← CRUD /api/favorites
│   │   ├── settings.js        ← GET/PUT /api/settings
│   │   └── history.js         ← GET/DELETE /api/history
│   ├── services/
│   │   └── openMeteo.js       ← apelurile către Open-Meteo + timeout + cache
│   ├── middleware/
│   │   ├── validate.js        ← funcții de validare pentru body/query
│   │   └── errors.js          ← 404 pentru /api + handler central de erori
│   └── utils/
│       └── weatherCodes.js    ← cod WMO → text românesc + iconiță
└── public/                    ← tot ce vede browserul (pornit din drafturi)
    ├── index.html  oras.html  favorite.html  istoric.html  setari.html
    ├── css/styles.css
    └── js/
        ├── api.js             ← fetch către /api, tratează erorile într-un singur loc
        ├── ui.js              ← randare carduri, toast-uri, stări de încărcare/eroare
        ├── icons.js           ← iconițele SVG
        ├── search.js          ← bara de căutare + sugestii (folosită pe toate paginile)
        ├── home.js  city.js  favorites.js  history.js  settings.js
        └── chart.js           ← graficul pe 24 de ore (SVG)
```

---

## 5. API-ul nostru (Express)

Toate răspunsurile sunt JSON. Erorile au mereu aceeași formă:
`{ "error": { "code": "CITY_NOT_FOUND", "message": "Nu am găsit orașul „Clujj”." } }`

| Metodă | Rută | Intrare | Răspuns | Erori |
|---|---|---|---|---|
| GET | `/api/geocode?q=Cluj` | `q`: 2–60 caractere | `[{ name, region, country, lat, lon }]` | 400 dacă `q` lipsește/e prea scurt |
| GET | `/api/weather?lat=46.77&lon=23.6` | `lat` −90…90, `lon` −180…180 | `{ current, hourly[24], daily[5], units }` | 400, 502 (Open-Meteo a dat eroare), 504 (timeout) |
| GET | `/api/favorites` | — | lista favoritelor | — |
| POST | `/api/favorites` | `{ name, country, lat, lon, nickname?, note? }` | favoritul creat, **201** | 400 validare, 409 deja există |
| PUT | `/api/favorites/:id` | `{ nickname?, note?, isDefault? }` | favoritul modificat | 400, 404 |
| DELETE | `/api/favorites/:id` | — | **204** | 404 |
| GET | `/api/settings` | — | `{ tempUnit, windUnit, theme, defaultFavoriteId }` | — |
| PUT | `/api/settings` | aceleași câmpuri | setările salvate | 400 |
| GET | `/api/history?limit=50` | — | ultimele căutări | — |
| DELETE | `/api/history` · `/api/history/:id` | — | **204** | 404 |

Detaliu util la prezentare: în **Express 5** o funcție `async` care aruncă o eroare ajunge
automat în handler-ul central de erori — nu mai e nevoie de `try/catch` în fiecare rută.

---

## 6. Baza de date (SQLite)

```sql
CREATE TABLE IF NOT EXISTS favorites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  region      TEXT,
  country     TEXT    NOT NULL,
  lat         REAL    NOT NULL,
  lon         REAL    NOT NULL,
  nickname    TEXT    CHECK (length(nickname) <= 30),
  note        TEXT    CHECK (length(note) <= 140),
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (lat, lon)
);

CREATE TABLE IF NOT EXISTS settings (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),   -- un singur rând
  temp_unit           TEXT NOT NULL DEFAULT 'C'   CHECK (temp_unit IN ('C','F')),
  wind_unit           TEXT NOT NULL DEFAULT 'kmh' CHECK (wind_unit IN ('kmh','ms','mph')),
  theme               TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system','light','dark'))
);

CREATE TABLE IF NOT EXISTS search_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  query        TEXT NOT NULL,
  name         TEXT NOT NULL,
  country      TEXT,
  lat          REAL NOT NULL,
  lon          REAL NOT NULL,
  temperature  REAL,
  searched_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Regulă de aur: **doar interogări parametrizate** (`db.prepare('... WHERE id = ?').get(id)`),
niciodată text lipit în SQL.

---

## 7. API-ul extern: Open-Meteo

Căutare oraș (geocoding):
```
https://geocoding-api.open-meteo.com/v1/search?name=Cluj&count=5&language=ro&format=json
```

Vremea (curentă + 24 h + 5 zile), într-un singur apel:
```
https://api.open-meteo.com/v1/forecast?latitude=46.77&longitude=23.6
  &current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,
           wind_speed_10m,wind_direction_10m,pressure_msl,is_day
  &hourly=temperature_2m,precipitation_probability,weather_code
  &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,
         sunrise,sunset,uv_index_max,wind_speed_10m_max
  &timezone=auto&forecast_days=5
```
(°F și m/s: parametrii `temperature_unit=fahrenheit`, `wind_speed_unit=ms|mph`.)

Coduri meteo (WMO) → ce afișăm:

| Cod | Text | Iconiță |
|---|---|---|
| 0 | Senin | soare / lună (noaptea) |
| 1, 2 | Parțial noros | soare + nor |
| 3 | Înnorat | nor |
| 45, 48 | Ceață | ceață |
| 51–57 | Burniță | burniță |
| 61–67, 80–82 | Ploaie / averse | ploaie |
| 71–77, 85, 86 | Ninsoare | zăpadă |
| 95–99 | Furtună | fulger |

Serverul **normalizează** răspunsul (nume scurte, zile în română) și îl ține în cache 10 minute
pe coordonate — mai rapid și nu depășim limitele API-ului.

---

## 8. Tratarea erorilor

| Situație | Unde se prinde | Ce vede utilizatorul |
|---|---|---|
| Câmp de căutare gol / 1 literă | client, înainte de `fetch` | „Scrie numele unui oraș (minim 2 litere).” sub câmp |
| Orașul nu există | server → 404 `CITY_NOT_FOUND` | Card „Nu am găsit orașul «Clujj». Verifică scrierea.” |
| Open-Meteo răspunde cu eroare | server → 502 | „Serviciul meteo nu răspunde acum.” + buton **Reîncearcă** |
| Open-Meteo nu răspunde în 8 s | `AbortController` → 504 | Același card, cu „a durat prea mult” |
| Fără internet în browser | `fetch` aruncă `TypeError` | Banner „Ești offline. Afișăm ultimele date salvate.” |
| Favorit duplicat | SQLite `UNIQUE` → 409 | Toast „Orașul e deja la favorite.” |
| Date invalide trimise direct la API | `validate.js` → 400 | Mesaj pe câmp; aplicația nu se blochează |
| Rută API inexistentă | middleware 404 | JSON cu `NOT_FOUND` |

Toate apelurile din browser trec prin `api.js`, care transformă orice eroare într-un mesaj prietenos.
Fiecare zonă care se încarcă are 3 stări: **se încarcă** (schelet gri) · **eroare** · **gata**.

---

## 9. Validarea formularelor

| Formular | Câmp | Regulă | Mesaj |
|---|---|---|---|
| Căutare | oraș | obligatoriu, 2–60 caractere, litere/spații/cratimă | „Scrie numele unui oraș (minim 2 litere).” |
| Favorit | oraș | obligatoriu, ales din sugestii (are lat/lon) | „Alege orașul din listă.” |
| Favorit | nume afișat | opțional, max 30 caractere | „Maxim 30 de caractere.” |
| Favorit | notă | opțional, max 140 caractere, contor vizibil | „Maxim 140 de caractere.” |
| Setări | unități / temă | doar valorile din listă | „Alege o valoare validă.” |

În browser: atribute HTML (`required`, `minlength`, `maxlength`, `pattern`) + mesaje proprii în JS
cu `aria-describedby` (exact ca la curs). Pe server: aceleași reguli, repetate în `validate.js` —
**serverul nu are încredere în ce vine din browser**.
Textul primit de la utilizator se afișează doar cu `textContent`, niciodată cu `innerHTML`.

---

## 10. Design

- Drafturi: pozele din folderul `Drafturi/` (laptop + telefon, temă luminoasă și întunecată).
- Culori și fonturi definite o singură dată ca variabile CSS în `:root` (temă luminoasă + întunecată).
- Font: **Manrope** (Google Fonts); cifrele mari pentru temperatură sunt subțiri (300).
- Cardul principal își schimbă fundalul după vreme: senin, noros, ploaie, ninsoare, furtună, noapte.
- Breakpoint-uri: `< 768px` telefon (meniu jos), `768–1023px` tabletă, `≥ 1024px` laptop.
- Accesibilitate: HTML semantic (`header`, `nav`, `main`, `section`), un singur `h1` pe pagină,
  etichete pe toate câmpurile, focus vizibil, contrast suficient, link „Sari la conținut”.

---

## 11. Împărțirea muncii

**3 membri** (cu 2 membri, B și C se unesc):

| Membru | Responsabil de | Pagini |
|---|---|---|
| **A — Backend** | `server.js`, rutele Express, `openMeteo.js`, SQLite, validare server, erori | — |
| **B — Interfață** | HTML/CSS pornind de la drafturi, responsive, accesibilitate, tema întunecată | Acasă, Oraș |
| **C — Logică client** | `api.js`, căutare + sugestii, formulare + validare, stări de eroare, grafic | Favorite, Istoric, Setări |

Toți: fiecare face commit-uri în fiecare săptămână și **prezintă codul altui membru** o dată pe săptămână
(15 minute) — așa poate fiecare să explice orice parte la predare.

---

## 12. Calendar (ajustați după lungimea modulului)

| Săpt. | Ce livrăm | Cine |
|---|---|---|
| 1 | Repo GitHub, structura de foldere, `npm init`, Express „Hello”, drafturi aprobate, README schelet | toți |
| 2 | `/api/geocode` și `/api/weather` funcționale (testate în browser / Thunder Client) + coduri WMO | A |
| 2 | `public/` din drafturi: antet, navigare, `styles.css` comun, pagini statice | B |
| 3 | Acasă + Oraș legate la API: căutare, vremea curentă, 5 zile, grafic 24 h | B + C |
| 4 | SQLite + CRUD favorite + pagina Favorite (formular cu validare) | A + C |
| 5 | Setări + Istoric + oraș implicit + °C/°F | A + C |
| 5 | Responsive pe telefon, tema întunecată, stări de încărcare/eroare | B |
| 6 | Testare completă (vezi checklist), corecturi, README final, capturi de ecran | toți |
| 7 | Repetiție prezentare: fiecare explică o parte pe care **n-a scris-o** | toți |

---

## 13. Git

- Un repo pe GitHub, toți membrii colaboratori.
- `main` mereu funcțional; fiecare funcționalitate pe branch: `feat/cautare`, `feat/favorite-crud`, `fix/eroare-timeout`.
- Pull request + review de la alt membru înainte de merge.
- Commit-uri mici, în română sau engleză, dar consecvent: `feat: adaugă prognoza pe 5 zile`.
- `.gitignore`: `node_modules/`, `data/*.db`, `.env`, `.DS_Store`.

---

## 14. README (ce trebuie să conțină)

1. Ce face aplicația (2–3 rânduri + captură de ecran)
2. Funcționalități
3. Tehnologii (Node.js, Express, SQLite, Open-Meteo)
4. Cum se rulează:
   ```bash
   git clone <repo>
   cd panou-meteo
   npm install
   npm run dev        # sau: npm start
   # deschide http://localhost:3000
   ```
5. Structura proiectului + lista rutelor API
6. Echipa și ce a făcut fiecare

---

## 15. Opțional: provocarea 19/20

Aplicația trebuie extinsă cu **conturi de utilizator, roluri, date private** și trebuie să reziste
atacurilor unor agenți AI. Pentru Panou Meteo:

- Pagini noi: **Autentificare / Cont nou** și **Contul meu**.
- Tabel `users (id, email UNIQUE, password_hash, role, created_at)`; `favorites.user_id` → fiecare își vede doar favoritele lui.
- Roluri: `user` și `admin` (adminul vede statistici: cele mai căutate orașe).
- Parole cu `bcrypt`, sesiuni cu `express-session` (cookie `httpOnly`, `sameSite`), sau JWT în cookie.
- Securitate: `helmet` (antete + CSP), `express-rate-limit` pe login și pe `/api/geocode`,
  validare strictă pe server, SQL parametrizat, `textContent` în loc de `innerHTML`,
  verificare de proprietar la `PUT/DELETE /api/favorites/:id` (altfel un utilizator poate șterge favoritele altuia).
- Opțional: încărcare imagine de profil (`multer`, doar `image/png|jpeg`, max 1 MB).

Decizia se ia în săptămâna 3 — dacă baza e gata la timp, merită.

---

## 16. Checklist înainte de predare

- [ ] `npm install && npm start` merge pe un calculator curat
- [ ] Căutare: oraș valid, oraș inexistent, câmp gol, diacritice („Brașov”, „Iași”)
- [ ] Prognoza are exact 5 zile, cu min/max corecte
- [ ] Favorite: adaug, editez, șterg, duplicat → mesaj, rămân după repornirea serverului
- [ ] Setări: °C/°F se aplică peste tot și rămân după reload
- [ ] Oprește internetul → mesaj clar, aplicația nu se blochează
- [ ] Toate cele 5 pagini merg pe telefon (375px) și pe laptop
- [ ] Navigare din tastatură (Tab) pe toate paginile
- [ ] Fiecare membru are commit-uri în istoricul Git
- [ ] README complet
- [ ] Fiecare membru poate explica orice fișier

---

## De lămurit cu echipa / profesorul

- Câți membri are echipa și cine ce preia (§11).
- Data exactă de predare → ajustăm calendarul (§12).
- Mergem pe provocarea 19/20? (§15)
