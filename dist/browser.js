/*
The SDK interface for games to interact with Rune.
*/
var Rune = {
    // External properties and functions
    version: "1.4.2",
    init: function (input) {
        // Check that this function has not already been called
        if (Rune._doneInit) {
            throw new Error("Rune.init() should only be called once");
        }
        Rune._doneInit = true;
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
        Rune._validateScore(getScore());
        // Initialize the SDK with the game's functions
        Rune._startGame = startGame;
        Rune._resumeGame = resumeGame;
        Rune._pauseGame = pauseGame;
        Rune._getScore = getScore;
        // When running inside Rune, runePostMessage will always be defined.
        if (window.postRuneEvent) {
            window.postRuneEvent({ type: "INIT", version: Rune.version });
        }
        else {
            Rune._mockEvents();
        }
    },
    gameOver: function () {
        var _a;
        if (!Rune._doneInit) {
            throw new Error("Rune.gameOver() called before Rune.init()");
        }
        var score = Rune._getScore();
        Rune._validateScore(score);
        Rune._resetDeterministicRandom();
        (_a = window.postRuneEvent) === null || _a === void 0 ? void 0 : _a.call(window, {
            type: "GAME_OVER",
            score: score,
            challengeNumber: Rune.getChallengeNumber()
        });
    },
    getChallengeNumber: function () { var _a; return (_a = window._runeChallengeNumber) !== null && _a !== void 0 ? _a : 1; },
    deterministicRandom: function () {
        // The first time that this method is called, replace it with our
        // deterministic random number generator and return the first number.
        Rune._resetDeterministicRandom();
        return Rune.deterministicRandom();
    },
    // Internal properties and functions used by the Rune app
    _doneInit: false,
    _requestScore: function () {
        var _a;
        var score = Rune._getScore();
        Rune._validateScore(score);
        (_a = window.postRuneEvent) === null || _a === void 0 ? void 0 : _a.call(window, {
            type: "SCORE",
            score: score,
            challengeNumber: Rune.getChallengeNumber()
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
        window.postRuneEvent = function (event) {
            return console.log("RUNE: Posted ".concat(JSON.stringify(event)));
        };
        // Mimic the user tapping Play after 3 seconds
        console.log("RUNE: Starting new game in 3 seconds.");
        setTimeout(function () {
            Rune._startGame();
            console.log("RUNE: Started new game.");
        }, 3000);
        // Automatically restart game 3 seconds after Game Over
        Rune.gameOver = function () {
            var _a;
            var score = Rune._getScore();
            Rune._validateScore(score);
            Rune._resetDeterministicRandom();
            (_a = window.postRuneEvent) === null || _a === void 0 ? void 0 : _a.call(window, {
                type: "GAME_OVER",
                score: score,
                challengeNumber: Rune.getChallengeNumber()
            });
            console.log("RUNE: Starting new game in 3 seconds.");
            setTimeout(function () {
                Rune._startGame();
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
        var hash = Rune._hashFromString(seed.toString());
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
        Rune.deterministicRandom = Rune._randomNumberGenerator(Rune.getChallengeNumber());
    }
};
