import { extractErrMsg } from "./helper"

import * as src from "../src"
let Rune: src.RuneExport

beforeEach(async () => {
  // Reset globally injected challenge number
  delete globalThis._runeChallengeNumber

  // Reimport of the Rune module between every test
  jest.resetModules()
  Rune = (await import("../src")).Rune
})

describe("sdk", function () {
  test("init() -> startGame() -> pauseGame() -> resumeGame()", async function () {
    // Mock a game's state and mimic running inside Rune where env is set
    globalThis.postRuneEvent = () => {}
    let gameState: "WAITING" | "RUNNING" | "PAUSED" = "WAITING"
    Rune.init({
      startGame: () => {
        gameState = "RUNNING"
      },
      pauseGame: () => {
        gameState = "PAUSED"
      },
      resumeGame: () => {
        gameState = "RUNNING"
      },
      getScore: () => {
        return 0
      },
    })

    // Should be no change in gameState from calling init()
    expect(gameState).toMatchInlineSnapshot(`"WAITING"`)

    // Should start the game
    Rune._startGame()
    expect(gameState).toMatchInlineSnapshot(`"RUNNING"`)

    // Should pause the game
    Rune._pauseGame()
    expect(gameState).toMatchInlineSnapshot(`"PAUSED"`)

    // Should resume the game
    Rune._resumeGame()
    expect(gameState).toMatchInlineSnapshot(`"RUNNING"`)
  })

  test("don't allow calling other functions before init()", async function () {
    expect(
      await extractErrMsg(() => {
        Rune._startGame()
      })
    ).toMatchInlineSnapshot(`"Rune._startGame() called before Rune.init()"`)
  })

  test("ensure correct properties passed to init()", async function () {
    expect(
      await extractErrMsg(() => {
        //@ts-expect-error
        Rune.init()
      })
    ).toMatchInlineSnapshot(`"Invalid startGame function provided to Rune.init()"`)
  })

  test("ensure correct types passed to init()", async function () {
    expect(
      await extractErrMsg(() => {
        //@ts-expect-error
        Rune.init({ startGame: () => {}, resumeGame: "sure", pauseGame: "sometimes" })
      })
    ).toMatchInlineSnapshot(`"Invalid resumeGame function provided to Rune.init()"`)
  })

  test("ensure score passed as number", async function () {
    expect(
      await extractErrMsg(() => {
        Rune.init({
          startGame: () => {},
          resumeGame: () => {},
          pauseGame: () => {},
          //@ts-expect-error
          getScore: () => {
            return "99"
          },
        })
      })
    ).toMatchInlineSnapshot(`"Score is not a number. Received: string"`)
  })

  test("exposed version should match npm version", async function () {
    const packageJson = require("../package.json")
    expect(packageJson.version).toMatch(Rune.version)
  })

  test("INIT event should include version matching npm version", async function () {
    const packageJson = require("../package.json")

    let version: string | undefined
    globalThis.postRuneEvent = (event) => {
      if (event.type === "INIT") {
        version = event.version
      }
    }

    Rune.init({
      startGame: () => {},
      pauseGame: () => {},
      resumeGame: () => {},
      getScore: () => {
        return 0
      },
    })

    expect(packageJson.version).toBe(version)
  })

  test("SCORE event should include score from game's getScore() and challenge number", async function () {
    // Init challenge number
    const challengeNumber = 123
    globalThis._runeChallengeNumber = challengeNumber

    // Init with score function
    let gameScore = 0
    const getScore = () => {
      return gameScore
    }
    Rune.init({
      startGame: () => {},
      pauseGame: () => {},
      resumeGame: () => {},
      getScore: getScore,
    })

    // Override postRuneEvent to extract score
    let eventScore: number | undefined
    let eventChallengeNumber: number | undefined
    globalThis.postRuneEvent = (event) => {
      if (event.type === "SCORE") {
        eventScore = event.score
        eventChallengeNumber = event.challengeNumber
      }
    }

    // Mock game updating its local score and extract using _requestScore
    gameScore = 100
    Rune._requestScore()
    expect(eventScore).toEqual(gameScore)
    expect(eventChallengeNumber).toEqual(challengeNumber)
  })

  test("GAME_OVER event should include score from game's getScore() and challenge number", async function () {
    // Init challenge number
    const challengeNumber = 123
    globalThis._runeChallengeNumber = challengeNumber

    // Init with score function
    let gameScore = 0
    const getScore = () => {
      return gameScore
    }
    Rune.init({
      startGame: () => {},
      pauseGame: () => {},
      resumeGame: () => {},
      getScore: getScore,
    })

    // Override postRuneEvent to extract score and challenge number
    let eventScore: number | undefined
    let eventChallengeNumber: number | undefined
    globalThis.postRuneEvent = (event) => {
      if (event.type === "GAME_OVER") {
        eventScore = event.score
        eventChallengeNumber = event.challengeNumber
      }
    }

    // Mock game updating its local score and extract using gameOver
    gameScore = 100
    Rune.gameOver()
    expect(eventScore).toEqual(gameScore)
    expect(eventChallengeNumber).toEqual(challengeNumber)
  })

  test("allow replacing functions through code injection", async function () {
    let gameFinished = false

    // Mimic running inside Rune, where gameOver() is replaced using code injection
    Rune.gameOver = () => {
      gameFinished = true
    }
    globalThis.postRuneEvent = () => {}

    // See that the injected gameOver() is used
    Rune.gameOver()
    expect(gameFinished).toEqual(true)

    // See that calling init() doesn't overwrite injected gameOver()
    gameFinished = false
    Rune.init({
      startGame: () => {},
      pauseGame: () => {},
      resumeGame: () => {},
      getScore: () => {
        return 0
      },
    })
    Rune.gameOver()
    expect(gameFinished).toEqual(true)
  })

  test("get challenge number if not injected", async function () {
    const challengeNumber = Rune.getChallengeNumber()

    // See that default challenge number is 1
    expect(challengeNumber).toEqual(1)
  })

  test("get challenge number if injected", async function () {
    globalThis._runeChallengeNumber = 123
    const challengeNumber = Rune.getChallengeNumber()

    // See that challenge number is correct
    expect(challengeNumber).toEqual(123)
  })

  test("deterministicRandom() works before init()", async function () {
    const randomArray = [...Array(7)].map(() =>
      Math.round(Rune.deterministicRandom() * 10)
    )
    expect(randomArray).toEqual([1, 4, 4, 3, 5, 1, 7])
  })

  test("deterministicRandom() changes value based on challengeNumber", async function () {
    // Mimic challengeNumber being set before loading
    globalThis._runeChallengeNumber = 123

    const randomArray = [...Array(7)].map(() =>
      Math.round(Rune.deterministicRandom() * 10)
    )
    expect(randomArray).toEqual([2, 4, 5, 3, 6, 9, 6])
  })

  test("deterministicRandom() resets with gameOver()", async function () {
    const randomArray1 = [...Array(7)].map(() =>
      Math.round(Rune.deterministicRandom() * 10)
    )

    // Mimic being in the actual app to avoid mockEvents() causing issues
    globalThis.postRuneEvent = () => {}

    // Call init() and gameOver()
    Rune.init({
      startGame: () => {},
      pauseGame: () => {},
      resumeGame: () => {},
      getScore: () => {
        return 0
      },
    })
    Rune.gameOver()

    // See that random numbers are identical
    const randomArray2 = [...Array(7)].map(() =>
      Math.round(Rune.deterministicRandom() * 10)
    )
    expect(randomArray1).toEqual(randomArray2)
  })

  test("deterministicRandom() seed changes dramatically with every challenge number", async function () {
    // This is important to prevent correlation etc. between challenges
    expect(Rune._hashFromString("1")).toMatchInlineSnapshot("1986881138")
    expect(Rune._hashFromString("2")).toMatchInlineSnapshot("2072285185")
  })
})
