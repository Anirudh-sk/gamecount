// Game Count - Modern Tally Counter
// All logic for player management, counters, localStorage, sorting, and UI updates

document.addEventListener('DOMContentLoaded', function () {
    // Hide loading screen when DOM is ready
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.transition = 'opacity 0.5s ease-out';
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500);
      }, 100); // Small delay to show loading animation briefly
    }
  
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
      const emptyState = document.getElementById('emptyState');
      
      // Show/hide empty state
      if (players.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        playersGrid.innerHTML = '';
        return;
      } else {
        if (emptyState) emptyState.style.display = 'none';
      }
  
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
    clearAllBtn.addEventListener('click', function() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MATCH_STORAGE_KEY);
      localStorage.removeItem(TEAM_STORAGE_KEY);
      renderPlayers();
      renderTeamSection();
      renderSummarySection();
    });
    
    // Add event listeners for dropdown buttons
    const clearMatchesBtn = document.getElementById('clearMatches');
    const clearTeamsBtn = document.getElementById('clearTeams');
    const exportDataBtn = document.getElementById('exportData');
    
    if (clearMatchesBtn) {
      clearMatchesBtn.addEventListener('click', function() {
        localStorage.removeItem(MATCH_STORAGE_KEY);
        renderTeamSection();
        renderSummarySection();
      });
    }
    
    if (clearTeamsBtn) {
      clearTeamsBtn.addEventListener('click', function() {
        localStorage.removeItem(TEAM_STORAGE_KEY);
        renderTeamSection();
        renderSummarySection();
      });
    }
  
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', function() {
        // Export functionality can be added here
        alert('Export feature coming soon!');
      });
    }
  
    // --- TEAM MODE LOGIC ---
    // Local Storage Key for teams and matches
    const TEAM_STORAGE_KEY = 'gameCountTeams';
    const MATCH_STORAGE_KEY = 'gameCountMatches';
    
    // Generate all possible 2-player team combinations from players
    function generateTeams(players) {
      const teams = [];
      const seen = new Set();
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          // Sort names to ensure uniqueness (p1,p2 same as p2,p1)
          const combo = [players[i].name, players[j].name].sort().join('|');
          if (!seen.has(combo)) {
            teams.push({ players: [players[i].name, players[j].name], wins: 0 });
            seen.add(combo);
          }
        }
      }
      return teams;
    }
    
    // Load teams from localStorage (deprecated, now generated dynamically)
    function loadTeams() {
      const players = loadPlayers();
      return generateTeams(players);
    }
    
    // Save teams to localStorage (no longer used)
    function saveTeams(teams) {
      // No-op
    }
    
    // Load matches from localStorage
    function loadMatches() {
      try {
        const data = localStorage.getItem(MATCH_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    }
    
    // Save matches to localStorage
    function saveMatches(matches) {
      localStorage.setItem(MATCH_STORAGE_KEY, JSON.stringify(matches));
    }
    
    // Render Team Section
    function renderTeamSection() {
      const teamSection = document.getElementById('teamSection');
      if (!teamSection) return;
      
      teamSection.innerHTML = '';
      const players = loadPlayers();
      const teams = generateTeams(players);
      
      // Team list UI
      const teamList = document.createElement('div');
      teamList.className = 'mb-4 d-flex flex-wrap gap-2';
      if (teams.length === 0) {
        teamList.innerHTML = '<div>Add at least 2 players to create teams.</div>';
      } else {
        teams.forEach((team, idx) => {
          const btn = document.createElement('button');
          btn.className = 'btn btn-outline-primary mb-2 team-combo-btn';
          btn.textContent = team.players.join(' & ');
          btn.setAttribute('data-team-idx', idx);
          btn.onclick = function() {
            selectTeamForMatch(idx);
          };
          teamList.appendChild(btn);
        });
      }
      teamSection.appendChild(teamList);
      
      // Match selection UI
      if (teams.length >= 2) {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'mb-3';
        matchDiv.innerHTML = '<div class="fw-bold mb-2">Select two teams and record match:</div>';
        let selectedTeams = [];
        
        window.selectTeamForMatch = function(idx) {
          if (selectedTeams.length < 2 && !selectedTeams.includes(idx)) {
            selectedTeams.push(idx);
            document.querySelectorAll('.team-combo-btn')[idx].classList.add('active');
            
            // Hide teams with overlapping players
            const selectedPlayers = new Set();
            selectedTeams.forEach(selIdx => {
              teams[selIdx].players.forEach(p => selectedPlayers.add(p));
            });
            
            document.querySelectorAll('.team-combo-btn').forEach((btn, i) => {
              if (
                selectedTeams.includes(i) ||
                teams[i].players.some(p => selectedPlayers.has(p))
              ) {
                btn.style.display = selectedTeams.includes(i) ? '' : 'none';
              } else {
                btn.style.display = '';
              }
            });
          }
          
          if (selectedTeams.length === 2) {
            showMatchScoreForm(selectedTeams[0], selectedTeams[1]);
          }
        };
        
        function showMatchScoreForm(idx1, idx2) {
          const t1 = teams[idx1];
          const t2 = teams[idx2];
          const form = document.createElement('form');
          form.className = 'd-flex flex-wrap gap-2 align-items-end mt-3';
          form.innerHTML = `
            <span class="badge bg-primary">${escapeHtml(t1.players.join(' & '))}</span>
            <input type="number" min="0" required class="form-control score-input" style="width:100px;max-width:120px;font-size:1.2rem;" placeholder="Score" id="score1" autocomplete="off">
            <span class="mx-2">vs</span>
            <span class="badge bg-primary">${escapeHtml(t2.players.join(' & '))}</span>
            <input type="number" min="0" required class="form-control score-input" style="width:100px;max-width:120px;font-size:1.2rem;" placeholder="Score" id="score2" autocomplete="off">
            <button type="submit" class="btn btn-success">Record Match</button>
            <button type="button" class="btn btn-secondary" id="cancelMatch">Cancel</button>
          `;
          
          form.onsubmit = function(e) {
            e.preventDefault();
            const score1 = parseInt(form.querySelector('#score1').value);
            const score2 = parseInt(form.querySelector('#score2').value);
            if (isNaN(score1) || isNaN(score2) || score1 === score2) return;
            
            let matches = loadMatches();
            const winner = score1 > score2 ? 1 : 2;
            matches.push({ team1: idx1, team2: idx2, winner, score1, score2 });
            saveMatches(matches);
            
            // Increment individual counts for all players in both teams
            let playersArr = loadPlayers();
            t1.players.concat(t2.players).forEach(name => {
              const idx = playersArr.findIndex(p => p.name === name);
              if (idx !== -1) playersArr[idx].count += 1;
            });
            savePlayers(playersArr);
            
            renderPlayers();
            renderTeamSection();
            renderSummarySection();
          };
          
          form.querySelector('#cancelMatch').onclick = function() {
            selectedTeams = [];
            document.querySelectorAll('.team-combo-btn').forEach(btn => {
              btn.classList.remove('active');
              btn.style.display = '';
            });
            renderTeamSection();
          };
          
          matchDiv.appendChild(form);
        }
        
        teamSection.appendChild(matchDiv);
      }
      
      // Match history
      const matches = loadMatches();
      if (matches.length > 0) {
        const matchHistory = document.createElement('div');
        matchHistory.className = 'mt-4';
        matchHistory.innerHTML = '<div class="fw-bold mb-2">Match History:</div>' + matches.map(m => {
          const t1 = teams[m.team1]?.players.join(' & ') || 'Team 1';
          const t2 = teams[m.team2]?.players.join(' & ') || 'Team 2';
          const winner = m.winner === 1 ? t1 : t2;
          const loser = m.winner === 1 ? t2 : t1;
          const winScore = m.winner === 1 ? m.score1 : m.score2;
          const loseScore = m.winner === 1 ? m.score2 : m.score1;
          return `<div class="mb-1"><span class="badge bg-secondary me-2">${escapeHtml(t1)}</span> vs <span class="badge bg-secondary me-2">${escapeHtml(t2)}</span> <span class="badge bg-success">Winner: ${escapeHtml(winner)} (${winScore}-${loseScore})</span></div>`;
        }).join('');
        teamSection.appendChild(matchHistory);
      }
    }
  
    // --- SUMMARY TAB LOGIC ---
    function renderSummarySection() {
      const summarySection = document.getElementById('summarySection');
      if (!summarySection) return;
      
      summarySection.innerHTML = '';
      const players = loadPlayers();
      const teams = generateTeams(players);
      const matches = loadMatches();
    
      // Player-wise summary
      const indivStats = document.createElement('div');
      indivStats.className = 'mb-4';
      indivStats.innerHTML = '<h5 class="mb-3">Player Stats</h5>' +
        '<div class="row g-2">' +
        players.map(p => {
          // Team wins for this player
          let teamWins = 0;
          let teamGames = 0;
          teams.forEach((t, i) => {
            if (t.players.includes(p.name)) {
              teamGames += matches.filter(m => m.team1 === i || m.team2 === i).length;
              teamWins += matches.filter(m => (m.team1 === i && m.winner === 1) || (m.team2 === i && m.winner === 2)).length;
            }
          });
          return `<div class=\"col-12 col-md-6 col-lg-4\"><div class=\"card bg-dark border-0 shadow-sm mb-2\"><div class=\"card-body\"><strong>${escapeHtml(p.name)}</strong><br>Games Played: <span class=\"badge bg-info\">${p.count}</span><br>Team Games: <span class=\"badge bg-secondary\">${teamGames}</span><br>Team Wins: <span class=\"badge bg-success\">${teamWins}</span></div></div></div>`;
        }).join('') + '</div>';
      summarySection.appendChild(indivStats);
    
      // Team-wise summary
      if (teams.length > 0) {
        const teamStats = document.createElement('div');
        teamStats.className = 'mb-4';
        teamStats.innerHTML = '<h5 class="mb-3">Team Stats</h5>' +
          '<div class="row g-2">' +
          teams.map((t, i) => {
            const played = matches.filter(m => m.team1 === i || m.team2 === i).length;
            const wins = matches.filter(m => (m.team1 === i && m.winner === 1) || (m.team2 === i && m.winner === 2)).length;
            if (played === 0) return '';
            return `<div class=\"col-12 col-md-6 col-lg-4\"><div class=\"card bg-dark border-0 shadow-sm mb-2\"><div class=\"card-body\"><strong>${escapeHtml(t.players.join(' & '))}</strong><br>Games Played: <span class=\"badge bg-info\">${played}</span><br>Wins: <span class=\"badge bg-success\">${wins}</span></div></div></div>`;
          }).join('') + '</div>';
        summarySection.appendChild(teamStats);
      }
    
      // Match-wise summary
      if (matches.length > 0) {
        const matchStats = document.createElement('div');
        matchStats.className = 'mb-4';
        matchStats.innerHTML = '<h5 class="mb-3">Match History</h5>' +
          '<div class="list-group">' +
          matches.map(m => {
            const t1 = teams[m.team1]?.players.join(' & ') || 'Team 1';
            const t2 = teams[m.team2]?.players.join(' & ') || 'Team 2';
            const winner = m.winner === 1 ? t1 : t2;
            const loser = m.winner === 1 ? t2 : t1;
            const winScore = m.winner === 1 ? m.score1 : m.score2;
            const loseScore = m.winner === 1 ? m.score2 : m.score1;
            return `<div class=\"list-group-item bg-dark border-0 mb-1\"><span class=\"badge bg-secondary me-2\">${escapeHtml(t1)}</span> vs <span class=\"badge bg-secondary me-2\">${escapeHtml(t2)}</span> <span class=\"badge bg-success\">Winner: ${escapeHtml(winner)} (${winScore}-${loseScore})</span> <span class=\"badge bg-danger ms-2\">Loser: ${escapeHtml(loser)} (${loseScore})</span></div>`;
          }).join('') + '</div>';
        summarySection.appendChild(matchStats);
      }
    }
  
    // --- TAB HANDLING ---
    // Render correct section on tab change
    const individualTab = document.getElementById('individual-tab');
    const teamTab = document.getElementById('team-tab');
    const summaryTab = document.getElementById('summary-tab');
    
    if (individualTab) {
      individualTab.addEventListener('click', function() {
        renderPlayers();
      });
    }
    
    if (teamTab) {
      teamTab.addEventListener('click', function() {
        renderTeamSection();
      });
    }
    
    if (summaryTab) {
      summaryTab.addEventListener('click', function() {
        renderSummarySection();
      });
    }
  
    // Add event listeners for sort buttons
    const sortByNameBtn = document.getElementById('sortByName');
    const sortByCountBtn = document.getElementById('sortByCount');
    
    if (sortByNameBtn) {
      sortByNameBtn.addEventListener('click', function() {
        // Toggle sort by name functionality
        this.classList.add('active');
        if (sortByCountBtn) sortByCountBtn.classList.remove('active');
        // Custom sort by name logic can be added here
      });
    }
    
    if (sortByCountBtn) {
      sortByCountBtn.addEventListener('click', function() {
        // Toggle sort by count functionality
        this.classList.add('active');
        if (sortByNameBtn) sortByNameBtn.classList.remove('active');
        // Custom sort by count logic can be added here
      });
    }
  
    // Handle mobile quick add form
    const quickAddForm = document.getElementById('quickAddForm');
    const quickPlayerNameInput = document.getElementById('quickPlayerName');
    
    if (quickAddForm && quickPlayerNameInput) {
      quickAddForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = quickPlayerNameInput.value.trim();
        if (name.length === 0) return;
        addPlayer(name);
        quickPlayerNameInput.value = '';
        
        // Close modal
        const modal = document.getElementById('quickAddModal');
        if (modal) {
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
      });
    }
  
    // Initial render
    renderPlayers();
    renderTeamSection();
    renderSummarySection();
  });