import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Replace with your actual values:
const supabaseUrl = 'https://iyvbhidqylxrmrqzivok.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dmJoaWRxeWx4cm1ycXppdm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTgyNzQsImV4cCI6MjA2NTczNDI3NH0.2RYOlb4XGwFy5Zg8naD92cfWalibjVghITeBga_KTkk';
const supabase = createClient(supabaseUrl, supabaseKey);

const teams = {
  team1: ["Stefan", "Atanas", "Lilly", "Panayot", "Nikol"],
  team2: ["Christina", "Delia", "Alina", "Miroslav", "Borislav"],
};

let currentTeam = "team1";

// Restore last selected team from local chrome storage
chrome.storage.local.get("currentTeam", (result) => {
  if (result.currentTeam && (result.currentTeam === "team1" || result.currentTeam === "team2")) {
    currentTeam = result.currentTeam;
  }
});

const counters = {};

const nameList = document.getElementById("nameList-CC-Helper");
const resetButton = document.getElementById("resetButton-CC-Helper");
const toggleTeamButton = document.getElementById("toggleTeamButton-CC-Helper");

// Load counters from Supabase
async function loadCounters() {
  const { data, error } = await supabase.from('counters').select('*');
  if (error) {
    console.error(error);
    return;
  }
  [...teams.team1, ...teams.team2].forEach(name => {
    const found = data.find(item => item.name === name);
    counters[name] = found ? found.count : 0;
  });
  updateCounters();
}

// Save a single counter update
async function saveCounter(name) {
  const { error } = await supabase.from('counters').upsert([{ name, count: counters[name] }]);
  if (error) console.error(error);
}

// Reset all counters
async function resetCounters() {
  [...teams.team1, ...teams.team2].forEach(name => {
    counters[name] = 0;
    saveCounter(name);
  });
  updateCounters();
}

// Display counters on UI
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

// Subscribe to realtime updates
supabase.channel('public:counters')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'counters' }, payload => {
    const { name, count } = payload.new;
    counters[name] = count;
    updateCounters();
  })
  .subscribe();

loadCounters();
