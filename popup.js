const supabaseUrl = 'https://iyvbhidqylxrmrqzivok.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dmJoaWRxeWx4cm1ycXppdm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTgyNzQsImV4cCI6MjA2NTczNDI3NH0.2RYOlb4XGwFy5Zg8naD92cfWalibjVghITeBga_KTkk';

const restUrl = supabaseUrl + '/rest/v1/counters';
const headers = {
  'apikey': supabaseKey,
  'Authorization': 'Bearer ' + supabaseKey,
  'Content-Type': 'application/json'
};

const teams = {
  team1: ["Stefan", "Atanas", "Lilly", "Panayot", "Nikol"],
  team2: ["Christina", "Delia", "Alina", "Miroslav", "Borislav"],
};

let currentTeam = "team1";
const counters = {};

const nameList = document.getElementById("nameList-CC-Helper");
const resetButton = document.getElementById("resetButton-CC-Helper");
const toggleTeamButton = document.getElementById("toggleTeamButton-CC-Helper");

chrome.storage.local.get("currentTeam", (result) => {
  if (result.currentTeam && (result.currentTeam === "team1" || result.currentTeam === "team2")) {
    currentTeam = result.currentTeam;
  }
});

async function loadCounters() {
  const res = await fetch(restUrl + '?select=*', { headers });
  const data = await res.json();
  [...teams.team1, ...teams.team2].forEach(name => {
    const found = data.find(item => item.name === name);
    counters[name] = found ? found.count : 0;
  });
  updateCounters();
}

async function saveCounter(name) {
  await fetch(restUrl, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify([{ name, count: counters[name] }]),
  });
}

async function resetCounters() {
  [...teams.team1, ...teams.team2].forEach(name => {
    counters[name] = 0;
    saveCounter(name);
  });
  updateCounters();
}

function updateCounters() {
  nameList.innerHTML = "";
  teams[currentTeam].forEach(name => {
    const button = document.createElement("button");
    button.textContent = `${name} (${counters[name]})`;
    button.addEventListener("click", () => {
      counters[name]++;
      updateCounters();
      saveCounter(name);
    });
    nameList.appendChild(button);
  });
}

resetButton.addEventListener("click", resetCounters);

toggleTeamButton.addEventListener("click", () => {
  currentTeam = currentTeam === "team1" ? "team2" : "team1";
  updateCounters();
  chrome.storage.local.set({ currentTeam });
});

// Poll every 3 seconds to refresh data from Supabase
setInterval(() => {
  loadCounters();
}, 3000);

// Initial load
loadCounters();
