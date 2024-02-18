 // Function to fetch player information from Chrome Local Storage
 async function getPlayerInformation() {
    const key = 'h';
    const result = await chrome.storage.local.get([key]);
    const res = result[key];
    const parsedRes = JSON.parse(res);

    displayPlayerInformation(parsedRes.hands)


    // chrome.storage.local.get(['game'], (result) => {
    //   const game = result.game || { hands: [] };
    //   displayPlayerInformation(game.hands);
    // });
  }

  // Function to display player information in a table
  function displayPlayerInformation(playerHands) {
    const playerInfoContainer = document.getElementById('playerInfo');

    if (playerHands.length === 0) {
      playerInfoContainer.innerHTML = '<p>No player information available.</p>';
      return;
    }

    const table = document.createElement('table');
    const headerRow = table.insertRow(0);

    // Add table headers
    const headers = ['Player Name', 'Brick', 'Ore', 'Wood', 'Wheat', 'Sheep', 'Wild Card', 'Number of Cards', 'Unknown Diff'];
    headers.forEach((headerText, index) => {
      const th = document.createElement('th');
      th.innerHTML = headerText;
      headerRow.appendChild(th);
    });

    // Add player data rows
    playerHands.forEach((playerHand) => {
      const row = table.insertRow();
      const data = [playerHand.name, ...Object.values(playerHand.resources), playerHand.numberOfCards, playerHand.unknownDiff];

      data.forEach((value, index) => {
        const cell = row.insertCell(index);
        cell.innerHTML = value.toString();
      });
    });

    playerInfoContainer.innerHTML = '';
    playerInfoContainer.appendChild(table);
  }

  // Function to refresh player information every 5 seconds
  function refreshPlayerInformation() {
    getPlayerInformation();
  }

  // Fetch and display player information when the page loads
  window.onload = () => {
    getPlayerInformation();
    setInterval(refreshPlayerInformation, 1000); // Refresh every 5 seconds
  };