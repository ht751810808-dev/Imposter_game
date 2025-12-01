let wordBank = {};
let civilianWord = "";
let impostorWord = "";
let currentPlayer = 0;
let totalPlayers = 0;
let impostorIndex = 0;
let playerNames = []; // store names
let friendGroups = {}; // store friend groups
let currentGroupMembers = []; // current group being created
let gameHistory = []; // store game history
let currentGameStartTime = null; // track game start time
let currentCategory = ""; // track current category
let clueWordEnabled = false; // track if clue word mode is enabled
let currentClueWord = ""; // store the clue word
let gamePhase = 'setup'; // setup, word-reveal, clue-round, voting, result
let currentClueRound = 0; // current clue round (1 or 2)
let maxClueRounds = 2; // total clue rounds
let playerClues = []; // store all clues [[round1], [round2]]

async function loadWords() {
  try {
    const response = await fetch("words.json");
    wordBank = await response.json();
  } catch (error) {
    console.error("Failed to load words.json:", error);
  }
}

// Clue word mode toggle
function toggleClueWordInfo() {
  const checkbox = document.getElementById('clueWordMode');
  const info = document.getElementById('clueInfo');
  clueWordEnabled = checkbox.checked;
  
  if (clueWordEnabled) {
    info.classList.remove('hidden');
  } else {
    info.classList.add('hidden');
  }
}

// Get a clue word based on category
function getClueWord(category) {
  const clueWords = {
    'Food': 'Something you can eat or drink',
    'Animals': 'A living creature',
    'Places': 'A location or destination',
    'Objects': 'A physical item or tool',
    'Movies': 'A film or movie title',
    'Jobs': 'A profession or occupation',
    'Sports': 'An athletic activity or game',
    'Colors': 'A shade, hue or color',
    'Countries': 'A nation or country',
    'Brands': 'A famous company or brand',
    'Instruments': 'A musical instrument',
    'Emotions': 'A feeling or mood'
  };
  return clueWords[category] || 'Think about the category';
}

// Generate input fields for names
function generateNameInputs() {
  totalPlayers = parseInt(document.getElementById("numPlayers").value);
  if (isNaN(totalPlayers) || totalPlayers < 3 || totalPlayers > 12) {
    alert("Please enter a number between 3 and 12!");
    return;
  }

  const container = document.getElementById("playerNamesContainer");
  container.innerHTML = "";

  for (let i = 0; i < totalPlayers; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Player ${i+1}`;
    input.id = `playerName${i}`;
    container.appendChild(input);
    container.appendChild(document.createElement("br"));
  }

  document.getElementById("startBtn").classList.remove("hidden");
}

// Use default player names
function useDefaultNames() {
  totalPlayers = parseInt(document.getElementById("numPlayers").value);
  if (isNaN(totalPlayers) || totalPlayers < 3 || totalPlayers > 12) {
    alert("Please enter a number between 3 and 12!");
    return;
  }

  const container = document.getElementById("playerNamesContainer");
  container.innerHTML = "";

  for (let i = 0; i < totalPlayers; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Player ${i+1}`;
    input.id = `playerName${i}`;
    input.value = `Player ${i+1}`;  // Auto-fill with default name
    container.appendChild(input);
    container.appendChild(document.createElement("br"));
  }

  document.getElementById("startBtn").classList.remove("hidden");
}

// Start game with names
function startGame() {
  playerNames = [];
  for (let i = 0; i < totalPlayers; i++) {
    const name = document.getElementById(`playerName${i}`).value.trim();
    if (!name) {
      alert(`Please enter a name for Player ${i+1}`);
      return;
    }
    playerNames.push(name);
  }

  currentCategory = document.getElementById("category").value;
  const words = wordBank[currentCategory];

  civilianWord = words[Math.floor(Math.random() * words.length)];
  do {
    impostorWord = words[Math.floor(Math.random() * words.length)];
  } while (impostorWord === civilianWord);

  impostorIndex = Math.floor(Math.random() * totalPlayers); // index in array
  currentGameStartTime = new Date(); // track start time
  
  // Get clue word if enabled
  if (clueWordEnabled) {
    currentClueWord = getClueWord(currentCategory);
  }

  currentPlayer = 0;
  document.querySelector(".category-select").classList.add("hidden");
  document.getElementById("revealContainer").classList.remove("hidden");
  updatePlayerTitle();
  
  // Scroll to keep game in view
  setTimeout(scrollToGameContainer, 100);
}

function updatePlayerTitle() {
  const titleText = `${playerNames[currentPlayer]}'s Turn`;
  const clueText = clueWordEnabled ? `\nClue: ${currentClueWord}` : '';
  document.getElementById("playerTitle").innerHTML = titleText + (clueText ? '<br><small style="color: #4a90e2; font-size: 0.8em;">' + clueText + '</small>' : '');
}

// Reveal word
function revealWord() {
  const word = (currentPlayer === impostorIndex) ? impostorWord : civilianWord;
  const wordDisplay = document.getElementById("wordDisplay");
  wordDisplay.textContent = word;
  wordDisplay.classList.remove("hidden");

  document.getElementById("revealBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");
  
  // Keep position stable
  setTimeout(scrollToGameContainer, 100);
}

// Next player
function nextPlayer() {
  currentPlayer++;
  if (currentPlayer >= totalPlayers) {
    // All players have seen their words, start clue rounds
    document.getElementById("revealContainer").classList.add("hidden");
    startClueRounds();
  } else {
    updatePlayerTitle();
    document.getElementById("wordDisplay").classList.add("hidden");
    document.getElementById("revealBtn").classList.remove("hidden");
    document.getElementById("nextBtn").classList.add("hidden");
    
    // Keep position stable
    setTimeout(scrollToGameContainer, 100);
  }
}

// Start clue collection rounds
function startClueRounds() {
  gamePhase = 'clue-round';
  currentClueRound = 1;
  currentPlayer = 0;
  
  // Initialize clues storage
  playerClues = [];
  for (let i = 0; i < totalPlayers; i++) {
    playerClues.push([]);
  }
  
  // Show clue container
  document.getElementById("clueContainer").classList.remove("hidden");
  document.getElementById("currentRoundDisplay").textContent = currentClueRound;
  document.getElementById("cluePlayerName").textContent = `${playerNames[currentPlayer]}'s Turn`;
  document.getElementById("clueInput").value = '';
  
  // Scroll to keep game in view
  setTimeout(() => {
    scrollToGameContainer();
    document.getElementById("clueInput").focus();
  }, 100);
}

// Submit a clue
function submitClue() {
  const clueInput = document.getElementById("clueInput");
  const clue = clueInput.value.trim();
  
  // Validation
  if (!clue) {
    alert("Please enter a clue!");
    return;
  }
  
  // Check if it's only one word
  const words = clue.split(/\s+/);
  if (words.length > 1) {
    alert("⚠️ Only ONE word allowed as a clue!\nPlease try again.");
    clueInput.value = '';
    clueInput.focus();
    return;
  }
  
  // Store the clue
  playerClues[currentPlayer].push(clue);
  
  // Show collected clue
  showCollectedClue(playerNames[currentPlayer], clue);
  
  // Clear input
  clueInput.value = '';
  
  // Next player
  currentPlayer++;
  
  if (currentPlayer >= totalPlayers) {
    // Round complete
    finishClueRound();
  } else {
    // Next player's turn
    document.getElementById("cluePlayerName").textContent = `${playerNames[currentPlayer]}'s Turn`;
    clueInput.focus();
  }
}

// Show collected clue
function showCollectedClue(playerName, clue) {
  const cluesGiven = document.getElementById("cluesGiven");
  const currentRoundClues = document.getElementById("currentRoundClues");
  
  cluesGiven.classList.remove("hidden");
  
  const clueItem = document.createElement("div");
  clueItem.className = "clue-item";
  clueItem.innerHTML = `
    <span class="clue-player">${playerName}:</span>
    <span class="clue-word">"${clue}"</span>
  `;
  
  currentRoundClues.appendChild(clueItem);
}

// Finish current clue round
function finishClueRound() {
  if (currentClueRound < maxClueRounds) {
    // Show option to continue or skip to voting
    const continueRound = confirm(
      `Round ${currentClueRound} complete! 🎯\n\n` +
      `All clues collected.\n\n` +
      `Do you want Round ${currentClueRound + 1}?\n\n` +
      `• Click OK for another round of clues\n` +
      `• Click Cancel to proceed to voting`
    );
    
    if (continueRound) {
      startNextClueRound();
    } else {
      showCluesSummary();
    }
  } else {
    // Max rounds reached
    showCluesSummary();
  }
}

// Start next clue round
function startNextClueRound() {
  currentClueRound++;
  currentPlayer = 0;
  
  // Clear current round display
  document.getElementById("currentRoundClues").innerHTML = '';
  document.getElementById("cluesGiven").classList.add("hidden");
  
  // Update round indicator
  document.getElementById("currentRoundDisplay").textContent = currentClueRound;
  document.getElementById("cluePlayerName").textContent = `${playerNames[currentPlayer]}'s Turn`;
  document.getElementById("clueInput").value = '';
  document.getElementById("clueInput").focus();
}

// Show all clues summary
function showCluesSummary() {
  document.getElementById("clueContainer").classList.add("hidden");
  document.getElementById("cluesSummaryContainer").classList.remove("hidden");
  
  const allCluesList = document.getElementById("allCluesList");
  allCluesList.innerHTML = '';
  
  // Display clues by round
  for (let round = 0; round < currentClueRound; round++) {
    const roundSection = document.createElement("div");
    roundSection.className = "round-clues-section";
    
    let roundHTML = `<h3 class="round-title">Round ${round + 1} Clues:</h3>`;
    roundHTML += '<div class="clues-list">';
    
    for (let i = 0; i < totalPlayers; i++) {
      if (playerClues[i][round]) {
        roundHTML += `
          <div class="summary-clue-item">
            <span class="summary-player">${playerNames[i]}:</span>
            <span class="summary-word">"${playerClues[i][round]}"</span>
          </div>
        `;
      }
    }
    
    roundHTML += '</div>';
    roundSection.innerHTML = roundHTML;
    allCluesList.appendChild(roundSection);
  }
  
  // Keep position stable
  setTimeout(scrollToGameContainer, 100);
}

// Start voting from summary
function startVotingFromSummary() {
  document.getElementById("cluesSummaryContainer").classList.add("hidden");
  startVoting();
}

// Voting
function startVoting() {
  const voteContainer = document.getElementById("voteContainer");
  voteContainer.classList.remove("hidden");

  const voteButtons = document.getElementById("voteButtons");
  voteButtons.innerHTML = "";
  
  // Keep position stable
  setTimeout(scrollToGameContainer, 100);

  // Show clue reference if clues were collected
  if (playerClues.length > 0 && playerClues[0].length > 0) {
    const clueReference = document.createElement("div");
    clueReference.className = "vote-clue-reference";
    clueReference.innerHTML = '<h3>🔍 Clue Reference:</h3>';
    
    const clueList = document.createElement("div");
    clueList.className = "vote-clue-list";
    
    for (let i = 0; i < totalPlayers; i++) {
      const clueInfo = document.createElement("div");
      clueInfo.className = "vote-clue-info";
      
      let cluesText = playerClues[i].map(c => `"${c}"`).join(', ');
      clueInfo.innerHTML = `
        <span class="vote-player-name">${playerNames[i]}:</span>
        <span class="vote-clues">${cluesText || 'No clues'}</span>
      `;
      
      clueList.appendChild(clueInfo);
    }
    
    clueReference.appendChild(clueList);
    voteButtons.appendChild(clueReference);
    
    // Add separator
    const separator = document.createElement("hr");
    separator.style.margin = "1.5rem 0";
    separator.style.border = "none";
    separator.style.borderTop = "1px solid rgba(255,255,255,0.2)";
    voteButtons.appendChild(separator);
  }

  // Create vote buttons
  const buttonsGrid = document.createElement("div");
  buttonsGrid.className = "vote-buttons-grid";
  
  for (let i = 0; i < totalPlayers; i++) {
    const btn = document.createElement("button");
    btn.className = "vote-button";
    btn.innerHTML = `
      <div class="vote-btn-name">${playerNames[i]}</div>
      <div class="vote-btn-clues">${playerClues[i] ? playerClues[i].map(c => `"${c}"`).join(', ') : ''}</div>
    `;
    btn.onclick = () => endVoting(i);
    buttonsGrid.appendChild(btn);
  }
  
  voteButtons.appendChild(buttonsGrid);
}

function endVoting(votedIndex) {
  const result = document.getElementById("voteResult");
  const impostorFound = votedIndex === impostorIndex;
  
  if (impostorFound) {
    result.textContent = `🎉 ${playerNames[votedIndex]} was the impostor! Civilians win!`;
  } else {
    result.textContent = `😢 ${playerNames[votedIndex]} was not the impostor. The impostor was ${playerNames[impostorIndex]}.`;
  }
  document.querySelectorAll("#voteButtons button").forEach(btn => btn.disabled = true);
  
  // Show play again and share buttons
  document.getElementById("playAgainBtn").classList.remove("hidden");
  document.getElementById("shareResultBtn").classList.remove("hidden");
  
  // Save game record
  saveGameRecord(impostorFound, votedIndex);
}

// Friend Groups Management Functions
function loadFriendGroups() {
  const saved = localStorage.getItem('imposterGameFriendGroups');
  if (saved) {
    friendGroups = JSON.parse(saved);
    updateGroupSelect();
  }
}

function saveFriendGroups() {
  localStorage.setItem('imposterGameFriendGroups', JSON.stringify(friendGroups));
}

function updateGroupSelect() {
  const select = document.getElementById('groupSelect');
  select.innerHTML = '<option value="">-- Select a group --</option>';
  
  for (const [groupName, members] of Object.entries(friendGroups)) {
    const option = document.createElement('option');
    option.value = groupName;
    option.textContent = `${groupName} (${members.length} members)`;
    select.appendChild(option);
  }
}

function handleGroupSelection() {
  const selectedGroup = document.getElementById('groupSelect').value;
  if (selectedGroup && friendGroups[selectedGroup]) {
    // Auto-fill the number of players and generate inputs
    const members = friendGroups[selectedGroup];
    document.getElementById('numPlayers').value = members.length;
    generateNameInputsFromGroup(members);
  }
}

function generateNameInputsFromGroup(members) {
  const container = document.getElementById("playerNamesContainer");
  container.innerHTML = "";

  for (let i = 0; i < members.length; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Name of Player ${i+1}`;
    input.id = `playerName${i}`;
    input.value = members[i]; // Pre-fill with group member names
    container.appendChild(input);
    container.appendChild(document.createElement("br"));
  }

  document.getElementById("startBtn").classList.remove("hidden");
}

// Modal Functions
function showCreateGroupModal() {
  const modal = document.getElementById('createGroupModal');
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open'); // Prevent body scroll
  document.getElementById('groupNameInput').value = '';
  currentGroupMembers = [];
  updateGroupMembersContainer();
  
  // Add click outside to close
  modal.onclick = function(event) {
    if (event.target === modal) {
      closeCreateGroupModal();
    }
  };
}

function closeCreateGroupModal() {
  const modal = document.getElementById('createGroupModal');
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open'); // Restore body scroll
  modal.onclick = null; // Remove event listener
}

function showManageGroupsModal() {
  const modal = document.getElementById('manageGroupsModal');
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open'); // Prevent body scroll
  displayGroupsList();
  
  // Add click outside to close
  modal.onclick = function(event) {
    if (event.target === modal) {
      closeManageGroupsModal();
    }
  };
}

function closeManageGroupsModal() {
  const modal = document.getElementById('manageGroupsModal');
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open'); // Restore body scroll
  modal.onclick = null; // Remove event listener
}

function addMemberToGroup() {
  currentGroupMembers.push('');
  updateGroupMembersContainer();
}

function updateGroupMembersContainer() {
  const container = document.getElementById('groupMembersContainer');
  container.innerHTML = '';
  
  currentGroupMembers.forEach((member, index) => {
    const memberDiv = document.createElement('div');
    memberDiv.className = 'member-input';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Member ${index + 1} name`;
    input.value = member;
    input.onchange = (e) => currentGroupMembers[index] = e.target.value;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-member';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => removeMemberFromGroup(index);
    
    memberDiv.appendChild(input);
    memberDiv.appendChild(removeBtn);
    container.appendChild(memberDiv);
  });
}

function removeMemberFromGroup(index) {
  currentGroupMembers.splice(index, 1);
  updateGroupMembersContainer();
}

function saveGroup() {
  const groupName = document.getElementById('groupNameInput').value.trim();
  if (!groupName) {
    alert('Please enter a group name!');
    return;
  }
  
  const members = currentGroupMembers.filter(member => member.trim() !== '');
  if (members.length < 3) {
    alert('A group must have at least 3 members!');
    return;
  }
  
  if (friendGroups[groupName]) {
    if (!confirm(`A group named "${groupName}" already exists. Do you want to replace it?`)) {
      return;
    }
  }
  
  friendGroups[groupName] = members;
  saveFriendGroups();
  updateGroupSelect();
  closeCreateGroupModal();
  alert(`Group "${groupName}" saved successfully!`);
}

function displayGroupsList() {
  const container = document.getElementById('groupsList');
  container.innerHTML = '';
  
  if (Object.keys(friendGroups).length === 0) {
    container.innerHTML = '<p>No groups created yet. Create your first group!</p>';
    return;
  }
  
  for (const [groupName, members] of Object.entries(friendGroups)) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-item';
    
    groupDiv.innerHTML = `
      <div class="group-info">
        <h4>${groupName}</h4>
        <p>${members.length} members: ${members.join(', ')}</p>
      </div>
      <div class="group-actions">
        <button onclick="editGroup('${groupName}')">Edit</button>
        <button onclick="useGroup('${groupName}')">Use</button>
        <button class="delete" onclick="deleteGroup('${groupName}')">Delete</button>
      </div>
    `;
    
    container.appendChild(groupDiv);
  }
}

function editGroup(groupName) {
  const members = friendGroups[groupName];
  document.getElementById('groupNameInput').value = groupName;
  currentGroupMembers = [...members];
  updateGroupMembersContainer();
  closeManageGroupsModal();
  showCreateGroupModal();
}

function useGroup(groupName) {
  document.getElementById('groupSelect').value = groupName;
  handleGroupSelection();
  closeManageGroupsModal();
}

function deleteGroup(groupName) {
  if (confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
    delete friendGroups[groupName];
    saveFriendGroups();
    updateGroupSelect();
    displayGroupsList();
  }
}

// Keyboard support for modals and clue input
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    // Close any open modal
    if (!document.getElementById('createGroupModal').classList.contains('hidden')) {
      closeCreateGroupModal();
    } else if (!document.getElementById('manageGroupsModal').classList.contains('hidden')) {
      closeManageGroupsModal();
    }
  }
  
  // Submit clue with Enter key
  if (event.key === 'Enter' && document.activeElement.id === 'clueInput') {
    event.preventDefault();
    submitClue();
  }
});

// Game History Management Functions
function loadGameHistory() {
  const saved = localStorage.getItem('imposterGameHistory');
  if (saved) {
    gameHistory = JSON.parse(saved);
    updateStats();
    displayRecentGames();
  }
}

function saveGameRecord(impostorFound, votedIndex) {
  const gameEndTime = new Date();
  const duration = Math.floor((gameEndTime - currentGameStartTime) / 1000); // in seconds
  
  const record = {
    id: Date.now(),
    timestamp: gameEndTime.toISOString(),
    players: totalPlayers,
    category: currentCategory,
    civilianWord: civilianWord,
    impostorWord: impostorWord,
    impostorFound: impostorFound,
    votedPlayer: playerNames[votedIndex],
    actualImpostor: playerNames[impostorIndex],
    duration: duration,
    playerNames: [...playerNames],
    cluesGiven: playerClues.length > 0 ? [...playerClues] : null,
    clueRounds: currentClueRound
  };
  
  gameHistory.unshift(record); // add to beginning
  
  // Keep only last 50 games
  if (gameHistory.length > 50) {
    gameHistory = gameHistory.slice(0, 50);
  }
  
  localStorage.setItem('imposterGameHistory', JSON.stringify(gameHistory));
  updateStats();
  displayRecentGames();
}

function updateStats() {
  // Update total games count
  const totalGames = gameHistory.length;
  document.getElementById('totalGamesCount').textContent = totalGames;
  
  // Calculate success rate
  if (totalGames > 0) {
    const successfulGames = gameHistory.filter(g => g.impostorFound).length;
    const successRate = Math.round((successfulGames / totalGames) * 100);
    document.getElementById('successRateCount').textContent = `${successRate}%`;
  }
}

function displayRecentGames() {
  const container = document.getElementById('recentGamesList');
  if (!container) return;
  
  if (gameHistory.length === 0) {
    container.innerHTML = '<p class="no-games">No games played yet. Be the first to play!</p>';
    return;
  }
  
  // Display last 12 games
  const recentGames = gameHistory.slice(0, 12);
  container.innerHTML = recentGames.map(game => {
    const timeAgo = getTimeAgo(new Date(game.timestamp));
    const resultIcon = game.impostorFound ? '✅' : '❌';
    const resultText = game.impostorFound ? 'Impostor Found' : 'Impostor Won';
    const resultClass = game.impostorFound ? 'success' : 'failed';
    
    return `
      <div class="game-card">
        <div class="game-header">
          <span class="game-players">${game.players} Players</span>
          <span class="game-category">${getCategoryEmoji(game.category)} ${game.category}</span>
        </div>
        <div class="game-result ${resultClass}">
          <span class="result-icon">${resultIcon}</span>
          <span class="result-text">${resultText}</span>
        </div>
        <div class="game-words">
          <div class="word-item">
            <span class="word-label">Civilian:</span>
            <span class="word-value">${game.civilianWord}</span>
          </div>
          <div class="word-item">
            <span class="word-label">Impostor:</span>
            <span class="word-value">${game.impostorWord}</span>
          </div>
        </div>
        <div class="game-time">${timeAgo}</div>
      </div>
    `;
  }).join('');
}

function getCategoryEmoji(category) {
  const emojis = {
    'Food': '🍕',
    'Animals': '🦁',
    'Places': '🏙️',
    'Objects': '🛠️',
    'Movies': '🎬',
    'Jobs': '👩‍⚕️',
    'Sports': '⚽',
    'Colors': '🌈',
    'Countries': '🌍',
    'Brands': '🏷️',
    'Instruments': '🎸',
    'Emotions': '😊'
  };
  return emojis[category] || '🎮';
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function scrollToGame() {
  document.getElementById('gameSection').scrollIntoView({ behavior: 'smooth' });
}

// Scroll to keep game container in view without jumping
function scrollToGameContainer() {
  const gameContainer = document.querySelector('.game-container');
  if (gameContainer) {
    const rect = gameContainer.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    
    // Only scroll if container is not fully visible
    if (!isVisible) {
      gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function playAgain() {
  // Reset game state
  document.getElementById("voteContainer").classList.add("hidden");
  document.getElementById("clueContainer").classList.add("hidden");
  document.getElementById("cluesSummaryContainer").classList.add("hidden");
  document.querySelector(".category-select").classList.remove("hidden");
  document.getElementById("playAgainBtn").classList.add("hidden");
  document.getElementById("shareResultBtn").classList.add("hidden");
  
  // Reset buttons
  document.getElementById("revealBtn").classList.remove("hidden");
  document.getElementById("nextBtn").classList.add("hidden");
  document.getElementById("wordDisplay").classList.add("hidden");
  
  // Reset clue system
  gamePhase = 'setup';
  currentClueRound = 0;
  playerClues = [];
  document.getElementById("currentRoundClues").innerHTML = '';
  document.getElementById("cluesGiven").classList.add("hidden");
  
  // Scroll to game section
  scrollToGame();
}

function shareResult() {
  const lastGame = gameHistory[0];
  if (!lastGame) return;
  
  const resultText = lastGame.impostorFound ? '✅ Found the impostor!' : '❌ Impostor escaped!';
  const shareText = `🎭 Impostor Game Result\n${resultText}\n${lastGame.players} players | ${lastGame.category} category\nPlay now: ${window.location.href}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Impostor Game Result',
      text: shareText
    }).catch(() => {
      // Fallback to clipboard
      copyToClipboard(shareText);
    });
  } else {
    copyToClipboard(shareText);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Result copied to clipboard! Share it with your friends!');
    }).catch(() => {
      alert('Unable to copy. Please copy manually: ' + text);
    });
  } else {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert('Result copied to clipboard! Share it with your friends!');
    } catch (err) {
      alert('Unable to copy: ' + text);
    }
    document.body.removeChild(textarea);
  }
}

// Show category preview
function showCategoryPreview() {
  const category = document.getElementById('category').value;
  const preview = document.getElementById('categoryPreview');
  const previewWords = document.getElementById('previewWords');
  
  if (wordBank[category] && wordBank[category].length > 0) {
    // Get 5 random sample words
    const samples = [];
    const words = [...wordBank[category]];
    for (let i = 0; i < 5 && words.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      samples.push(words[randomIndex]);
      words.splice(randomIndex, 1);
    }
    
    previewWords.textContent = samples.join(', ');
    preview.classList.remove('hidden');
  }
}

// Initialize on page load
loadWords();
loadFriendGroups();
loadGameHistory();
// Show initial preview
setTimeout(showCategoryPreview, 500);
