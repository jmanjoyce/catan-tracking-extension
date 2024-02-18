/// <reference types="chrome" />




// Create instance to stop errors'
const storage = chrome.storage;

interface Reasources {
  brick: number,
  ore: number,
  wood: number,
  wheat: number,
  sheep: number,
  wildCard: number,
  [key: string]: number;
}

interface PlayerHand {
  name: string,
  resources: Reasources,
  numberOfCards: number,
  unknownDiff: number,
}

interface Game {
  player?: string,
  hands: PlayerHand[],
}

interface ProcessInformation  {
  observer: MutationObserver | undefined,
  queueIntervalId: number | undefined,
  inGame: boolean,
}

const getKey = () => {
  // return document.URL.split('#')[1];
  return 'h';
}


const logGame = (game: Game) =>{

}


const countReasources = (reasources: Reasources): number => {
  const values: number[] = Object.values(reasources);
  const total: number = values.reduce((acc, value) => acc + value, 0);
  return total;
}

const getGame = async (): Promise<Game | undefined> => {
  const key = getKey();
  const result = await chrome.storage.local.get([key]);
  const res = result[key];
  const parsedRes = JSON.parse(res);
  return parsedRes;
}

const setGame = async (game: Game): Promise<void> => {

  return new Promise<void>(async (res, rej) => {

    await chrome.storage.local.clear();
    const key = getKey();
    const value = JSON.stringify(game);
    //console.log('set value', value);
    chrome.storage.local.set({ [key]: value }).then(() => {
      if (chrome.runtime.lastError) {
        console.log('error setting');
        rej(chrome.runtime.lastError);
      }
      res();
    })
  })
}

const initChromeGameStorage = async () => {
  let userName = prompt("what is your username?", "username");
  const hands: PlayerHand[] = [];
  const game: Game = {
    player: userName ?? undefined,
    hands: hands,
  }
  await setGame(game);

}

const updateReasources = (name: string, reasourceChange: Reasources, game: Game) => {
  const player: PlayerHand | undefined = game.hands.find(hand => hand.name == name);
  if (player) {

    const existingReasouces = player.resources;
    const be = player;

    //console.log('change b4', JSON.parse(JSON.stringify(be)));
    for (const reasource in existingReasouces) {
      existingReasouces[reasource] += reasourceChange[reasource];
      player.numberOfCards += reasourceChange[reasource];
      if (existingReasouces[reasource] < 0 && reasource != "wildCard") {
        console.log("wildCard");
        existingReasouces.wildCard += existingReasouces[reasource];
        existingReasouces[reasource] = 0;
      }
    }
    const ad = player.numberOfCards
    //console.log('change', player);

  }
}



const getBlankReasourcesItem = (): Reasources => {
  return {
    brick: 0,
    ore: 0,
    wood: 0,
    wheat: 0,
    sheep: 0,
    wildCard: 0
  }
}


const processBuyMsg = async (ele: Element): Promise<void> => {
  const reasourceChange: Reasources = getBlankReasourcesItem();
  const span: Element | null = ele.querySelector('.semibold');
  const info: Element | null = ele.querySelector('span');
  if (span && info) {
    const name: string | null = span.textContent;
    const image: HTMLImageElement | null = info.querySelector('img');
    if (image) {
      if (image.alt == 'settlement') {
        reasourceChange.brick--;
        reasourceChange.wheat--;
        reasourceChange.wood--;
        reasourceChange.sheep--;

      } else if (image.alt == 'city') {
        reasourceChange.ore -= 3;
        reasourceChange.wheat -= 2;

      } else if (image.alt == 'development card') {
        reasourceChange.wheat--;
        reasourceChange.sheep--;
        reasourceChange.ore--;

      } else if (image.alt == 'road') {
        reasourceChange.wood--;
        reasourceChange.brick--;
      }
    }

    return new Promise<void>(async (acc, rej) => {
      const game: Game | undefined = await getGame();
      if (game) {
        updateReasources(name!, reasourceChange, game!);
        logGame(game);
        await setGame(game!);
      }
      acc();

    })


  }
};

const processBankTradeMsg = async (ele: Element): Promise<void> => {
  const reasourceChange: Reasources = getBlankReasourcesItem();
  const span: Element | null = ele.querySelector('.semibold');
  const innerSpan: Element | null = ele.querySelector('span');
  if (span && innerSpan) {

    const name: string | null = span.textContent;
    //console.log('name' , name);

    let giving: boolean = true;
    innerSpan.childNodes.forEach(node => {
      if (node.nodeName == "IMG") {
        const factor = giving ? -1 : 1;
        const alt: string = (node as HTMLImageElement).alt;
        switch (alt) {
          case 'lumber':
            reasourceChange.wood += factor;
            break;
          case 'wool':
            reasourceChange.sheep += factor;
            break;
          case 'ore':
            reasourceChange.ore += factor;
            break;
          case 'brick':
            reasourceChange.brick += factor;
            break;
          case 'grain':
            reasourceChange.wheat += factor;
            break;
        }
      }
      if (node.nodeName == "#text") {
        if (node.nodeValue == " and took ") {
          giving = false;
        }
      }
    })
    return new Promise<void>(async (acc, rej) => {
      const game: Game | undefined = await getGame();
      if (game) {
        updateReasources(name!, reasourceChange, game!);
        logGame(game);
        await setGame(game!);
      }
      acc();

    })


  }
};

const processMonopoly = async (span: Element, nameA: string) => {
  var val = -1;
  var num = -1;
  const reasourceChange = getBlankReasourcesItem();
  span.childNodes.forEach(node => {
    if (node.nodeName == "#text") {
      const numberMatch = node.nodeValue!.match(/\d+/);
      if (numberMatch) {
        const extractedNumber = parseInt(numberMatch[0], 10);
        val = extractedNumber;
      }
    }
    if (node.nodeName == "IMG" && val != -1) {
      const alt: string = (node as HTMLImageElement).alt;
      console.log('made it to alt', alt);
      switch (alt) {
        case 'lumber':
          reasourceChange.wood += val;
          num = 1;
          break;
        case 'wool':
          reasourceChange.sheep += val;
          num = 2;
          break;
        case 'ore':
          reasourceChange.ore += val;
          num = 3;
          break;
        case 'brick':
          reasourceChange.brick += val;
          num = 4;
          break;
        case 'grain':
          reasourceChange.wheat += val;
          num = 5;
          break;
      }

    }
  })
  return new Promise<void>(async (res, rej) => {
    const game: Game | undefined = await getGame();
    if (game) {
      const namesStolen: string[] = game.hands.map((hand) => hand.name).filter((name) => name != nameA);
      let nameString = "please give number of reasources for: ";
      namesStolen.forEach(name => nameString += `${name} `);
      let defaultString = "0 0 0";
      let msg: string | null = prompt(nameString, defaultString);
      if (msg) {
        const namesAmts: number[] = msg.split(" ").map(ele => parseInt(ele));
        console.log(namesStolen, namesAmts);
        if (namesAmts.length == namesStolen.length) {
          for (let i = 0; i < namesAmts.length; i++) {
            const reasourceChangeSto: Reasources = getBlankReasourcesItem();
            const hand = game.hands.find((person) => person.name == namesStolen[i]);
            if (hand) {
              console.log('hand', hand.numberOfCards, 'cur', namesAmts);
              const amntStolen = hand.numberOfCards - namesAmts[i];
              console.log('num', num, 'amnt', amntStolen);
              switch (num) {
                case 1:
                  reasourceChangeSto.wood -= amntStolen;
                case 2:
                  reasourceChangeSto.sheep -= amntStolen;
                case 3:
                  reasourceChangeSto.ore -= amntStolen;
                case 4:
                  reasourceChangeSto.brick -= amntStolen;
                case 5:
                  reasourceChangeSto.wheat -= amntStolen;
              }
              updateReasources(namesStolen[i], reasourceChange, game);
            } else {
              console.error('issue getting hand')
            }
            

          }

        } else {
          console.log('number dont match');
        }
        updateReasources(nameA, reasourceChange, game);
        await setGame(game);
        logGame(game);
        res();

      }
      rej();
    }


  })





}

const processPlayerTrade = async (ele: Element): Promise<void> => {
  const reasourceChangeA: Reasources = getBlankReasourcesItem();
  const reasourceChangeB: Reasources = getBlankReasourcesItem();
  const span: NodeListOf<Element> = ele.querySelectorAll('.semibold');
  const innerSpan: Element | null = ele.querySelector('span');
  const nameA: string | null = span[0].textContent;

  const nameB: string | null = span[1].textContent;

  if (span && innerSpan) {
    //console.log('name' , name);

    let giving: boolean = true;
    innerSpan.childNodes.forEach(node => {
      if (node.nodeName == "IMG") {
        const factor = giving ? -1 : 1;
        const alt: string = (node as HTMLImageElement).alt;
        switch (alt) {
          case 'lumber':
            reasourceChangeA.wood += factor;
            reasourceChangeB.wood -= factor;
            break;
          case 'wool':
            reasourceChangeA.sheep += factor;
            reasourceChangeB.sheep -= factor;
            break;
          case 'ore':
            reasourceChangeA.ore += factor;
            reasourceChangeB.ore -= factor;
            break;
          case 'brick':
            reasourceChangeA.brick += factor;
            reasourceChangeB.brick -= factor;
            break;
          case 'grain':
            reasourceChangeA.wheat += factor;
            reasourceChangeB.wheat -= factor;
            break;
        }
      }
      if (node.nodeName == "#text") {
        if (node.nodeValue == " for ") {
          giving = false;
        }
      }
    })

    return new Promise<void>(async (acc, rej) => {
      const game: Game | undefined = await getGame();
      if (game) {
        //console.log()
        updateReasources(nameA!, reasourceChangeA, game);
        updateReasources(nameB!, reasourceChangeB, game);
        logGame(game);
        await setGame(game!);
      }
      acc();

    })

  }


}

const processStealMsg = async (ele: Element) => {
  const reasourceChangeA: Reasources = getBlankReasourcesItem();
  const reasourceChangeB: Reasources = getBlankReasourcesItem();
  //const span: NodeListOf<Element>= ele.querySelectorAll('.semibold');
  const innerSpan: Element | null = ele.querySelector('span');
  let nameA: string | undefined | null = undefined;
  let nameB: string | undefined | null = undefined;
  const game = await getGame();

  innerSpan?.childNodes.forEach(node => {
    if ((node as Element).className == "semibold" || (
      node.nodeValue == "You stole " || node.nodeValue == " from you")) {
      if (!nameA) {
        if ((node as Element).className == "semibold") {
          nameA = node.textContent;
        } else {
          nameA = game?.player ?? "Rey9091";
        }
      } else {
        if ((node as Element).className == "semibold") {
          nameB = node.textContent;
        } else {
          nameB = game?.player ?? "Rey9091";
        }

      }
    }
  })
  console.log('steal', nameA, nameB);
  if (!nameB) {
    processMonopoly(ele, nameA!);
    console.log('monopoly', nameA);
    return;
  }

  if (innerSpan) {
    //console.log('name' , name);
    //console.log('childs', innerSpan.childNodes);

    innerSpan.childNodes.forEach(node => {
      if (node.nodeName == "IMG") {
        const factor = 1;
        const alt: string = (node as HTMLImageElement).alt;
        switch (alt) {
          case 'lumber':
            reasourceChangeA.wood += factor;
            reasourceChangeB.wood -= factor;
            break;
          case 'wool':
            reasourceChangeA.sheep += factor;
            reasourceChangeB.sheep -= factor;
            break;
          case 'ore':
            reasourceChangeA.ore += factor;
            reasourceChangeB.ore -= factor;
            break;
          case 'brick':
            reasourceChangeA.brick += factor;
            reasourceChangeB.brick -= factor;
            break;
          case 'grain':
            reasourceChangeA.wheat += factor;
            reasourceChangeB.wheat -= factor;
            break;
          case 'card':
            reasourceChangeA.wildCard += factor;
            reasourceChangeB.wildCard -= factor;
            break;
        }
      }
    })

    return new Promise<void>(async (acc, rej) => {
      const game: Game | undefined = await getGame();
      if (game) {
        console.log(reasourceChangeA, reasourceChangeB);
        updateReasources(nameA!, reasourceChangeA, game);
        updateReasources(nameB!, reasourceChangeB, game);
        logGame(game);
        await setGame(game!);
      }
      acc();

    })


  }


};

const processStartingMessage = async (ele: Element): Promise<void> => {
  const [name, reasourceChange] = await processGotMsg(ele, false);
  const key = getKey();
  if (name) {

    const game: Game | undefined = await getGame();

    if (game) {
      const hands: PlayerHand[] = game.hands;
      // Make sure there are not other same name
      const nameSet: Set<string> = new Set(hands.map(hand => hand.name));

      if (true) {
        const newHand: PlayerHand = {
          name,
          resources: reasourceChange!,
          numberOfCards: countReasources(reasourceChange!),
          unknownDiff: 0
        }
        hands.push(newHand);
        return new Promise<void>(async (res, rej) => {
          await setGame(game);
          logGame(game);
          res();
        })

      }

    }


  }

}

const processGotMsg = async (ele: Element, saveReasources: boolean = true): Promise<[string | undefined, Reasources | undefined]> => {
  const reasourceChange: Reasources = getBlankReasourcesItem();
  const span: Element | null = ele.querySelector('.semibold');
  const info: Element | null = ele.querySelector('span');
  if (span && info) {
    const name: string | null = span.textContent;
    const images: NodeListOf<HTMLImageElement> = info.querySelectorAll('img');
    images.forEach(img => {
      if (img.alt == 'ore') {
        reasourceChange.ore += 1;
      }
      else if (img.alt == 'lumber') {
        reasourceChange.wood += 1;
      }
      else if (img.alt == 'brick') {
        reasourceChange.brick += 1;
      }
      else if (img.alt == 'wool') {
        reasourceChange.sheep += 1;
      }
      else if (img.alt == 'grain') {
        reasourceChange.wheat += 1;
      }
    })

    if (saveReasources) {
      const game: Game | undefined = await getGame();
      if (game) {
        updateReasources(name!, reasourceChange, game);
        logGame(game);
        await setGame(game!);
      }

    }
    return [name!, reasourceChange]

  }
  return [undefined, undefined];

};


const processDiscardMsg = async (ele: Element): Promise<void> => {
  const reasourceChange: Reasources = getBlankReasourcesItem();
  const span: Element | null = ele.querySelector('.semibold');
  const info: Element | null = ele.querySelector('span');
  if (span && info) {
    const name: string | null = span.textContent;
    const images: NodeListOf<HTMLImageElement> = info.querySelectorAll('img');
    images.forEach(img => {
      if (img.alt == 'ore') {
        reasourceChange.ore -= 1;
      }
      else if (img.alt == 'lumber') {
        reasourceChange.wood -= 1;
      }
      else if (img.alt == 'brick') {
        reasourceChange.brick -= 1;
      }
      else if (img.alt == 'wool') {
        reasourceChange.sheep -= 1;
      }
      else if (img.alt == 'grain') {
        reasourceChange.wheat -= 1;
      }
    })
    return new Promise<void>(async (res, rej) => {
      const game: Game | undefined = await getGame();
      if (game) {
        updateReasources(name!, reasourceChange, game);
        logGame(game);
        await setGame(game!);
      }
      res();
    })

  }

}

const processYopMsg = (ele: Element) => {
  const reasourceChange: Reasources = getBlankReasourcesItem();
  const span: Element | null = ele.querySelector('.semibold');
  const info: Element | null = ele.querySelector('span');
  if (span && info) {
    const name: string | null = span.textContent;
    const images: NodeListOf<HTMLImageElement> = info.querySelectorAll('img');
    images.forEach(img => {
      if (img.alt == 'ore') {
        reasourceChange.ore += 1;
      }
      else if (img.alt == 'lumber') {
        reasourceChange.wood += 1;
      }
      else if (img.alt == 'brick') {
        reasourceChange.brick += 1;
      }
      else if (img.alt == 'wool') {
        reasourceChange.sheep += 1;
      }
      else if (img.alt == 'grain') {
        reasourceChange.wheat += 1;
      }
    })
    return new Promise<void>(async (res, rej) => {
      const game: Game | undefined = await getGame();
      if (game) {
        updateReasources(name!, reasourceChange, game);
        logGame(game);
        await setGame(game!);
      }
      res();
    })
  }


}

const processMessage = async (ele: Element): Promise<void> => {
  //console.log(ele);
  //console.log(ele.innerHTML.match(/ got /i));

  return new Promise<void>(async (acc, rej) => {
    const got = ele.innerHTML.match(/ got /i);
    if (got) {
      //console.log('got');
      await processGotMsg(ele, true);
    }

    // gave bank and took
    const gaveAndTook = ele.innerHTML.match(/ gave bank /i);
    if (gaveAndTook) {
      //console.log('trade bank')
      await processBankTradeMsg(ele);
    }

    const built = ele.innerHTML.match(/ built a | bought /i);
    if (built) {
      //console.log('buy')
      await processBuyMsg(ele);
    }

    const yop = ele.innerHTML.match(/ took from bank /i);
    if (yop) {
      //console.log('yop');
      await processYopMsg(ele);
    }

    const trade = ele.innerHTML.match(/ traded /i);
    if (trade) {
      //console.log('trade');
      await processPlayerTrade(ele);
    }

    const stole = ele.innerHTML.match(/ stole /i);
    if (stole) {
      //console.log('stole');
      await processStealMsg(ele);

    }

    // Might have bugs
    const discarded = ele.innerHTML.match(/ discarded /i);
    if (discarded) {
      //console.log('discarded');
      await processDiscardMsg(ele);
    }

    const startingPlayer = ele.innerHTML.match(/ received starting resources /i);
    if (startingPlayer) {
      await processStartingMessage(ele);
    }
    acc();

  })


};


const checkQChange = async (previousSize: number, queue: Element[]) => {
  while (queue.length > 0) {
    const first = queue.shift()!
    await processMessage(first);
  }

}


const observeQueue = async (queue: Element[]): Promise<number> => {
  let previousSize = queue.length;
  let running: boolean = false;
  const intervalId = setInterval(async () => {
    if (!running) {
      running = true;
      await checkQChange(previousSize, queue);
      running = false;
    }
  }, 1000); // Check every 5 seconds
  return intervalId;

}




const processAllMessages = () => {

  const out = document.body;

  const messages: NodeListOf<Element> =
    document.querySelectorAll(".message-post");
  messages.forEach(processMessage);
};

// Content script

// Callback function to handle mutations
function handleMutations(
  mutations: MutationRecord[],
  observer: MutationObserver,
  queue: Element[]
) {

  mutations.some((mutation) => {

    const addedElement = mutation.target as Element;
    if (addedElement.className == "message-post") {
      //processMessage(addedElement);
      queue.push(addedElement);
      return true;

    }
    return false;
    // Now you can work with the changed element
  });
}


// Function to start observing mutations
const startMutationObserver = (): [MutationObserver, Promise<number>] => {
  const queue: Element[] = [];
  const timeout = observeQueue(queue);

  const observer: MutationObserver = new MutationObserver((h, m) => {
    handleMutations(h, m, queue);
  });
  const gameText = document.getElementById("game-log-text");

  const config = { attributes: false, childList: true, subtree: true };
  // Start observing the document
  if (gameText) {
    observer.observe(gameText, config);
  } else {
    console.error("cant find game text");
  }
  initChromeGameStorage();
  return [observer, timeout];
  
};

// Function to stop observing mutations if needed
const stopMutationObserver = (observer: MutationObserver) => {
  observer.disconnect();
};


function processDocument() {
  processAllMessages();
}

const checkIfInGame = (url: string): boolean => {
  var pattern: RegExp = /#\w{4}$/;
  return pattern.test(url);

}



const handleUrlChange = async (info: ProcessInformation) => {
  var currentUrl = window.location.href;
  if (checkIfInGame(currentUrl)) {
    const [mutationObserver_, timeout_] = startMutationObserver();
    info.observer = mutationObserver_;
    info.queueIntervalId = await timeout_;
    console.log('started observing mutations');
  }


  // You can perform actions or update the UI based on the new URL
}

const initContentScript = () => {
  const process : ProcessInformation = {
    observer: undefined,
    queueIntervalId: undefined,
    inGame: false,
  }

  var currentUrl = window.location.href;
  if (checkIfInGame(currentUrl)) {
    startMutationObserver();
    console.log("started observing mutations");
  } else {
    window.addEventListener('hashchange',()=> {
      handleUrlChange(process);
    });
  }


}

console.log("before timeout");
setTimeout(initContentScript, 3000);

// Start observing mutations when the content script is injected
