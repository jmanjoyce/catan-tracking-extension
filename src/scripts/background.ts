// // background.js

// let currentTabId = null;

// chrome.tabs.onActivated.addListener(activeInfo => {
//   currentTabId = activeInfo.tabId;
// });

// chrome.webNavigation.onCompleted.addListener(details => {
//   // Check if the URL matches the Colonist game URL
//   if (details.url.startsWith("https://colonist.io/")) {
//     // Communicate with the content script or perform other actions
//     chrome.tabs.sendMessage(currentTabId, { action: "pageLoaded" });
//   }
// });
