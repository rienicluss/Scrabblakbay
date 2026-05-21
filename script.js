const letterDistribution = {
  A: {count: 9, value: 1}, B: {count: 2, value: 3}, C: {count: 2, value: 3}, D: {count: 4, value: 2}, E: {count: 12, value: 1}, F: {count: 2, value: 4}, G: {count: 3, value: 2}, H: {count: 2, value: 4}, I: {count: 9, value: 1}, J: {count: 1, value: 8}, K: {count: 1, value: 5}, L: {count: 4, value: 1}, M: {count: 2, value: 3}, N: {count: 6, value: 1}, O: {count: 8, value: 1}, P: {count: 2, value: 3}, Q: {count: 1, value: 10}, R: {count: 6, value: 1}, S: {count: 4, value: 1}, T: {count: 6, value: 1}, U: {count: 4, value: 1}, V: {count: 2, value: 4}, W: {count: 2, value: 4}, X: {count: 1, value: 8}, Y: {count: 2, value: 4}, Z: {count: 1, value: 10}, '?': {count: 2, value: 0}
};

const premiumMap = [
  ['3W', '', '', '2L', '', '', '', '3W', '', '', '', '2L', '', '', '3W'],
  ['', '2W', '', '', '', '3L', '', '', '', '3L', '', '', '', '2W', ''],
  ['', '', '2W', '', '', '', '2L', '', '2L', '', '', '', '2W', '', ''],
  ['2L', '', '', '2W', '', '', '', '2L', '', '', '', '2W', '', '', '2L'],
  ['', '', '', '', '2W', '', '', '', '', '', '2W', '', '', '', ''],
  ['', '3L', '', '', '', '3L', '', '', '', '3L', '', '', '', '3L', ''],
  ['', '', '2L', '', '', '', '2L', '', '2L', '', '', '', '2L', '', ''],
  ['3W', '', '', '2L', '', '', '', '★', '', '', '', '2L', '', '', '3W'],
  ['', '', '2L', '', '', '', '2L', '', '2L', '', '', '', '2L', '', ''],
  ['', '3L', '', '', '', '3L', '', '', '', '3L', '', '', '', '3L', ''],
  ['', '', '', '', '2W', '', '', '', '', '', '2W', '', '', '', ''],
  ['2L', '', '', '2W', '', '', '', '2L', '', '', '', '2W', '', '', '2L'],
  ['', '', '2W', '', '', '', '2L', '', '2L', '', '', '', '2W', '', ''],
  ['', '2W', '', '', '', '3L', '', '', '', '3L', '', '', '', '2W', ''],
  ['3W', '', '', '2L', '', '', '', '3W', '', '', '', '2L', '', '', '3W']
];

const premiumLabel = {
  '2L': 'Double Letter',
  '3L': 'Triple Letter',
  '2W': 'Double Word',
  '3W': 'Triple Word',
  '★': 'Center',
};

const boardSize = 15;
const startRow = 7;
const startCol = 7;
const BUILD_TIME_DEFAULT = 60;
let board = [];
let bag = [];
let rack = [];
let selectedTile = null;
let exchangeMode = false;
let selectedExchangeTiles = new Set();
let placedTiles = [];
let totalScore = 0;
let lastMoveScore = 0;
let lastWord = 'None';
let players = [];
let currentPlayer = 0;
let turnNumber = 1;
let buildStartAt = null;

const STORAGE_KEYS = {
  players: 'scrabblakbay_players',
  gameState: 'scrabblakbay_state',
};

const validWords = new Set([
  'PAMILYA', 'LIPUNAN', 'ANGKAN', 'KASARIAN', 'PATRIYARKAL', 'MATRIYARKAL',
  'BILATERAL', 'MINANGKABAU', 'MONOGAMIYA', 'POLIGAMIYA',
  'YUNIT', 'INSTITUSYON', 'TUNGKULIN', 'REPRODUKSYON', 'SOSYALISASYON',
  'PRODUKSYON', 'MAGULANG', 'AMA', 'INA', 'ANAK'
  , 'TONE'
]);

function isWordValid(word) {
  return validWords.has(word.toUpperCase());
}

function saveGameState() {
  const state = {
    board,
    bag,
    rack,
    placedTiles,
    totalScore,
    lastMoveScore,
    lastWord,
    players,
    currentPlayer,
    turnNumber,
    buildStartAt,
  };
  localStorage.setItem(STORAGE_KEYS.gameState, JSON.stringify(state));
}

function clearSavedGameState() {
  localStorage.removeItem(STORAGE_KEYS.gameState);
}

function loadSavedGameState() {
  const saved = localStorage.getItem(STORAGE_KEYS.gameState);
  if (!saved) return false;
  try {
    const state = JSON.parse(saved);
    if (!state || !Array.isArray(state.board) || !Array.isArray(state.players)) return false;
    const savedNames = JSON.parse(localStorage.getItem(STORAGE_KEYS.players) || '[]');
    const stateNames = state.players.map((p) => p.name);
    if (Array.isArray(savedNames) && savedNames.length > 0 && JSON.stringify(savedNames) !== JSON.stringify(stateNames)) {
      return false;
    }
    board = state.board;
    bag = Array.isArray(state.bag) ? state.bag : [];
    rack = Array.isArray(state.rack) ? state.rack : [];
    placedTiles = Array.isArray(state.placedTiles) ? state.placedTiles : [];
    totalScore = typeof state.totalScore === 'number' ? state.totalScore : 0;
    lastMoveScore = typeof state.lastMoveScore === 'number' ? state.lastMoveScore : 0;
    lastWord = typeof state.lastWord === 'string' ? state.lastWord : 'None';
    players = Array.isArray(state.players) ? state.players : [];
    currentPlayer = typeof state.currentPlayer === 'number' ? state.currentPlayer : 0;
    turnNumber = typeof state.turnNumber === 'number' ? state.turnNumber : 1;
    buildStartAt = typeof state.buildStartAt === 'number' ? state.buildStartAt : null;
    selectedTile = null;
    return true;
  } catch (e) {
    return false;
  }
}

function getCurrentRack() {
  return players.length > 0 ? players[currentPlayer].rack : rack;
}

function setCurrentRack(newRack) {
  if (players.length > 0) {
    players[currentPlayer].rack = newRack;
  } else {
    rack = newRack;
  }
}

function refillPlayerRack(player) {
  while (player.rack.length < RACK_SIZE && bag.length > 0) {
    player.rack.push(bag.pop());
  }
}

const boardEl = document.getElementById('board');
const rackEl = document.getElementById('rack');
const bagCount = document.getElementById('bagCount');
const lastMoveScoreEl = document.getElementById('lastMoveScore');
const lastWordEl = document.getElementById('lastWord');
const moveInfoEl = document.getElementById('moveInfo') || document.getElementById('previewWord');
const errorTextEl = document.getElementById('errorText');
const playerSetupEl = document.getElementById('playerSetup');
const playerNamesEl = document.getElementById('playerNames');
const startGameBtn = document.getElementById('startGameBtn');
const currentPlayerNameEl = document.getElementById('currentPlayerName');
const currentPlayerScoreEl = document.getElementById('currentPlayerScore');
const topbarPlayerEl = document.getElementById('topbarPlayer');
const scoreGridEl = document.getElementById('scoreGrid');
const turnNumberEl = document.getElementById('turnNumber');
const previewScoreEl = document.getElementById('previewScore');
const recallBtn = document.getElementById('recallBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetMove');
const passBtn = document.getElementById('passTurn');
const newGameBtn = document.getElementById('newGame');
const submitBtn = document.getElementById('submitMove');
const exchangeBtn = document.getElementById('exchangeTiles');
const challengeModal = document.getElementById('challengeModal');
const challengeWordEl = document.getElementById('challengeWord');
const challengePromptEl = document.getElementById('challengePrompt');
const challengeTimerEl = document.getElementById('challengeTimer');
const challengeOptionsEl = document.getElementById('challengeOptions');
const challengeHintBtn = document.getElementById('challengeHintBtn');
const challengeHintText = document.getElementById('challengeHint');
const challengeRemoveTwoBtn = document.getElementById('challengeRemoveTwoBtn');
const challengeAskFriendBtn = document.getElementById('challengeAskFriendBtn');
const buildTimerEl = document.getElementById('buildTimer');
const lifelineRemoveTwoEl = document.getElementById('lifelineRemoveTwo');
const lifelineHintEl = document.getElementById('lifelineHint');
const lifelineAskFriendEl = document.getElementById('lifelineAskFriend');
let challengeActive = false;
let pendingWord = '';
let pendingScore = 0;
let usedHint = false;
let currentLifelineUsed = false;
let challengeCountdown = null;
let challengeTimer = null;
let challengeTime = 30;
let buildTimer = null;
let buildTime = 60;
let originalChallengePrompt = '';

const questionBank = {
  PAMILYA: {
    question: 'Bakit itinuturing na mahalagang bahagi ng lipunan ang pamilya?',
    options: [
      'Dahil ito ang namamahala sa lahat ng batas ng pamayanan.',
      'Dahil dito nagsisimula ang paghubog sa asal, pagpapahalaga, at ugnayan ng tao.',
      'Dahil ito lamang ang batayan ng yaman ng isang lipunan.',
      'Dahil dito nagmumula ang lahat ng pinunong pampolitika.'
    ],
    correct: 1,
    hint: 'Dito unang nahuhubog ang tao bilang kasapi ng lipunan.'
  },
  LIPUNAN: {
    question: 'Paano nabubuo ang lipunan batay sa aralin tungkol sa pamilya?',
    options: [
      'Nabubuo ito mula sa magkakaugnay na pamilya at pamayanan.',
      'Nabubuo ito mula lamang sa mga pinuno at mandirigma.',
      'Nabubuo ito kapag pare-pareho ang hanapbuhay ng mga tao.',
      'Nabubuo ito kapag may iisang uri lamang ng pamilya.'
    ],
    correct: 0,
    hint: 'Ang maraming pamilya ay bumubuo ng mas malaking pangkat.'
  },
  YUNIT: {
    question: 'Ano ang ibig sabihin kapag sinabing ang pamilya ay “batayang yunit ng lipunan”?',
    options: [
      'Ito ang pinakamalaking pangkat sa loob ng isang bansa.',
      'Ito ang tanging pangkat na may kapangyarihang pampolitika.',
      'Ito ang pangunahing bahagi na bumubuo sa mas malaking lipunan.',
      'Ito ang pangkat na hiwalay sa pamayanan at kultura.'
    ],
    correct: 2,
    hint: 'Ang yunit ay bahagi ng isang mas malaking kabuuan.'
  },
  INSTITUSYON: {
    question: 'Bakit maituturing na institusyong panlipunan ang pamilya?',
    options: [
      'Dahil ito ay may tungkuling humubog, mag-alaga, at magpanatili ng ugnayan sa lipunan.',
      'Dahil ito ay opisyal na tanggapan ng pamahalaan.',
      'Dahil ito ay samahang binubuo lamang ng magkakaparehong trabaho.',
      'Dahil ito ay ginagamit lamang sa pagpapasya sa ekonomiya.'
    ],
    correct: 0,
    hint: 'Ang institusyon ay may mahalagang tungkulin sa kaayusan ng lipunan.'
  },
  TUNGKULIN: {
    question: 'Bakit mahalagang maunawaan ang tungkulin ng bawat kasapi ng pamilya?',
    options: [
      'Dahil dito nasusukat ang dami ng ari-arian ng pamilya.',
      'Dahil dito nakikita kung sino lamang ang may karapatang mamuno.',
      'Dahil dito nalalaman kung aling pamilya ang mas mataas sa lipunan.',
      'Dahil dito nauunawaan kung paano ginagampanan ng bawat kasapi ang papel sa tahanan at pamayanan.'
    ],
    correct: 3,
    hint: 'Tumutukoy ito sa responsibilidad o papel ng kasapi.'
  },
  REPRODUKSYON: {
    question: 'Paano naiugnay ang reproduksyon sa papel ng pamilya?',
    options: [
      'Ito ay tumutukoy sa pagbuo, pagsilang, at pag-aalaga sa bagong kasapi ng lipunan.',
      'Ito ay tumutukoy sa pagpapalitan ng produkto sa pamilihan.',
      'Ito ay tumutukoy sa pagpili ng pinuno sa sinaunang pamayanan.',
      'Ito ay tumutukoy sa paghahati ng lupa sa magkakamag-anak.'
    ],
    correct: 0,
    hint: 'Kaugnay ito ng pagpapatuloy ng kasapi ng pamilya at lipunan.'
  },
  SOSYALISASYON: {
    question: 'Alin ang pinakatumpak na halimbawa ng sosyalisasyon sa loob ng pamilya?',
    options: [
      'Pagpapasya kung sino ang magmamana ng ari-arian.',
      'Pagtuturo sa bata ng wastong asal, paggalang, at pakikitungo sa kapwa.',
      'Pagpaparami ng produkto para sa pangkabuhayan ng tahanan.',
      'Pagkilala sa kamag-anak mula sa panig ng ama at ina.'
    ],
    correct: 1,
    hint: 'Kaugnay ito ng pagkatuto ng asal at pagpapahalaga.'
  },
  PRODUKSYON: {
    question: 'Sa sinaunang lipunan, paano maaaring gumanap ang pamilya bilang yunit ng produksyon?',
    options: [
      'Sa pamamagitan ng pagpili ng pinuno ng pamayanan.',
      'Sa pamamagitan ng pagtukoy sa kasarian ng bawat kasapi.',
      'Sa pamamagitan ng paglikha ng produkto o serbisyo para sa pangangailangan ng pamilya.',
      'Sa pamamagitan ng pagtatakda ng bilang ng henerasyon sa tahanan.'
    ],
    correct: 2,
    hint: 'Kaugnay ito ng paggawa ng bagay o serbisyong kailangan sa pamumuhay.'
  },
  MAGULANG: {
    question: 'Bakit mahalaga ang magulang sa paghubog ng anak bilang kasapi ng lipunan?',
    options: [
      'Sila ang unang gumagabay sa asal, pagpapahalaga, at pananagutan ng anak.',
      'Sila lamang ang maaaring maging pinuno ng sinaunang pamayanan.',
      'Sila ang nagtatakda ng lahat ng batas ng lipunan.',
      'Sila ang tanging batayan ng pagkilala sa angkan.'
    ],
    correct: 0,
    hint: 'Sila ang karaniwang unang guro ng bata sa tahanan.'
  },
  AMA: {
    question: 'Sa pamilyang patriyarkal, paano karaniwang inilalarawan ang papel ng ama?',
    options: [
      'Siya ang pangunahing tagapangalaga ng ritwal sa pamayanan.',
      'Siya ang kinikilalang may pangunahing kapangyarihan sa pagpapasya sa pamilya.',
      'Siya ang kasaping walang kinalaman sa paghubog ng anak.',
      'Siya ang palaging sumusunod sa desisyon ng pinakabatang anak.'
    ],
    correct: 1,
    hint: 'Kaugnay ito ng kapangyarihan ng lalaki o ama.'
  },
  INA: {
    question: 'Sa pamilyang matriyarkal, ano ang ipinapakita ng mahalagang papel ng ina?',
    options: [
      'Ang ina ay walang kaugnayan sa pagpapasya sa tahanan.',
      'Ang ina lamang ang may pananagutan sa produksyon.',
      'Ang ina o pinakamatandang babae ay maaaring kilalaning pangunahing nagpapasya.',
      'Ang ina ay kinikilala lamang sa panig ng ama.'
    ],
    correct: 2,
    hint: 'Kaugnay ito ng pamumuno o kapangyarihan ng babae.'
  },
  ANAK: {
    question: 'Paano naiugnay ang anak sa tungkulin ng pamilya sa lipunan?',
    options: [
      'Ang anak ay palaging pinuno ng pamilyang patriyarkal.',
      'Ang anak ang tanging batayan ng kapangyarihan sa lipunan.',
      'Ang anak ay hindi saklaw ng sosyalisasyon sa tahanan.',
      'Ang anak ay hinuhubog ng pamilya upang maging mabuting kasapi ng lipunan.'
    ],
    correct: 3,
    hint: 'Siya ang tumatanggap ng unang paghubog mula sa pamilya.'
  },
  NUKLEYAR: {
    question: 'Alin ang pinakamalapit na paglalarawan sa nukleyar na pamilya?',
    options: [
      'Pamilyang binubuo ng magulang at mga anak.',
      'Pamilyang binubuo ng tatlo o higit pang henerasyon.',
      'Pamilyang kumikilala lamang sa kamag-anak sa panig ng ina.',
      'Pamilyang may higit sa isang asawa.'
    ],
    correct: 0,
    hint: 'Ito ang mas maliit na anyo ng pamilya ayon sa kasapi.'
  },
  PINALAWAK: {
    question: 'Alin ang halimbawa ng pinalawak na pamilya?',
    options: [
      'Mag-asawang walang kasamang ibang kamag-anak.',
      'Magulang at anak lamang na nakatira sa iisang tahanan.',
      'Lolo, lola, magulang, anak, at apo na magkakaugnay sa isang pamilya.',
      'Pamilyang kinikilala lamang ang angkan sa panig ng ama.'
    ],
    correct: 2,
    hint: 'May higit sa isang henerasyon sa pamilya.'
  },
  HENERASYON: {
    question: 'Bakit mahalaga ang konsepto ng henerasyon sa pag-aaral ng pinalawak na pamilya?',
    options: [
      'Ipinapakita nito ang ugnayan ng matatanda, magulang, anak, at apo.',
      'Ipinapakita nito kung sino ang may pinakamalaking kita sa pamilya.',
      'Ipinapakita nito kung aling kasarian ang dapat mamuno.',
      'Ipinapakita nito ang uri ng pag-aasawa sa pamayanan.'
    ],
    correct: 0,
    hint: 'Kaugnay ito ng salinlahi o magkakasunod na antas ng pamilya.'
  },
  KASARIAN: {
    question: 'Bakit mahalagang pag-aralan ang kasarian sa sinaunang lipunan?',
    options: [
      'Dahil ito ang batayan ng lokasyon ng isang pamayanan.',
      'Dahil dito nakikita ang gampanin, inaasahan, at kapangyarihan ng babae at lalaki.',
      'Dahil ito ang tanging dahilan ng pagbuo ng pamilya.',
      'Dahil dito nasusukat ang dami ng produkto ng lipunan.'
    ],
    correct: 1,
    hint: 'Kaugnay ito ng papel ng babae at lalaki sa pamilya at lipunan.'
  },
  PATRIYARKAL: {
    question: 'Alin ang pinakatumpak na paglalarawan sa pamilyang patriyarkal?',
    options: [
      'Pantay ang kapangyarihan ng mag-asawa sa lahat ng desisyon.',
      'Kinikilala lamang ang angkan sa panig ng ina.',
      'Ang ama o pinakamatandang lalaki ang may pangunahing kapangyarihan sa pagpapasya.',
      'Mahigit sa isang asawa ang pinahihintulutan sa pamilya.'
    ],
    correct: 2,
    hint: 'Kaugnay ito ng pamumuno ng ama o lalaki.'
  },
  MATRIYARKAL: {
    question: 'Alin ang pinakatumpak na paglalarawan sa pamilyang matriyarkal?',
    options: [
      'Ang ina o pinakamatandang babae ang may pangunahing kapangyarihan sa pagpapasya.',
      'Ang ama lamang ang kinikilalang pinuno ng pamilya.',
      'Paresing kinikilala ang kamag-anak sa panig ng ama at ina.',
      'Isang asawa lamang ang kinikilala sa pag-aasawa.'
    ],
    correct: 0,
    hint: 'Kaugnay ito ng pamumuno ng ina o babae.'
  },
  EGALITARIAN: {
    question: 'Ano ang ipinapakita ng pamilyang egalitarian?',
    options: [
      'Ang kapangyarihan ay nakabatay lamang sa edad ng kasapi.',
      'Ang ama lamang ang may huling pasya sa tahanan.',
      'Ang ina lamang ang kinikilalang pinuno ng pamilya.',
      'Ang mag-asawa ay magkatulong at may pantay na bahagi sa pagpapasya.'
    ],
    correct: 3,
    hint: 'Kaugnay ito ng pagkakapantay sa pagpapasya.'
  },
  KAPANGYARIHAN: {
    question: 'Bakit mahalaga ang konsepto ng kapangyarihan sa anyo ng pamilya?',
    options: [
      'Dahil ipinapakita nito kung sino ang may karapatang magpasya at mamuno sa tahanan.',
      'Dahil ipinapakita nito kung gaano karami ang anak sa pamilya.',
      'Dahil ipinapakita nito kung anong produkto ang ginagawa ng pamilya.',
      'Dahil ipinapakita nito kung anong uri ng kasal ang pinahihintulutan.'
    ],
    correct: 0,
    hint: 'Kaugnay ito ng pamumuno at pagpapasya.'
  },
  DESISYON: {
    question: 'Paano nakatutulong ang pag-aaral ng desisyon sa pag-unawa sa pamilya?',
    options: [
      'Natutukoy nito ang bilang ng kasapi sa bawat henerasyon.',
      'Naipapakita nito kung paano hinahati o ginagamit ang kapangyarihan sa loob ng pamilya.',
      'Naipapakita nito kung anong bansa ang pinagmulan ng pamilya.',
      'Natutukoy nito kung ang pamilya ay nukleyar o pinalawak lamang.'
    ],
    correct: 1,
    hint: 'Kaugnay ito ng pagpili, pamumuno, at kapangyarihan.'
  },
  ANGKAN: {
    question: 'Bakit mahalaga ang angkan sa sinaunang lipunan?',
    options: [
      'Ito ang batayan ng lahat ng gawaing pang-ekonomiya.',
      'Ito ang tawag sa pagsasama ng isang lalaki at isang babae.',
      'Ipinapakita nito ang pinagmulan, pagkakakilanlan, at ugnayan ng magkakamag-anak.',
      'Ipinapakita nito ang bilang ng produktong nagagawa ng pamilya.'
    ],
    correct: 2,
    hint: 'Kaugnay ito ng pinagmulan at kamag-anak.'
  },
  PATRILINEYAL: {
    question: 'Ano ang ipinapakita ng sistemang patrilineyal?',
    options: [
      'Kinikilala ang kamag-anak o angkan sa panig ng ama.',
      'Kinikilala ang kamag-anak o angkan sa panig ng ina.',
      'Pantay na pinamumunuan ng mag-asawa ang tahanan.',
      'Pinahihintulutan ang pagkakaroon ng higit sa isang asawa.'
    ],
    correct: 0,
    hint: 'May kaugnayan ito sa panig ng ama.'
  },
  MATRILINEYAL: {
    question: 'Ano ang ipinapakita ng sistemang matrilineyal?',
    options: [
      'Ang ama ang palaging may pangunahing kapangyarihan.',
      'Kinikilala ang kamag-anak o angkan sa panig ng ina.',
      'Ang pamilya ay binubuo lamang ng magulang at anak.',
      'Ang mag-asawa ay may pantay na kapangyarihan.'
    ],
    correct: 1,
    hint: 'May kaugnayan ito sa panig ng ina.'
  },
  BILATERAL: {
    question: 'Alin ang pinakatumpak na paliwanag sa sistemang bilateral?',
    options: [
      'Kinikilala lamang ang kamag-anak sa panig ng ama.',
      'Kinikilala lamang ang kamag-anak sa panig ng ina.',
      'Paresing kinikilala ang kamag-anak sa panig ng ama at ina.',
      'Hindi kinikilala ang ugnayan ng pamilya sa alinmang panig.'
    ],
    correct: 2,
    hint: 'Ang “bi” ay nagpapahiwatig ng dalawa.'
  },
  MINANGKABAU: {
    question: 'Bakit mahalagang halimbawa ang Minangkabau sa aralin?',
    options: [
      'Dahil ito ay halimbawa ng lipunang walang kinikilalang pamilya.',
      'Dahil ito ay halimbawa ng pamilyang nukleyar lamang.',
      'Dahil ito ay halimbawa ng lipunang patriyarkal sa Kanlurang Asya.',
      'Dahil ito ay halimbawa ng matrilineyal na lipunan sa Indonesia.'
    ],
    correct: 3,
    hint: 'Kaugnay sila ng sistemang matrilineyal.'
  },
  INDONESIA: {
    question: 'Paano naiugnay ang Indonesia sa aralin tungkol sa kamag-anakan?',
    options: [
      'Matatagpuan dito ang Minangkabau ng Kanlurang Sumatra, isang halimbawa ng matrilineyal na lipunan.',
      'Dito nagsimula ang lahat ng pamilyang nukleyar sa Timog Silangang Asya.',
      'Ito ang halimbawa ng lipunang walang sistemang kamag-anakan.',
      'Ito ang bansang nagpapakita lamang ng pamilyang patriyarkal.'
    ],
    correct: 0,
    hint: 'Kaugnay ito ng Minangkabau at Kanlurang Sumatra.'
  },
  PAGPAPAKASAL: {
    question: 'Bakit mahalagang elemento ng pagpapamilya ang pagpapakasal sa maraming lipunan?',
    options: [
      'Dahil ito ang batayan ng lahat ng kapangyarihang pampolitika.',
      'Dahil ito ang kinikilalang paraan ng pagpapatibay ng pagsasama at pagbuo ng pamilya.',
      'Dahil ito ang tanging paraan upang makilala ang angkan sa panig ng ina.',
      'Dahil ito ang batayan ng pagbuo ng produktong pangkabuhayan.'
    ],
    correct: 1,
    hint: 'Kaugnay ito ng pagsasama ng mag-asawa at pagbuo ng pamilya.'
  },
  MONOGAMIYA: {
    question: 'Ano ang ipinapakita ng monogamiya?',
    options: [
      'Ang pagkilala sa angkan sa panig ng ina.',
      'Ang pagkakaroon ng pantay na kapangyarihan ng mag-asawa.',
      'Ang pagkakaroon ng isang asawa lamang.',
      'Ang pagkilala sa tatlo o higit pang henerasyon sa pamilya.'
    ],
    correct: 2,
    hint: 'Ang “mono” ay nangangahulugang isa.'
  },
  POLIGAMIYA: {
    question: 'Ano ang ipinapakita ng poligamiya?',
    options: [
      'Ang pagkakaroon o pagpapahintulot sa higit sa isang asawa.',
      'Ang pagkilala sa kamag-anak sa panig ng ama at ina.',
      'Ang pamilyang binubuo lamang ng magulang at anak.',
      'Ang pantay na pagpapasya ng mag-asawa sa tahanan.'
    ],
    correct: 0,
    hint: 'Ang “poli” ay nagpapahiwatig ng marami.'
  }
};

function getCurrentPlayerLifelines() {
  if (players.length > 0) {
    return players[currentPlayer].lifelines;
  }
  return { removeTwo: false, hint: false, askFriend: false };
}

function renderLifelineStatus() {
  if (!lifelineRemoveTwoEl || !lifelineHintEl || !lifelineAskFriendEl) return;
  const lifelines = getCurrentPlayerLifelines();
  lifelineRemoveTwoEl.textContent = lifelines.removeTwo ? 'Available' : 'Ginamit na';
  lifelineHintEl.textContent = lifelines.hint ? 'Available' : 'Ginamit na';
  lifelineAskFriendEl.textContent = lifelines.askFriend ? 'Available' : 'Ginamit na';
}

function setChallengeOptionsDisabled(disabled) {
  challengeOptionsEl.querySelectorAll('button').forEach((btn) => {
    btn.disabled = disabled;
  });
}

function disableAllChallengeLifelines() {
  [challengeHintBtn, challengeRemoveTwoBtn, challengeAskFriendBtn].forEach((btn) => {
    if (btn) btn.disabled = true;
  });
}

function enableAvailableChallengeLifelines() {
  const lifelines = getCurrentPlayerLifelines();
  if (!challengeHintBtn || !challengeRemoveTwoBtn || !challengeAskFriendBtn) return;
  challengeHintBtn.disabled = currentLifelineUsed || !lifelines.hint;
  challengeRemoveTwoBtn.disabled = currentLifelineUsed || !lifelines.removeTwo;
  challengeAskFriendBtn.disabled = currentLifelineUsed || !lifelines.askFriend;
}

function clearChallengeCountdown() {
  if (challengeCountdown) {
    clearTimeout(challengeCountdown);
    challengeCountdown = null;
  }
}

function clearChallengeTimer() {
  if (challengeTimer) {
    clearInterval(challengeTimer);
    challengeTimer = null;
  }
}

function startChallengeTimer() {
  if (challengeTimerEl) {
    challengeTime = 30;
    challengeTimerEl.textContent = `${challengeTime}`;
  }
  clearChallengeTimer();
  challengeTimer = setInterval(() => {
    challengeTime -= 1;
    if (challengeTimerEl) {
      challengeTimerEl.textContent = `${challengeTime}`;
    }
    if (challengeTime <= 0) {
      clearChallengeTimer();
      if (!challengeActive) return;
      setMoveMessage('Oras na! Walang bonus points.');
      hideChallenge();
      completeTurn(pendingWord, pendingScore, 0);
    }
  }, 1000);
}

function clearBuildTimer() {
  if (buildTimer) {
    clearInterval(buildTimer);
    buildTimer = null;
  }
  buildStartAt = null;
}

function getRemainingBuildTime() {
  if (typeof buildStartAt !== 'number') return BUILD_TIME_DEFAULT;
  const elapsedSeconds = Math.floor((Date.now() - buildStartAt) / 1000);
  return Math.max(0, BUILD_TIME_DEFAULT - elapsedSeconds);
}

function restoreBuildTimerFromState() {
  if (typeof buildStartAt !== 'number') return;

  const remaining = getRemainingBuildTime();
  if (remaining <= 0) {
    handleBuildTimeout();
    return;
  }

  startBuildTimer(remaining);
}

function startBuildTimer(initialTime = BUILD_TIME_DEFAULT) {
  if (buildTimerEl) {
    buildTime = initialTime;
    buildTimerEl.textContent = `${buildTime}`;
  }
  clearBuildTimer();
  buildStartAt = Date.now() - (BUILD_TIME_DEFAULT - buildTime) * 1000;
  buildTimer = setInterval(() => {
    buildTime -= 1;
    if (buildTimerEl) buildTimerEl.textContent = `${buildTime}`;
    if (buildTime <= 0) {
      clearBuildTimer();
      handleBuildTimeout();
    }
  }, 1000);
  saveGameState();
}

function handleBuildTimeout() {
  // return placed tiles to rack and end turn with no points
  clearError();
  const currentRack = getCurrentRack();
  if (placedTiles.length > 0) {
    placedTiles.forEach((tile) => {
      board[tile.row][tile.col].letter = '';
      currentRack.push(tile.letter);
    });
    placedTiles = [];
  }
  selectedTile = null;
  renderBoard();
  renderRack();
  setMoveMessage('Oras na sa pagbuo ng salita — turn over, walang puntos.');
  if (players.length > 0) {
    currentPlayer = (currentPlayer + 1) % players.length;
    turnNumber += 1;
    updateStats();
    renderRack();
  }
  saveGameState();
  // start next player's build timer
  startBuildTimer();
}

function useLifeline(type) {
  const lifelines = getCurrentPlayerLifelines();
  if (!lifelines[type]) {
    setMoveMessage('Wala nang natitirang lifeline na iyon.');
    return;
  }

  if (currentLifelineUsed) {
    setMoveMessage('Isang lifeline lamang ang maaaring gamitin sa bawat tanong.');
    return;
  }

  currentLifelineUsed = true;
  lifelines[type] = false;
  renderLifelineStatus();
  disableAllChallengeLifelines();
  setChallengeOptionsDisabled(false);

  const question = questionBank[pendingWord];
  if (!question) return;

  if (type === 'hint') {
    showChallengeHint();
  } else if (type === 'removeTwo') {
    removeTwoWrongAnswers(question);
  } else if (type === 'askFriend') {
    activateAskFriend(question);
  }
}

function removeTwoWrongAnswers(question) {
  const buttons = Array.from(challengeOptionsEl.querySelectorAll('button'));
  const wrongButtons = buttons.filter((btn, index) => index !== question.correct && !btn.disabled);
  shuffle(wrongButtons);
  wrongButtons.slice(0, 2).forEach((btn) => {
    btn.disabled = true;
    btn.classList.add('disabled');
    btn.textContent = `${btn.textContent} (Tinanggal)`;
  });
  setMoveMessage('Tanggal-Dalawa ginamit: dalawang maling sagot ang tinanggal.');
}

function activateAskFriend(question) {
  setMoveMessage('Tanong-Kakampi: May 10 segundo ka para magtanong sa kakampi.');
  setChallengeOptionsDisabled(true);
  challengeCountdown = setTimeout(() => {
    setChallengeOptionsDisabled(false);
    if (challengePromptEl) challengePromptEl.textContent = originalChallengePrompt;
    setMoveMessage('Panahon ng Tanong-Kakampi tapos na. Pumili na ng sagot.');
    challengeCountdown = null;
  }, 10000);
}

function showChallenge(word) {
  const question = questionBank[word];
  if (!question) {
    completeTurn(word, pendingScore, 0);
    return;
  }
  challengeActive = true;
  usedHint = false;
  currentLifelineUsed = false;
  clearChallengeCountdown();
  originalChallengePrompt = question.question;
  challengeWordEl.textContent = `Salita: ${word}`;
  challengePromptEl.textContent = question.question;
  challengeHintText.classList.add('hidden');
  challengeHintBtn.disabled = false;
  challengeOptionsEl.innerHTML = '';
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button secondary';
    button.textContent = option;
    button.addEventListener('click', () => handleChallengeChoice(index));
    challengeOptionsEl.appendChild(button);
  });
  enableAvailableChallengeLifelines();
  challengeModal.classList.remove('hidden');
  challengeModal.setAttribute('aria-hidden', 'false');
  startChallengeTimer();
}

function hideChallenge() {
  challengeActive = false;
  clearChallengeCountdown();
  clearChallengeTimer();
  challengeModal.classList.add('hidden');
  challengeModal.setAttribute('aria-hidden', 'true');
}

function handleChallengeChoice(selectedIndex) {
  if (!challengeActive) return;
  const question = questionBank[pendingWord];
  if (!question) return;
  const correct = selectedIndex === question.correct;
  const bonus = correct ? (currentLifelineUsed ? 5 : 10) : 0;
  const message = correct
    ? `Tamang sagot! Nakakuha ng ${bonus} bonus points.`
    : `Maling sagot. Nakatanggap pa rin ng ${pendingScore} puntos mula sa salitang iyon.`;
  setMoveMessage(message);
  hideChallenge();
  completeTurn(pendingWord, pendingScore, bonus);
}

function showChallengeHint() {
  const question = questionBank[pendingWord];
  if (!question) return;
  challengeHintText.textContent = `Pahiwatig: ${question.hint}`;
  challengeHintText.classList.remove('hidden');
  usedHint = true;
  challengeHintBtn.disabled = true;
}

challengeHintBtn?.addEventListener('click', () => useLifeline('hint'));
challengeRemoveTwoBtn?.addEventListener('click', () => useLifeline('removeTwo'));
challengeAskFriendBtn?.addEventListener('click', () => useLifeline('askFriend'));

function buildBag() {
  bag = [];
  Object.entries(letterDistribution).forEach(([letter, config]) => {
    for (let i = 0; i < config.count; i += 1) {
      bag.push(letter);
    }
  });
  shuffle(bag);
  updateBagCount();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createBoard() {
  board = Array.from({ length: boardSize }, (_, row) =>
    Array.from({ length: boardSize }, (_, col) => ({
      letter: '',
      permanent: false,
      premium: premiumMap[row][col],
    }))
  );
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      const cell = board[row][col];
      const cellEl = document.createElement('button');
      cellEl.type = 'button';
      cellEl.className = 'cell';
      cellEl.dataset.row = row;
      cellEl.dataset.col = col;
      cellEl.setAttribute('aria-label', `Row ${row + 1} Column ${col + 1}`);

      // always attach premium classes so the square keeps its color even when occupied
      if (cell.premium) {
        cellEl.classList.add('premium');
        const typeClass = cell.premium === '★' ? 'premium-center' : `premium-${cell.premium}`;
        cellEl.classList.add(typeClass);
      }

      if (cell.letter) {
        cellEl.classList.add('occupied');
        cellEl.innerHTML = `<span class="tile">${cell.letter}<span class="score">${letterDistribution[cell.letter].value}</span></span>`;
      } else if (cell.premium) {
        cellEl.innerHTML = `<span class="premium-label">${premiumLabel[cell.premium] || cell.premium}</span>`;
      }

      const placed = placedTiles.find((tile) => tile.row === row && tile.col === col);
      if (placed) {
        cellEl.classList.add('selected');
        cellEl.innerHTML = `<span class="tile">${placed.letter}<span class="score">${letterDistribution[placed.letter].value}</span></span>`;
      }

      cellEl.addEventListener('click', () => handleCellClick(row, col));
      boardEl.appendChild(cellEl);
    }
  }
}

const RACK_SIZE = 8;

function refillRack() {
  const currentRack = getCurrentRack();
  while (currentRack.length < RACK_SIZE && bag.length > 0) {
    currentRack.push(bag.pop());
  }
  renderRack();
  updateBagCount();
}


function renderRack() {
  rackEl.innerHTML = '';
  const currentRack = getCurrentRack();
  currentRack.forEach((tile, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('rack-tile');
    button.classList.toggle('selected', !exchangeMode && selectedTile === index);
    button.classList.toggle('selected-exchange', exchangeMode && selectedExchangeTiles.has(index));
    button.dataset.index = index;
    button.setAttribute('aria-pressed', String(exchangeMode ? selectedExchangeTiles.has(index) : selectedTile === index));
    button.innerHTML = `<span class="tile-letter">${tile}${tile !== '?' ? `<span class="pts">${letterDistribution[tile].value}</span>` : '<span class="pts">0</span>'}</span>`;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      selectTile(index);
    });
    rackEl.appendChild(button);
  });
}

function selectTile(index) {
  const currentRack = getCurrentRack();
  if (currentRack[index] === undefined) return;

  if (exchangeMode) {
    if (selectedExchangeTiles.has(index)) {
      selectedExchangeTiles.delete(index);
    } else {
      selectedExchangeTiles.add(index);
    }
    renderRack();
    setMoveMessage(`Selected ${selectedExchangeTiles.size} tile${selectedExchangeTiles.size === 1 ? '' : 's'} for exchange.`);
    return;
  }

  selectedTile = selectedTile === index ? null : index;
  renderRack();
  setMoveMessage();
}

function handleCellClick(row, col) {
  clearError();
  const cell = board[row][col];

  if (cell.letter) {
    setError('That cell already contains a tile.');
    return;
  }

  if (selectedTile === null) {
    setError('Pick a tile from your rack first.');
    return;
  }

  if (placedTiles.some((tile) => tile.row === row && tile.col === col)) {
    setError('This tile has already been placed on that square.');
    return;
  }

  const currentRack = getCurrentRack();
  const letter = currentRack[selectedTile];
  if (!letter) return;

  placedTiles.push({ row, col, letter, rackIndex: selectedTile });
  board[row][col].letter = letter;
  board[row][col].permanent = false;
  currentRack.splice(selectedTile, 1);
  selectedTile = null;
  renderRack();
  renderBoard();
  setMoveMessage();
  saveGameState();
}

function validateMove() {
  if (placedTiles.length === 0) {
    return { valid: false, message: 'Place at least one tile before submitting.' };
  }

  const rows = new Set(placedTiles.map((tile) => tile.row));
  const cols = new Set(placedTiles.map((tile) => tile.col));
  const singleRow = rows.size === 1;
  const singleCol = cols.size === 1;

  if (!singleRow && !singleCol) {
    return { valid: false, message: 'Tiles must be placed in a single row or column.' };
  }

  const positions = placedTiles.map((tile) => (singleRow ? tile.col : tile.row)).sort((a, b) => a - b);
  for (let i = 1; i < positions.length; i += 1) {
    if (positions[i] !== positions[i - 1] + 1) {
      return { valid: false, message: 'Tiles must form a contiguous word without gaps.' };
    }
  }

  if (board.some((row) => row.some((c) => c.letter))) {
    const adjacency = placedTiles.some((tile) => {
      const neighbors = [
        { row: tile.row - 1, col: tile.col },
        { row: tile.row + 1, col: tile.col },
        { row: tile.row, col: tile.col - 1 },
        { row: tile.row, col: tile.col + 1 }
      ];
      return neighbors.some((pos) => isOnBoard(pos.row, pos.col) && board[pos.row][pos.col].letter);
    });

    if (!adjacency) {
      return { valid: false, message: 'New tiles must connect to existing words.' };
    }
  } else {
    const coversCenter = placedTiles.some((tile) => tile.row === startRow && tile.col === startCol);
    if (!coversCenter) {
      return { valid: false, message: 'The first word must cover the center square.' };
    }
  }

  return { valid: true, message: '' };
}

function isOnBoard(row, col) {
  return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
}

function submitMove() {
  clearError();
  const validation = validateMove();
  if (!validation.valid) {
    setError(validation.message);
    return;
  }

  // stop build timer since player submitted a word
  clearBuildTimer();

  const orientation = placedTiles.every((tile) => tile.row === placedTiles[0].row) ? 'row' : 'col';
  const fixedIndex = orientation === 'row' ? placedTiles[0].row : placedTiles[0].col;
  const positions = placedTiles.map((tile) => (orientation === 'row' ? tile.col : tile.row)).sort((a, b) => a - b);
  const wordCoords = [];
  for (let pos = positions[0]; pos <= positions[positions.length - 1]; pos += 1) {
    const row = orientation === 'row' ? fixedIndex : pos;
    const col = orientation === 'row' ? pos : fixedIndex;
    wordCoords.push({ row, col });
  }

  const letters = wordCoords.map((coord) => {
    const existing = board[coord.row][coord.col].letter;
    const placed = placedTiles.find((tile) => tile.row === coord.row && tile.col === coord.col);
    return placed ? placed.letter : existing;
  });
  const word = letters.join('');

  if (!isWordValid(word)) {
    // Return any placed tiles back to the current player's rack
    const currentRack = getCurrentRack();
    placedTiles.forEach((tile) => {
      board[tile.row][tile.col].letter = '';
      currentRack.push(tile.letter);
    });
    placedTiles = [];
    selectedTile = null;
    renderBoard();
    renderRack();
    saveGameState();
    setError('Hindi kilalang salita. Mga inilagay na tiles ibinalik sa rack.');
    return;
  }

  const moveScore = scoreWord(wordCoords);
  pendingWord = word;
  pendingScore = moveScore;
  showChallenge(word);
}

function completeTurn(word, moveScore, bonus = 0) {
  // stop any placement timer for the completed turn
  clearBuildTimer();
  const totalMoveScore = moveScore + bonus;
  if (players.length > 0) {
    players[currentPlayer].score = (players[currentPlayer].score || 0) + totalMoveScore;
  } else {
    totalScore += totalMoveScore;
  }
  lastMoveScore = totalMoveScore;
  lastWord = word;
  placedTiles.forEach((tile) => {
    board[tile.row][tile.col].letter = tile.letter;
    board[tile.row][tile.col].permanent = true;
  });

  placedTiles = [];
  selectedTile = null;
  refillRack();
  renderBoard();
  renderRack();
  updateStats();
  const scoreMessage = `Salitang naisumite: ${word}. Nakuha ng ${totalMoveScore} puntos.`;

  if (players.length > 0) {
    currentPlayer = (currentPlayer + 1) % players.length;
    turnNumber += 1;
    updateStats();
    renderRack();
    setMoveMessage(`${scoreMessage} Turn passed to ${players[currentPlayer].name}.`);
    // start build timer for next player
    startBuildTimer();
  } else {
    setMoveMessage(scoreMessage);
  }
  saveGameState();
}

function scoreWord(coords) {
  let wordMultiplier = 1;
  let score = 0;
  coords.forEach((coord) => {
    const cell = board[coord.row][coord.col];
    const placed = placedTiles.find((tile) => tile.row === coord.row && tile.col === coord.col);
    const letter = placed ? placed.letter : cell.letter;
    const base = letterDistribution[letter].value;
    const premium = cell.premium;

    if (placed && premium) {
      if (premium === '2L') score += base * 2;
      else if (premium === '3L') score += base * 3;
      else if (premium === '2W') {
        score += base;
        wordMultiplier *= 2;
      } else if (premium === '3W') {
        score += base;
        wordMultiplier *= 3;
      } else if (premium === '★') {
        score += base;
        wordMultiplier *= 2;
      } else {
        score += base;
      }
    } else {
      score += base;
    }
  });
  return score * wordMultiplier;
}

function resetPlacement() {
  const currentRack = getCurrentRack();
  placedTiles.forEach((tile) => {
    board[tile.row][tile.col].letter = '';
    currentRack.push(tile.letter);
  });
  placedTiles = [];
  selectedTile = null;
  // reset build/exchange state
  clearBuildTimer();
  exchangeMode = false;
  selectedExchangeTiles.clear();
  if (exchangeBtn) exchangeBtn.textContent = 'Palitan';
  renderBoard();
  renderRack();
  setMoveMessage();
  clearError();
  saveGameState();
}

function passTurn() {
  clearError();
  exchangeMode = false;
  selectedExchangeTiles.clear();
  if (exchangeBtn) exchangeBtn.textContent = 'Palitan';
  clearError();
  const currentRack = getCurrentRack();
  if (placedTiles.length > 0) {
    placedTiles.forEach((tile) => {
      board[tile.row][tile.col].letter = '';
      currentRack.push(tile.letter);
    });
    placedTiles = [];
    selectedTile = null;
    renderBoard();
    renderRack();
  }

  if (players.length > 0) {
    currentPlayer = (currentPlayer + 1) % players.length;
    turnNumber += 1;
    updateStats();
    setMoveMessage(`Turn passed to ${players[currentPlayer].name}.`);
    renderRack();
    // start next player's build timer
    startBuildTimer();
  } else {
    setMoveMessage('Turn passed.');
  }
  saveGameState();
}

function shuffleRack() {
  const currentRack = getCurrentRack();
  if (currentRack.length <= 1) {
    setMoveMessage('Not enough tiles to shuffle.');
    return;
  }
  shuffle(currentRack);
  renderRack();
  setMoveMessage('Rack shuffled.');
}

function exchangeTiles() {
  const currentRack = getCurrentRack();

  if (placedTiles.length > 0) {
    setError('Finish or reset your current placement before exchanging tiles.');
    return;
  }

  if (!exchangeMode) {
    if (bag.length === 0) {
      setError('No tiles left in the bag to exchange.');
      return;
    }
    exchangeMode = true;
    selectedExchangeTiles.clear();
    selectedTile = null;
    renderRack();
    exchangeBtn.textContent = 'Confirm Exchange';
    setMoveMessage('Select one or more rack tiles to exchange, then click Palitan again.');
    clearError();
    return;
  }

  const selectedCount = selectedExchangeTiles.size;
  if (selectedCount === 0) {
    setError('Select at least one rack tile to exchange.');
    return;
  }

  if (bag.length < selectedCount) {
    setError('Not enough tiles left in the bag to exchange selected letters. Deselect some tiles.');
    return;
  }

  const tilesToExchange = [];
  Array.from(selectedExchangeTiles)
    .sort((a, b) => b - a)
    .forEach((index) => {
      tilesToExchange.push(currentRack[index]);
      currentRack.splice(index, 1);
    });

  bag.push(...tilesToExchange);
  shuffle(bag);

  for (let i = 0; i < selectedCount && bag.length > 0; i += 1) {
    currentRack.push(bag.pop());
  }

  shuffle(bag);
  exchangeMode = false;
  selectedExchangeTiles.clear();
  selectedTile = null;
  renderRack();
  updateBagCount();

  if (players.length > 0) {
    // complete this player's exchange and advance turn
    clearBuildTimer();
    currentPlayer = (currentPlayer + 1) % players.length;
    turnNumber += 1;
    updateStats();
    setMoveMessage(`Exchanged ${selectedCount} tile${selectedCount === 1 ? '' : 's'}. Turn passed to ${players[currentPlayer].name}.`);
    renderRack();
    // start placement timer for next player
    startBuildTimer();
  } else {
    setMoveMessage(`Exchanged ${selectedCount} tile${selectedCount === 1 ? '' : 's'}.`);
  }

  if (exchangeBtn) exchangeBtn.textContent = 'Palitan';
  saveGameState();
}

function updateBagCount() {
  bagCount.textContent = bag.length;
}

function updateStats() {
  if (players.length > 0) {
    const p = players[currentPlayer];
    if (currentPlayerNameEl) currentPlayerNameEl.textContent = p.name || '-';
    if (currentPlayerScoreEl) currentPlayerScoreEl.textContent = `${p.score || 0}`;
    if (topbarPlayerEl) topbarPlayerEl.textContent = p.name || '-';
    renderScoreGrid();
  } else {
    if (currentPlayerNameEl) currentPlayerNameEl.textContent = 'Guest';
    if (currentPlayerScoreEl) currentPlayerScoreEl.textContent = `${totalScore}`;
    if (topbarPlayerEl) topbarPlayerEl.textContent = 'Guest';
    if (scoreGridEl) scoreGridEl.innerHTML = '';
  }
  if (turnNumberEl) turnNumberEl.textContent = turnNumber;
  if (previewScoreEl) previewScoreEl.textContent = '0';
  if (lastMoveScoreEl) lastMoveScoreEl.textContent = lastMoveScore;
  if (lastWordEl) lastWordEl.textContent = lastWord;
  updateBagCount();
  renderLifelineStatus();
  if (bag.length === 0 && getCurrentRack().every((tile) => !tile)) {
    setMoveMessage('No tiles left. Game over!');
  }
}

function renderScoreGrid() {
  if (!scoreGridEl) return;
  scoreGridEl.innerHTML = '';
  players.forEach((pl, idx) => {
    const card = document.createElement('div');
    card.className = `score-card${idx === currentPlayer ? ' active' : ''}`;

    const avatar = document.createElement('div');
    avatar.className = 'score-avatar';
    avatar.textContent = pl.name.split(' ').map((w) => w[0] || '').join('').slice(0, 2).toUpperCase() || '?';

    const info = document.createElement('div');
    info.className = 'score-info';
    info.innerHTML = `<div class="score-name">${pl.name}</div><div class="score-pts">Score</div>`;

    const badge = document.createElement('div');
    badge.className = 'score-badge';
    badge.textContent = pl.score || 0;

    card.appendChild(avatar);
    card.appendChild(info);
    card.appendChild(badge);
    scoreGridEl.appendChild(card);
  });
}

function setMoveMessage(text) {
  if (text) {
    moveInfoEl.textContent = text;
    return;
  }

  if (selectedTile !== null) {
    const currentRack = getCurrentRack();
    moveInfoEl.textContent = `Selected tile: ${currentRack[selectedTile]}. Click a board square to place it.`;
  } else if (placedTiles.length > 0) {
    moveInfoEl.textContent = `Placed ${placedTiles.length} tile(s). Submit or reset to continue.`;
  } else {
    moveInfoEl.textContent = 'Select a tile to begin placing your word.';
  }
}

function setError(message) {
  errorTextEl.textContent = message;
}

function clearError() {
  errorTextEl.textContent = '';
}

function newGame() {
  totalScore = 0;
  lastMoveScore = 0;
  lastWord = 'None';
  selectedTile = null;
  placedTiles = [];
  createBoard();
  buildBag();
  if (players.length > 0) {
    players.forEach((pl) => {
      pl.score = 0;
      pl.rack = [];
      pl.lifelines = { removeTwo: true, hint: true, askFriend: true };
    });
    players.forEach(refillPlayerRack);
    currentPlayer = 0;
  } else {
    rack = [];
    refillRack();
  }
  renderBoard();
  renderRack();
  turnNumber = 1;
  updateStats();
  setMoveMessage('Game ready! Select a tile to begin.');
  clearError();
  saveGameState();
  // start the placement timer for the first player
  startBuildTimer();
}

if (submitBtn) submitBtn.addEventListener('click', submitMove);
if (resetBtn) resetBtn.addEventListener('click', resetPlacement);
if (recallBtn) recallBtn.addEventListener('click', resetPlacement);
if (exchangeBtn) exchangeBtn.addEventListener('click', exchangeTiles);
if (passBtn) passBtn.addEventListener('click', passTurn);
if (shuffleBtn) shuffleBtn.addEventListener('click', shuffleRack);
if (newGameBtn) newGameBtn.addEventListener('click', newGame);

// --- Player setup handlers ---
function renderNameInputs(count) {
  playerNamesEl.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '8px';
    wrapper.innerHTML = `<label>Player ${i + 1} name: <input type="text" name="player${i}" placeholder="Player ${i + 1}" required></label>`;
    playerNamesEl.appendChild(wrapper);
  }
}

// player count buttons
if (playerSetupEl) {
  playerSetupEl.querySelectorAll('button[data-count]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const count = Number(btn.dataset.count);
      renderNameInputs(count);
    });
  });

  startGameBtn.addEventListener('click', () => {
    const inputs = playerNamesEl.querySelectorAll('input');
    const names = Array.from(inputs).map((i) => i.value.trim() || i.placeholder);
    if (names.length < 2) {
      alert('Choose at least 2 players.');
      return;
    }
    players = names.map((n) => ({
      name: n,
      score: 0,
      rack: [],
      lifelines: { removeTwo: true, hint: true, askFriend: true }
    }));
    currentPlayer = 0;
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(players.map((p) => p.name)));
    clearSavedGameState();
    if (playerSetupEl) {
      playerSetupEl.classList.add('hidden');
      playerSetupEl.setAttribute('aria-hidden', 'true');
    }
    newGame();
    updateStats();
    setMoveMessage(`Ready. ${players[currentPlayer].name}'s turn.`);
  });
}

// show setup by default
// If a saved game exists, restore it; otherwise, load player names and start fresh
if (loadSavedGameState()) {
  if (playerSetupEl) {
    playerSetupEl.classList.add('hidden');
    playerSetupEl.setAttribute('aria-hidden', 'true');
  }
  renderBoard();
  renderRack();
  updateStats();
  setMoveMessage(`Ready. ${players[currentPlayer]?.name || 'Player'}'s turn.`);
  restoreBuildTimerFromState();
} else {
  const saved = localStorage.getItem(STORAGE_KEYS.players);
  if (saved) {
    try {
      const names = JSON.parse(saved);
      if (Array.isArray(names) && names.length >= 2) {
        players = names.map((n) => ({
          name: n,
          score: 0,
          rack: [],
          lifelines: { removeTwo: true, hint: true, askFriend: true }
        }));
        currentPlayer = 0;
        if (playerSetupEl) {
          playerSetupEl.classList.add('hidden');
          playerSetupEl.setAttribute('aria-hidden', 'true');
        }
        newGame();
        updateStats();
        setMoveMessage(`Ready. ${players[currentPlayer].name}'s turn.`);
      } else {
        if (playerSetupEl) {
          playerSetupEl.classList.remove('hidden');
          playerSetupEl.setAttribute('aria-hidden', 'false');
        } else newGame();
      }
    } catch (e) {
      if (playerSetupEl) {
        playerSetupEl.classList.remove('hidden');
        playerSetupEl.setAttribute('aria-hidden', 'false');
      } else newGame();
    }
  } else {
    if (playerSetupEl) {
      playerSetupEl.classList.remove('hidden');
      playerSetupEl.setAttribute('aria-hidden', 'false');
    } else {
      newGame();
    }
  }
}
