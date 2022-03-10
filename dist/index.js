"use strict";
/*
The SDK interface for games to interact with Rune.
*/
exports.__esModule = true;
exports.Rune = void 0;
exports.Rune = {
    // External properties and functions
    version: "1.4.2",
    init: function (input) {
        // Check that this function has not already been called
        if (exports.Rune._doneInit) {
            throw new Error("Rune.init() should only be called once");
        }
        exports.Rune._doneInit = true;
        // Check that game provided correct input to SDK
        var _a = input || {}, startGame = _a.startGame, resumeGame = _a.resumeGame, pauseGame = _a.pauseGame, getScore = _a.getScore;
        if (typeof startGame !== "function") {
            throw new Error("Invalid startGame function provided to Rune.init()");
        }
        if (typeof resumeGame !== "function") {
            throw new Error("Invalid resumeGame function provided to Rune.init()");
        }
        if (typeof pauseGame !== "function") {
            throw new Error("Invalid pauseGame function provided to Rune.init()");
        }
        if (typeof getScore !== "function") {
            throw new Error("Invalid getScore function provided to Rune.init()");
        }
        exports.Rune._validateScore(getScore());
        // Initialize the SDK with the game's functions
        exports.Rune._startGame = startGame;
        exports.Rune._resumeGame = resumeGame;
        exports.Rune._pauseGame = pauseGame;
        exports.Rune._getScore = getScore;
        // When running inside Rune, runePostMessage will always be defined.
        if (globalThis.postRuneEvent) {
            globalThis.postRuneEvent({ type: "INIT", version: exports.Rune.version });
        }
        else {
            exports.Rune._mockEvents();
        }
    },
    gameOver: function () {
        var _a;
        if (!exports.Rune._doneInit) {
            throw new Error("Rune.gameOver() called before Rune.init()");
        }
        var score = exports.Rune._getScore();
        exports.Rune._validateScore(score);
        exports.Rune._resetDeterministicRandom();
        (_a = globalThis.postRuneEvent) === null || _a === void 0 ? void 0 : _a.call(globalThis, {
            type: "GAME_OVER",
            score: score,
            challengeNumber: exports.Rune.getChallengeNumber()
        });
    },
    getChallengeNumber: function () { var _a; return (_a = globalThis._runeChallengeNumber) !== null && _a !== void 0 ? _a : 1; },
    deterministicRandom: function () {
        // The first time that this method is called, replace it with our
        // deterministic random number generator and return the first number.
        exports.Rune._resetDeterministicRandom();
        return exports.Rune.deterministicRandom();
    },
    // Internal properties and functions used by the Rune app
    _doneInit: false,
    _requestScore: function () {
        var _a;
        var score = exports.Rune._getScore();
        exports.Rune._validateScore(score);
        (_a = globalThis.postRuneEvent) === null || _a === void 0 ? void 0 : _a.call(globalThis, {
            type: "SCORE",
            score: score,
            challengeNumber: exports.Rune.getChallengeNumber()
        });
    },
    _startGame: function () {
        throw new Error("Rune._startGame() called before Rune.init()");
    },
    _resumeGame: function () {
        throw new Error("Rune._resumeGame() called before Rune.init()");
    },
    _pauseGame: function () {
        throw new Error("Rune._pauseGame() called before Rune.init()");
    },
    _getScore: function () {
        throw new Error("Rune._getScore() called before Rune.init()");
    },
    _validateScore: function (score) {
        if (typeof score !== "number") {
            throw new Error("Score is not a number. Received: ".concat(typeof score));
        }
        if (score < 0 || score > Math.pow(10, 9)) {
            throw new Error("Score is not between 0 and 1000000000. Received: ".concat(score));
        }
        if (!Number.isInteger(score)) {
            throw new Error("Score is not an integer. Received: ".concat(score));
        }
    },
    // Create mock events to support development
    _mockEvents: function () {
        // Log posted events to the console (in production, these are processed by Rune)
        globalThis.postRuneEvent = function (event) {
            return console.log("RUNE: Posted ".concat(JSON.stringify(event)));
        };
        // Mimic the user tapping Play after 3 seconds
        console.log("RUNE: Starting new game in 3 seconds.");
        setTimeout(function () {
            exports.Rune._startGame();
            console.log("RUNE: Started new game.");
        }, 3000);
        // Automatically restart game 3 seconds after Game Over
        exports.Rune.gameOver = function () {
            var _a;
            var score = exports.Rune._getScore();
            exports.Rune._validateScore(score);
            exports.Rune._resetDeterministicRandom();
            (_a = globalThis.postRuneEvent) === null || _a === void 0 ? void 0 : _a.call(globalThis, {
                type: "GAME_OVER",
                score: score,
                challengeNumber: exports.Rune.getChallengeNumber()
            });
            console.log("RUNE: Starting new game in 3 seconds.");
            setTimeout(function () {
                exports.Rune._startGame();
                console.log("RUNE: Started new game.");
            }, 3000);
        };
    },
    // A pseudorandom number generator (PRNG) for determinism.
    // Based on the efficient mulberry32 with 32-bit state.
    // From https://github.com/bryc/code/blob/master/jshash/PRNGs.md.
    _randomNumberGenerator: function (seed) {
        // Initialize using hash function to avoid seed quality issues.
        // E.g. to avoid correlations between using 1 and 2 as seed.
        var hash = exports.Rune._hashFromString(seed.toString());
        return function () {
            var t = (hash += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    },
    // xmur3 from https://github.com/bryc/code/blob/master/jshash/PRNGs.md.
    // Returns a number as opposed to seed() function for ease of use.
    _hashFromString: function (str) {
        for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        var seed = function () {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return (h ^= h >>> 16) >>> 0;
        };
        return seed();
    },
    _resetDeterministicRandom: function () {
        // Reset randomness to be deterministic across plays
        exports.Rune.deterministicRandom = exports.Rune._randomNumberGenerator(exports.Rune.getChallengeNumber());
    },
    _getQueryParams: function () {
        return decodeURI(window.location.search)
            .replace('?', '')
            .split('&')
            .map(function (param) { return param.split('='); })
            .reduce(function (values, _a) {
            var key = _a[0], value = _a[1];
            values[key] = value;
            return values;
        }, {});
    }
};
(function () {
    var queryParams = exports.Rune._getQueryParams();
    if (!!queryParams.enableInitialOverlayInBrowser && queryParams.enableInitialOverlayInBrowser === '1') {
        document.addEventListener('DOMContentLoaded', function () {
            var div = document.createElement('div');
            div.setAttribute('style', "top: 0; bottom: 0; left: 0; right: 0; position: absolute; z-index: 9999;");
            div.addEventListener('click', function () {
                div.remove();
                if (globalThis.postRuneEvent) {
                    globalThis.postRuneEvent({ type: "_INITIAL_OVERLAY_CLICK" });
                }
            });
            document.body.appendChild(div);
        });
    }
})();
//# sourceMappingURL=index.js.map