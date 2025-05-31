// Game Count - Modern Tally Counter
// All logic for player management, counters, localStorage, sorting, and UI updates

document.addEventListener('DOMContentLoaded', function () {
  const addPlayerForm = document.getElementById('addPlayerForm');
  const playerNameInput = document.getElementById('playerName');
  const playersGrid = document.getElementById('playersGrid');
  const clearCountsBtn = document.getElementById('clearCounts');
  const clearAllBtn = document.getElementById('clearAll');

  // Local Storage Key
  const STORAGE_KEY = 'gameCountPlayers';

  // Load players from localStorage
  function loadPlayers() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // Save players to localStorage
  function savePlayers(players) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }

  // Sort players by least games played, then by name
  function sortPlayers(players) {
    return players.slice().sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      return a.name.localeCompare(b.name);
    });
  }

  // Render players grid
  function renderPlayers() {
    let players = loadPlayers();
    players = sortPlayers(players);
    // --- Animation for reordering ---
    const prevOrder = Array.from(playersGrid.children).map(div => div.querySelector('.player-btn')?.getAttribute('data-name'));
    const newOrder = players.map(player => player.name);
    // Map current DOM nodes by player name
    const nodeMap = {};
    Array.from(playersGrid.children).forEach(div => {
      const btn = div.querySelector('.player-btn');
      if (btn) nodeMap[btn.getAttribute('data-name')] = div;
    });
    // Animate moving out (for removed players)
    prevOrder.forEach(name => {
      if (!newOrder.includes(name)) {
        const div = nodeMap[name];
        if (div) {
          div.style.transition = 'opacity 0.7s';
          div.style.opacity = '0';
        }
      }
    });
    // Animate reordering
    newOrder.forEach((name, idx) => {
      const div = nodeMap[name];
      if (div) {
        div.style.transition = 'transform 1.2s cubic-bezier(0.4,0,0.2,1)';
        div.style.transform = `translateY(${(idx - prevOrder.indexOf(name)) * 110}px)`;
        setTimeout(() => {
          div.style.transform = '';
        }, 100);
      }
    });
    // Wait for animation, then update DOM
    setTimeout(() => {
      playersGrid.innerHTML = '';
      players.forEach((player, idx) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-6 col-md-3';
        const btn = document.createElement('button');
        btn.className = 'player-btn shadow-sm mb-2';
        btn.setAttribute('data-name', player.name);
        btn.setAttribute('type', 'button');
        btn.innerHTML = `<span>${escapeHtml(player.name)}</span><span class="counter">${player.count}</span>`;
        btn.addEventListener('click', function () {
          incrementPlayer(player.name);
        });
        colDiv.appendChild(btn);
        playersGrid.appendChild(colDiv);
      });
    }, 700);
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  // Add new player
  function addPlayer(name) {
    let players = loadPlayers();
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      animatePlayer(name);
      return;
    }
    players.push({ name: name, count: 0 });
    savePlayers(players);
    renderPlayers();
  }

  // Increment player's counter
  function incrementPlayer(name) {
    let players = loadPlayers();
    const idx = players.findIndex(p => p.name === name);
    if (idx !== -1) {
      players[idx].count += 1;
      savePlayers(players);
      renderPlayers();
      animatePlayer(name);
    }
  }

  // Animate counter pop
  function animatePlayer(name) {
    setTimeout(() => {
      const btn = document.querySelector(`.player-btn[data-name="${CSS.escape(name)}"] .counter`);
      if (btn) {
        btn.classList.remove('animated');
        void btn.offsetWidth; // reflow
        btn.classList.add('animated');
        setTimeout(() => btn.classList.remove('animated'), 350);
      }
    }, 30);
  }

  // Clear all counts to zero
  function clearCounts() {
    let players = loadPlayers();
    players = players.map(p => ({ ...p, count: 0 }));
    savePlayers(players);
    renderPlayers();
  }

  // Remove all players
  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    renderPlayers();
  }

  // Form submit handler
  addPlayerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = playerNameInput.value.trim();
    if (name.length === 0) return;
    addPlayer(name);
    playerNameInput.value = '';
    playerNameInput.focus();
  });

  clearCountsBtn.addEventListener('click', clearCounts);
  clearAllBtn.addEventListener('click', clearAll);

  // Initial render
  renderPlayers();
});