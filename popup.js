const teams = {
  team1: ["Stefan", "Atanas", "Lilly", "Panayot", "Nikol"],
  team2: ["Christina", "Delia", "Alina", "Miroslav", "Borislav"],
};

let currentTeam = "team1"; // Initialize with Team 1

// Load the last selected team from storage
chrome.storage.local.get("currentTeam", (result) => {
  if (result.currentTeam && (result.currentTeam === "team1" || result.currentTeam === "team2")) {
    currentTeam = result.currentTeam;
  }

  // Continue with the rest of the code
  const nameList = document.getElementById("nameList-CC-Helper");
  const resetButton = document.getElementById("resetButton-CC-Helper");
  const toggleTeamButton = document.getElementById("toggleTeamButton-CC-Helper");

  // Initialize name counters
  const counters = {};

  // Retrieve stored counter values, or initialize to 0 if not found
  chrome.storage.local.get([...teams.team1, ...teams.team2], (result) => {
    [...teams.team1, ...teams.team2].forEach((name) => {
      counters[name] = result[name] || 0;
    });

    // Update the counters displayed
    updateCounters();
  });

  // Update the counters displayed
  function updateCounters() {
    nameList.innerHTML = "";
    teams[currentTeam].forEach((name) => {
      const button = document.createElement("button");
      button.textContent = `${name} (${counters[name]})`;
      button.addEventListener("click", () => {
        counters[name]++;
        updateCounters();
        saveCounters();
      });
      nameList.appendChild(button);
    });
  }

  // Save the counter values in Browser
  function saveCounters() {
    chrome.storage.local.set(counters);
  }

  // Reset all counters
  resetButton.addEventListener("click", () => {
    [...teams.team1, ...teams.team2].forEach((name) => {
      counters[name] = 0;
    });
    updateCounters();
    saveCounters();
  });

  // Toggle between teams
  toggleTeamButton.addEventListener("click", () => {
    currentTeam = currentTeam === "team1" ? "team2" : "team1";
    updateCounters();

    // Save the current team to Browser
    chrome.storage.local.set({ currentTeam });
  });

  // Initial update
  updateCounters();
});
