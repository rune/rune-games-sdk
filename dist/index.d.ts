interface InitInput {
    startGame: () => void;
    resumeGame: () => void;
    pauseGame: () => void;
    getScore: () => number;
}
export interface RuneExport {
    version: string;
    init: (input: InitInput) => void;
    gameOver: () => void;
    getChallengeNumber: () => number;
    deterministicRandom: () => number;
    _doneInit: boolean;
    _startGame: () => void;
    _resumeGame: () => void;
    _pauseGame: () => void;
    _requestScore: () => void;
    _getScore: () => number;
    _validateScore: (score: number) => void;
    _mockEvents: () => void;
    _randomNumberGenerator: (seed: number) => () => number;
    _hashFromString: (str: string) => number;
    _resetDeterministicRandom: () => void;
}
export declare const Rune: RuneExport;
declare global {
    var postRuneEvent: ((event: RuneGameEvent) => void) | undefined;
    var _runeChallengeNumber: number | undefined;
}
export declare type RuneGameEvent = {
    type: "INIT";
    version: string;
} | {
    type: "GAME_OVER";
    score: number;
    challengeNumber: number;
} | {
    type: "ERR";
    errMsg: string;
} | {
    type: "SCORE";
    score: number;
    challengeNumber: number;
};
export {};
