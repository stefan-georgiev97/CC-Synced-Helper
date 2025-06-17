
const supabaseUrl = 'https://iyvbhidqylxrmrqzivok.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dmJoaWRxeWx4cm1ycXppdm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTgyNzQsImV4cCI6MjA2NTczNDI3NH0.2RYOlb4XGwFy5Zg8naD92cfWalibjVghITeBga_KTkk';

const restUrl = supabaseUrl + '/rest/v1/counters';
const realtimeUrl = 'wss://iyvbhidqylxrmrqzivok.supabase.co/realtime/v1/websocket?apikey=' + supabaseKey + '&vsn=1.0.0';

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
    headers,
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

// PURE WebSocket for realtime updates:
function connectWebSocket() {
  const socket = new WebSocket(realtimeUrl);

  socket.onopen = () => {
    const joinMsg = {
      topic: "realtime:public:counters",
      event: "phx_join",
      payload: {},
      ref: "1"
    };
    socket.send(JSON.stringify(joinMsg));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.event === "postgres_changes" && data.payload) {
      const { name, count } = data.payload.new;
      counters[name] = count;
      updateCounters();
    }
  };

  socket.onclose = () => {
    setTimeout(connectWebSocket, 2000); // auto-reconnect
  };
}

connectWebSocket();
loadCounters();
