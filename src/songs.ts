interface Song {
    id: number;
    filename: string;
    name: string;
    date: string;
    streamer: string;
    info: string;
}

// load the list of songs in public dir
const response = await fetch("/data/songs.json");

if (!response.ok) {
    throw new Error(`Error loading song list: ${response.status}`);
}

const songs: Song[] = await response.json();

let selectedSong: Song | undefined;

let sortColumn: keyof Song = "date";
let sortDescending = true;

let searchTerm = "";
let streamerFilter = "";

// wrapper fn for query selector to stop cast bloat
function $<T extends Element>(selector: string): T {
    const el = document.querySelector<T>(selector);

    if (!el) {
        throw new Error(`el missing: ${selector}`);
    }
    return el;
}

// group elements
const el = {
    table: $<HTMLTableElement>("#songs-table"),
    search: $<HTMLInputElement>("#song-search"),
    streamer: $<HTMLSelectElement>("#streamer-filter"),

    emptyPanel: $<HTMLDivElement>("#song-panel-empty"),
    panelContent: $<HTMLDivElement>("#song-panel-content"),

    songTitle: $<HTMLDivElement>("#song-title"),
    songDate: $<HTMLDivElement>("#song-date"),
    songAudio: $<HTMLAudioElement>("#song-audio"),

    songTwitch: $<HTMLAnchorElement>("#song-twitch"),
    songTwitchName: $<HTMLDivElement>("#song-twitch-name"),
    songDownload: $<HTMLAnchorElement>("#song-download"),
};

// populate the table
populateStreamers();
render();

// filter by streamer
function populateStreamers() {
    const streamers = [
        ...new Set(
            songs
                .map((song) => song.streamer)
                .filter(Boolean),
        ),
    ].sort();

    el.streamer.innerHTML = `
    <option value="">All streamers</option>
  `;

    for (const name of streamers) {
        const option = document.createElement("option");

        option.value = name;
        option.textContent = name.toUpperCase();

        el.streamer.appendChild(option);
    }
}

// filtering & sorting
function getFilteredSongs(): Song[] {
    let result = [...songs];

    // search
    if (searchTerm) {
        const query = searchTerm.toLowerCase();

        result = result.filter((song) =>
            [
                song.name,
                song.streamer,
                song.date,
                song.info,
            ].some((value) =>
                value.toLowerCase().includes(query),
            ),
        );
    }

    // streamer filter
    if (streamerFilter) {
        result = result.filter(
            (song) => song.streamer === streamerFilter,
        );
    }

    // sorting
    result.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        const comparison = String(aValue).localeCompare(
            String(bValue),
            undefined,
            {
                numeric: true,
            },
        );

        return sortDescending
            ? -comparison
            : comparison;
    });

    return result;
}

function sortBy(column: keyof Song) {
    if (sortColumn === column) {
        sortDescending = !sortDescending;
    } else {
        sortColumn = column;
        sortDescending = false;
    }
    render();
}

function selectSong(song: Song) {
    selectedSong = song;
    updateSongPanel();
    render();
}

function updateSongPanel() {
    if (!selectedSong) {
        el.emptyPanel.classList.remove("hidden");
        el.panelContent.classList.add("hidden");
        el.panelContent.classList.remove("flex");
        el.songAudio.removeAttribute("src");
        el.songAudio.load();
        return;
    }

    el.emptyPanel.classList.add("hidden");
    el.panelContent.classList.remove("hidden");
    el.panelContent.classList.add("flex");

    // song info
    const streamerName = selectedSong.streamer
        ? `${selectedSong.streamer.toUpperCase()} - `
        : "";

    el.songTitle.textContent =
        `${streamerName}${selectedSong.name}`;

    const date = selectedSong.date.split("T")[0].split("-");

    el.songDate.textContent = `Created on ${new Date(
        Number(date[0]),
        Number(date[1]) - 1,
        Number(date[2]),
    ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    })}`;

    // audio
    const audioUrl =
        `https://notchris.net/audio/${encodeURIComponent(
            selectedSong.filename,
        )}`;

    el.songAudio.src = audioUrl;

    el.songAudio.addEventListener(
        "canplay",
        () => {
            el.songAudio.play().catch(console.error);
        },
        { once: true },
    );

    el.songAudio.load();

    // twitch
    if (selectedSong.streamer) {
        el.songTwitch.classList.remove("hidden");

        el.songTwitch.href =
            `https://twitch.tv/${encodeURIComponent(
                selectedSong.streamer,
            )}`;

        el.songTwitchName.textContent =
            selectedSong.streamer.toUpperCase();
    } else {
        el.songTwitch.classList.add("hidden");
        el.songTwitch.removeAttribute("href");
        el.songTwitchName.textContent = "";
    }

    // download link
    el.songDownload.href = audioUrl;
}

function render() {
    const filteredSongs = getFilteredSongs();

    el.table.innerHTML = "";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    addHeader(headerRow, "Name", "name");
    addHeader(headerRow, "Streamer", "streamer");
    addHeader(headerRow, "Date", "date", ["hidden", "lg:block"]);

    // listen header
    const listenHeader = document.createElement("th");
    headerRow.appendChild(listenHeader);

    thead.appendChild(headerRow);
    el.table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (const song of filteredSongs) {
        const row = document.createElement("tr");

        // highlight selected
        if (selectedSong?.id === song.id) {
            row.classList.add("selected");
        }
        // row select
        row.addEventListener("click", () => {
            selectSong(song);
        });

        addCell(row, song.name);
        addCell(
            row,
            song.streamer.toUpperCase() || "-",
        );
        addCell(row, song.date, ["hidden", "lg:block"]);

        // listen
        const listenCell = document.createElement("td");
        const button = document.createElement("button");
        button.innerHTML = `▶`;
        button.type = "button";

        button.disabled =
            selectedSong?.id === song.id;

        button.className = "button"
        button.classList.add("ml-2")

        button.addEventListener("click", (event) => {
            event.stopPropagation();
            selectSong(song);
        });

        listenCell.appendChild(button);
        row.appendChild(listenCell);

        tbody.appendChild(row);
    }

    el.table.appendChild(tbody);
}

//helpers 
function addHeader(
    row: HTMLTableRowElement,
    label: string,
    column: keyof Song,
    classes?: string[]
) {
    const th = document.createElement("th");
    th.classList.add(...classes || []);

    const button = document.createElement("button");

    button.type = "button";

    button.className =
        "cursor-pointer hover:opacity-50 " +
        "flex items-center gap-2";

    const chevron = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    `;

    let text = `<span>${label}</span>`;

    if (sortColumn === column) {
        text += sortDescending ? `<span>${chevron}</span>` : `<span class="-scale-y-100">${chevron}</span>`;
    }

    button.innerHTML = text;

    button.addEventListener("click", () => {
        sortBy(column);
    });

    th.appendChild(button);
    row.appendChild(th);
}

function addCell(
    row: HTMLTableRowElement,
    value: string,
    classes?: string[]
) {
    const td = document.createElement("td");
    td.classList.add(...classes || []);
    td.textContent = value;
    row.appendChild(td);
}

// events 

el.search.addEventListener("input", () => {
    searchTerm = el.search.value;
    render();
});

el.streamer.addEventListener("change", () => {
    streamerFilter = el.streamer.value;
    render();
});