// this is our global websocket, used to communicate from/to Stream Deck software
// and some info about our plugin, as sent by Stream Deck software
var websocket = null,
    uuid = null,
    actionInfo = {},
    inInfo = {};


let currentPair = "BTCUSD";
let currentCurrency = "USD";
let currentCandlesInterval = "1h";
let currentMultiplier = 1;
let currentDigits = 2;
let currentFont = "Lato,'Roboto Condensed',Helvetica,Calibri,sans-serif";
let currentBackgroundColor = "#000000";
let currentTextColor = "#ffffff";
let currentDisplayHighLow = "on";
let currentDisplayHighLowBar = "on";
let currentAlertRule = "";
let currentBackgroundColorRule = "";
let currentTextColorRule = "";
let currentMode = "ticker";

const loggingEnabled = false;
const pairsDropDown = document.getElementById("select-pair");
const currencyRelatedElements = document.getElementsByClassName("currencyRelated");
const currenciesDropDown = document.getElementById("select-currency");
const candlesIntervalDropDown = document.getElementById("candlesInterval");
const multiplierInput = document.getElementById("multiplier");
const digitsInput = document.getElementById("digits");
const fontInput = document.getElementById("font");
const backgroundColorInput = document.getElementById("backgroundColor");
const textColorInput = document.getElementById("textColor");
const highLowCheck = document.getElementById("displayHighLow");
const highLowBarCheck = document.getElementById("displayHighLowBar");
const alertRuleInput = document.getElementById("alertRule");
const backgroundColorRuleInput = document.getElementById("backgroundColorRule");
const textColorRuleInput = document.getElementById("textColorRule");

let pi = {
    log: function(...data) {
        if (loggingEnabled) {
            console.log(...data);
        }
    },

    initDom: function() {
        this.initPairsDropDown();
        this.initCurrenciesDropDown();

        var jThis = this;
        var callback = function() {
            jThis.checkNewSettings();
            this.refreshMenus();
        }
        pairsDropDown.onchange = callback;
        currenciesDropDown.onchange = callback;
        candlesIntervalDropDown.onchange = callback;

        multiplierInput.onchange = callback;
        multiplierInput.onkeyup = callback;

        digitsInput.onchange = callback;
        digitsInput.onkeyup = callback;

        fontInput.onchange = callback;
        fontInput.onkeyup = callback;

        backgroundColorInput.onchange = callback;
        textColorInput.onchange = callback;

        highLowCheck.onchange = callback;
        highLowBarCheck.onchange = callback;

        alertRuleInput.onchange = callback;
        alertRuleInput.onkeyup = callback;

        backgroundColorRuleInput.onchange = callback;
        backgroundColorRuleInput.onkeyup = callback;

        textColorRuleInput.onchange = callback;
        textColorRuleInput.onkeyup = callback;
    },
    initPairsDropDown: async function () {
        const pairs = await this.getPairs();
        this.log("initPairsDropDown", pairs);
        pairs.sort();
        pairs.forEach(function (pair) {
            var option = document.createElement("option");
            option.text = pair;
            option.value = pair;
            pairsDropDown.add(option);
        });

        this.refreshValues();
    },
    getPairs: async function () {
        const response = await fetch("https://api-pub.bitfinex.com/v2/conf/pub:list:pair:exchange");
        const responseJson = await response.json();
        this.log("getPairs", responseJson);

        return responseJson[0];
    },
    initCurrenciesDropDown: async function () {
        const currencies = await this.getCurrencies();
        this.log("initCurrenciesDropDown", currencies);
        currencies.sort();
        currencies.forEach(function (currency) {
            var option = document.createElement("option");
            option.text = currency;
            option.value = currency;
            currenciesDropDown.add(option);
        });

        this.refreshValues();
    },
    getCurrencies: async function() {
        const response = await fetch("https://api.exchangeratesapi.io/latest");
        const responseJson = await response.json();
        this.log("getCurrencies", responseJson);

        currencies =  new Set(Object.keys(responseJson["rates"]));
        currencies.add(responseJson["base"]);

        return Array.from(currencies);

    },
    extractSettings: function(settings) {
        this.log("extractSettings", settings);

        currentPair = settings["pair"] || currentPair;
        currentCurrency = settings["currency"] || currentCurrency;
        currentCandlesInterval = settings["candlesInterval"] || currentCandlesInterval;
        currentMultiplier = settings["multiplier"] || currentMultiplier;
        currentDigits = settings["digits"] || currentDigits;
        currentFont = settings["font"] || currentFont;
        currentBackgroundColor = settings["backgroundColor"] || currentBackgroundColor;
        currentTextColor = settings["textColor"] || currentTextColor;
        currentDisplayHighLow = settings["displayHighLow"] || currentDisplayHighLow;
        currentDisplayHighLowBar = settings["displayHighLowBar"] || currentDisplayHighLowBar;
        currentAlertRule = settings["alertRule"] || currentAlertRule;
        currentBackgroundColorRule = settings["backgroundColorRule"] || currentBackgroundColorRule;
        currentTextColorRule = settings["textColorRule"] || currentTextColorRule;
        currentMode = settings["mode"] || currentMode;

        this.refreshValues();
    },
    checkNewSettings: function() {
        this.log("checkNewSettings");
        currentPair = pairsDropDown.value;
        currentCurrency = currenciesDropDown.value;
        currentCandlesInterval = candlesIntervalDropDown.value;
        currentMultiplier = multiplierInput.value;
        currentDigits = digitsInput.value;
        currentFont = fontInput.value;
        currentBackgroundColor = backgroundColorInput.value;
        currentTextColor = textColorInput.value;
        currentDisplayHighLow = highLowCheck.checked?"on":"off";
        currentDisplayHighLowBar = highLowBarCheck.checked?"on":"off";
        currentAlertRule = alertRuleInput.value;
        currentBackgroundColorRule = backgroundColorRuleInput.value;
        currentTextColorRule = textColorRuleInput.value;

        this.saveSettings();
    },
    refreshValues: function() {
        this.log("refreshValues");
        pairsDropDown.value = currentPair;
        currenciesDropDown.value = currentCurrency;
        candlesIntervalDropDown.value = currentCandlesInterval;
        multiplierInput.value = currentMultiplier;
        digitsInput.value = currentDigits;
        fontInput.value = currentFont;
        backgroundColorInput.value = currentBackgroundColor;
        textColorInput.value = currentTextColor;

        highLowCheck.checked = currentDisplayHighLow!="off";
        highLowBarCheck.checked = currentDisplayHighLowBar!="off";

        alertRuleInput.value = currentAlertRule;
        backgroundColorRuleInput.value = currentBackgroundColorRule;
        textColorRuleInput.value = currentTextColorRule;

        this.refreshMenus();
    },
    refreshMenus: function() {
        if (currentPair.indexOf("USD")>=0) {
            this.applyDisplay(currencyRelatedElements, "block");
        } else {
            this.applyDisplay(currencyRelatedElements, "none");
        }
    },
    applyDisplay: function(elements, display) {
        for(i in Object.keys(elements)) {
            elements[i].style.display = display;
         }
    },
    saveSettings: function() {
        const newSettings = {
            "pair": currentPair,
            "currency": currentCurrency,
            "candlesInterval": currentCandlesInterval,
            "multiplier": currentMultiplier,
            "digits": currentDigits,
            "font": currentFont,
            "backgroundColor": currentBackgroundColor,
            "textColor": currentTextColor,
            "displayHighLow": currentDisplayHighLow,
            "displayHighLowBar": currentDisplayHighLowBar,
            "alertRule": currentAlertRule,
            "backgroundColorRule": currentBackgroundColorRule,
            "textColorRule": currentTextColorRule,
            "mode": currentMode,
        };
        this.log("saveSettings", newSettings);

        if (websocket && (websocket.readyState === 1)) {
            const jsonSetSettings = {
                "event": "setSettings",
                "context": uuid,
                "payload": newSettings
            };
            websocket.send(JSON.stringify(jsonSetSettings));

            const jsonPlugin = {
                "action": actionInfo["action"],
                "event": "sendToPlugin",
                "context": uuid,
                "payload": newSettings
            };
            websocket.send(JSON.stringify(jsonPlugin));
        }
    }
}

pi.initDom();

function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
    uuid = inUUID;
    // please note: the incoming arguments are of type STRING, so
    // in case of the inActionInfo, we must parse it into JSON first
    actionInfo = JSON.parse(inActionInfo); // cache the info
    inInfo = JSON.parse(inInfo);
    websocket = new WebSocket('ws://127.0.0.1:' + inPort);

    /** let's see, if we have some settings */
    pi.extractSettings(actionInfo.payload.settings);
    // console.log(actionInfo.payload.settings);

    // if connection was established, the websocket sends
    // an 'onopen' event, where we need to register our PI
    websocket.onopen = function () {
        var json = {
            event: inRegisterEvent,
            uuid: inUUID
        };
        // register property inspector to Stream Deck
        websocket.send(JSON.stringify(json));
    };

    websocket.onmessage = function (evt) {
        // Received message from Stream Deck
        var jsonObj = JSON.parse(evt.data);
        var event = jsonObj['event'];
        // console.log("Received message", jsonObj);
    };
}