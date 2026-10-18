// City / country autocomplete. Data is bundled (no network calls) so typing a home town
// never leaves the browser. Usage: BuddyCities.attach(input, { onPick }) → detach().
window.BuddyCities = (function () {
  // "Country: City|City|…" — parsed once at load.
  const RAW = [
    "India: Mumbai|Delhi|New Delhi|Bengaluru|Hyderabad|Chennai|Kolkata|Pune|Ahmedabad|Jaipur|Surat|Lucknow|Kanpur|Nagpur|Indore|Bhopal|Patna|Vadodara|Ludhiana|Agra|Nashik|Varanasi|Amritsar|Chandigarh|Kochi|Thiruvananthapuram|Coimbatore|Mysuru|Mangaluru|Visakhapatnam|Vijayawada|Bhubaneswar|Guwahati|Dehradun|Rishikesh|Udaipur|Jodhpur|Goa|Panaji|Shimla|Manali|Leh|Srinagar|Gurugram|Noida|Ranchi|Raipur|Madurai|Pondicherry|Darjeeling",
    "Portugal: Lisbon|Porto|Faro|Coimbra|Braga|Funchal",
    "Spain: Madrid|Barcelona|Valencia|Seville|Málaga|Bilbao|Granada|Palma de Mallorca|Ibiza|San Sebastián",
    "France: Paris|Nice|Lyon|Marseille|Bordeaux|Toulouse|Strasbourg|Lille|Montpellier",
    "Italy: Rome|Milan|Florence|Venice|Naples|Turin|Bologna|Verona|Palermo|Pisa",
    "Germany: Berlin|Munich|Hamburg|Frankfurt|Cologne|Düsseldorf|Stuttgart|Dresden|Leipzig",
    "United Kingdom: London|Manchester|Edinburgh|Glasgow|Birmingham|Liverpool|Bristol|Oxford|Cambridge|Leeds|Belfast",
    "Ireland: Dublin|Cork|Galway",
    "Netherlands: Amsterdam|Rotterdam|The Hague|Utrecht|Eindhoven",
    "Belgium: Brussels|Antwerp|Bruges|Ghent",
    "Switzerland: Zurich|Geneva|Basel|Lucerne|Interlaken|Bern",
    "Austria: Vienna|Salzburg|Innsbruck",
    "Czech Republic: Prague|Brno",
    "Poland: Warsaw|Kraków|Gdańsk|Wrocław",
    "Hungary: Budapest",
    "Greece: Athens|Thessaloniki|Santorini|Mykonos|Heraklion",
    "Croatia: Zagreb|Split|Dubrovnik",
    "Denmark: Copenhagen|Aarhus",
    "Sweden: Stockholm|Gothenburg|Malmö",
    "Norway: Oslo|Bergen|Tromsø",
    "Finland: Helsinki",
    "Iceland: Reykjavík",
    "Estonia: Tallinn",
    "Latvia: Riga",
    "Lithuania: Vilnius",
    "Romania: Bucharest|Cluj-Napoca",
    "Bulgaria: Sofia",
    "Serbia: Belgrade",
    "Slovenia: Ljubljana",
    "Slovakia: Bratislava",
    "Malta: Valletta",
    "Cyprus: Limassol|Nicosia",
    "Montenegro: Kotor",
    "Albania: Tirana",
    "Turkey: Istanbul|Ankara|Antalya|Izmir|Cappadocia",
    "Russia: Moscow|Saint Petersburg",
    "Ukraine: Kyiv|Lviv",
    "Georgia: Tbilisi|Batumi",
    "Armenia: Yerevan",
    "United States: New York|Los Angeles|San Francisco|Chicago|Miami|Las Vegas|Seattle|Boston|Washington, D.C.|Austin|Houston|Dallas|San Diego|New Orleans|Nashville|Denver|Portland|Philadelphia|Atlanta|Honolulu|Orlando|Phoenix|Minneapolis|Detroit",
    "Canada: Toronto|Vancouver|Montreal|Calgary|Ottawa|Quebec City|Edmonton",
    "Mexico: Mexico City|Cancún|Guadalajara|Oaxaca|Tulum|Playa del Carmen|Monterrey",
    "Cuba: Havana",
    "Costa Rica: San José",
    "Guatemala: Antigua Guatemala",
    "Panama: Panama City",
    "Jamaica: Kingston|Montego Bay",
    "Dominican Republic: Punta Cana|Santo Domingo",
    "Puerto Rico: San Juan",
    "Brazil: Rio de Janeiro|São Paulo|Salvador|Florianópolis|Brasília|Belo Horizonte|Recife|Fortaleza",
    "Argentina: Buenos Aires|Mendoza|Córdoba|Bariloche",
    "Chile: Santiago|Valparaíso",
    "Peru: Lima|Cusco|Arequipa",
    "Colombia: Bogotá|Medellín|Cartagena|Cali",
    "Ecuador: Quito|Guayaquil",
    "Bolivia: La Paz",
    "Uruguay: Montevideo",
    "Venezuela: Caracas",
    "Japan: Tokyo|Kyoto|Osaka|Hiroshima|Sapporo|Nara|Fukuoka|Yokohama|Nagoya|Okinawa",
    "China: Beijing|Shanghai|Shenzhen|Guangzhou|Chengdu|Xi'an|Hangzhou|Guilin",
    "Hong Kong: Hong Kong",
    "Macau: Macau",
    "Taiwan: Taipei|Kaohsiung",
    "South Korea: Seoul|Busan|Jeju",
    "Thailand: Bangkok|Chiang Mai|Phuket|Krabi|Pattaya|Koh Samui",
    "Vietnam: Hanoi|Ho Chi Minh City|Da Nang|Hoi An|Ha Long",
    "Cambodia: Phnom Penh|Siem Reap",
    "Laos: Luang Prabang|Vientiane",
    "Myanmar: Yangon",
    "Malaysia: Kuala Lumpur|Penang|Langkawi|Malacca",
    "Singapore: Singapore",
    "Indonesia: Bali|Jakarta|Ubud|Yogyakarta|Lombok",
    "Philippines: Manila|Cebu|Boracay|Palawan",
    "Sri Lanka: Colombo|Kandy|Galle",
    "Nepal: Kathmandu|Pokhara",
    "Bhutan: Thimphu|Paro",
    "Bangladesh: Dhaka|Chittagong",
    "Pakistan: Karachi|Lahore|Islamabad",
    "Maldives: Malé",
    "United Arab Emirates: Dubai|Abu Dhabi|Sharjah",
    "Qatar: Doha",
    "Saudi Arabia: Riyadh|Jeddah",
    "Oman: Muscat",
    "Bahrain: Manama",
    "Kuwait: Kuwait City",
    "Jordan: Amman|Petra",
    "Israel: Tel Aviv|Jerusalem",
    "Lebanon: Beirut",
    "Egypt: Cairo|Alexandria|Luxor|Sharm El Sheikh",
    "Morocco: Marrakech|Casablanca|Fes|Rabat|Tangier|Chefchaouen",
    "Tunisia: Tunis",
    "South Africa: Cape Town|Johannesburg|Durban|Pretoria",
    "Kenya: Nairobi|Mombasa",
    "Tanzania: Zanzibar|Dar es Salaam|Arusha",
    "Uganda: Kampala",
    "Rwanda: Kigali",
    "Ethiopia: Addis Ababa",
    "Nigeria: Lagos|Abuja",
    "Ghana: Accra",
    "Senegal: Dakar",
    "Namibia: Windhoek",
    "Botswana: Gaborone",
    "Zimbabwe: Victoria Falls|Harare",
    "Mauritius: Port Louis",
    "Seychelles: Victoria",
    "Madagascar: Antananarivo",
    "Australia: Sydney|Melbourne|Brisbane|Perth|Adelaide|Gold Coast|Cairns|Hobart|Canberra|Darwin",
    "New Zealand: Auckland|Wellington|Queenstown|Christchurch|Rotorua",
    "Fiji: Nadi|Suva",
    "Uzbekistan: Tashkent|Samarkand",
    "Kazakhstan: Almaty|Astana",
    "Mongolia: Ulaanbaatar",
    "Iran: Tehran|Isfahan",
    "Iraq: Baghdad|Erbil",
    "Azerbaijan: Baku",
    "Luxembourg: Luxembourg",
    "Monaco: Monaco",
    "Bosnia and Herzegovina: Sarajevo|Mostar",
    "North Macedonia: Skopje|Ohrid",
    "Belarus: Minsk",
    "Moldova: Chișinău",
    "Paraguay: Asunción",
    "Honduras: Roatán",
    "Nicaragua: Granada",
    "El Salvador: San Salvador",
    "Belize: Belize City",
    "Bahamas: Nassau",
    "Barbados: Bridgetown",
    "Trinidad and Tobago: Port of Spain",
    "Papua New Guinea: Port Moresby",
    "Algeria: Algiers",
    "Cameroon: Douala",
    "Ivory Coast: Abidjan",
    "Mozambique: Maputo",
    "Zambia: Lusaka",
  ];
  // Countries that are only searchable by name (no bundled cities).
  const EXTRA_COUNTRIES = ["Afghanistan", "Andorra", "Angola", "Brunei", "Chad", "Congo", "Eritrea", "Gabon", "Haiti", "Kyrgyzstan", "Libya", "Liechtenstein", "Mali", "Niger", "North Korea", "Samoa", "San Marino", "Somalia", "Sudan", "Syria", "Tajikistan", "Togo", "Tonga", "Turkmenistan", "Vanuatu", "Yemen"];

  const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const ENTRIES = [];
  RAW.forEach((line) => {
    const [country, list] = line.split(": ");
    list.split("|").forEach((city) => ENTRIES.push({ city, country, label: city === country ? city : `${city}, ${country}` }));
    // City-states (Singapore, Hong Kong…) already appear once as a city.
    if (!list.split("|").includes(country)) ENTRIES.push({ city: "", country, label: country });
  });
  EXTRA_COUNTRIES.forEach((country) => ENTRIES.push({ city: "", country, label: country }));
  ENTRIES.forEach((e) => { e.cityKey = fold(e.city); e.countryKey = fold(e.country); });

  // `citiesOnly` leaves out country-only entries (for "the city you live in", destinations).
  function search(query, limit = 6, citiesOnly = false) {
    const q = fold(String(query || "").split(",")[0].trim());
    if (q.length < 2) return [];
    const scored = [];
    ENTRIES.forEach((e) => {
      if (citiesOnly && !e.city) return;
      let rank = -1;
      if (e.city && e.cityKey.startsWith(q)) rank = 0;
      else if (e.city && e.cityKey.split(/[\s\-'.]+/).some((w) => w.startsWith(q))) rank = 1;
      else if (!e.city && e.countryKey.startsWith(q)) rank = 2;
      else if (e.countryKey.startsWith(q) || e.countryKey.split(" ").some((w) => w.startsWith(q))) rank = 3;
      if (rank >= 0) scored.push({ e, rank });
    });
    scored.sort((a, b) => a.rank - b.rank || a.e.label.length - b.e.label.length);
    return scored.slice(0, limit).map(({ e }) => ({ city: e.city, country: e.country, label: e.label }));
  }

  let uid = 0;
  // The list entry a typed value matches exactly (case and accents ignored), or null. With
  // `citiesOnly`, "Lisbon" and "Lisbon, Portugal" match the city; otherwise the full label
  // ("Lisbon, Portugal", "Portugal") or a city name also matches.
  function find(value, citiesOnly = false) {
    const v = fold(String(value || "").trim().replace(/\s+/g, " "));
    if (!v) return null;
    return ENTRIES.find((e) => (!citiesOnly || e.city) && (fold(e.label) === v || (e.city && e.cityKey === v))) || null;
  }

  function attach(input, { onPick, citiesOnly = false } = {}) {
    if (input._acDetach) input._acDetach(); // re-attaching replaces the old instance
    const id = `ac-list-${++uid}`;
    const list = document.createElement("ul");
    list.className = "ac-list";
    list.id = id;
    list.setAttribute("role", "listbox");
    list.hidden = true;
    document.body.appendChild(list);
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", id);
    input.setAttribute("autocomplete", "off");

    let items = [], active = -1, picking = false;
    const anchor = () => input.closest(".city-bar") || input;

    const place = () => {
      if (!input.isConnected) return detach();
      const r = anchor().getBoundingClientRect();
      list.style.left = `${r.left + window.scrollX}px`;
      list.style.top = `${r.bottom + window.scrollY + 6}px`;
      list.style.width = `${r.width}px`;
    };
    const close = () => {
      list.hidden = true;
      active = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    };
    const highlight = (i) => {
      active = i;
      [...list.children].forEach((li, n) => {
        li.classList.toggle("on", n === i);
        li.setAttribute("aria-selected", n === i ? "true" : "false");
      });
      if (i >= 0) {
        input.setAttribute("aria-activedescendant", `${id}-${i}`);
        list.children[i].scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
    };
    const pick = (i) => {
      const item = items[i];
      if (!item) return;
      input.value = item.label;
      close();
      picking = true; // our own "input" event shouldn't reopen the list
      input.dispatchEvent(new Event("input", { bubbles: true }));
      picking = false;
      onPick?.(item);
    };
    const open = () => {
      items = search(input.value, 6, citiesOnly);
      // Nothing to suggest, or the input already holds an exact suggestion.
      if (!items.length || (items.length === 1 && items[0].label === input.value)) return close();
      list.replaceChildren(...items.map((it, i) => {
        const li = document.createElement("li");
        li.id = `${id}-${i}`;
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");
        const pin = document.createElement("span");
        pin.className = "ac-pin";
        pin.textContent = it.city ? "📍" : "🌍";
        const main = document.createElement("b");
        main.textContent = it.city || it.country;
        li.append(pin, main);
        if (it.city && it.city !== it.country) {
          const sub = document.createElement("span");
          sub.className = "ac-country";
          sub.textContent = it.country;
          li.append(sub);
        }
        li.addEventListener("mousedown", (e) => { e.preventDefault(); pick(i); });
        li.addEventListener("mousemove", () => active !== i && highlight(i));
        return li;
      }));
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      highlight(-1);
      place();
    };

    const onInput = () => { if (!picking) open(); };
    const onKey = (e) => {
      if (list.hidden) {
        if (e.key === "ArrowDown") { open(); e.preventDefault(); }
        return;
      }
      if (e.key === "ArrowDown") { highlight((active + 1) % items.length); e.preventDefault(); }
      else if (e.key === "ArrowUp") { highlight(active <= 0 ? items.length - 1 : active - 1); e.preventDefault(); }
      else if (e.key === "Enter") { e.preventDefault(); pick(active >= 0 ? active : 0); }
      else if (e.key === "Escape" || e.key === "Tab") close();
    };
    const onBlur = () => close();
    const onOutside = (e) => { if (e.target !== input && !list.contains(e.target)) close(); };
    const onMove = () => { if (!list.hidden) place(); };

    input.addEventListener("input", onInput);
    input.addEventListener("keydown", onKey);
    input.addEventListener("blur", onBlur);
    document.addEventListener("mousedown", onOutside);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);

    function detach() {
      input.removeEventListener("input", onInput);
      input.removeEventListener("keydown", onKey);
      input.removeEventListener("blur", onBlur);
      document.removeEventListener("mousedown", onOutside);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      list.remove();
      delete input._acDetach;
    }
    input._acDetach = detach;
    return detach;
  }

  return { search, find, attach, size: { cities: ENTRIES.filter((e) => e.city).length, countries: new Set(ENTRIES.map((e) => e.country)).size } };
})();
