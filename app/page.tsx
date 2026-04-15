"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { reactionScoreAbi, reactionScoreAddress } from "./contract";
import { SignInWithBase } from "./sign-in-with-base";

type GameState = "idle" | "waiting" | "ready" | "clicked" | "tooSoon";

function getRank(time: number) {
  if (time < 180) return "Insane";
  if (time < 230) return "Fast";
  if (time < 300) return "Nice";
  if (time < 380) return "Okay";
  return "Slow";
}

export default function Home() {
  const { address, isConnected } = useAccount();

  const [gameState, setGameState] = useState<GameState>("idle");
  const [message, setMessage] = useState("Press start and wait for green.");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [rank, setRank] = useState<string>("--");

  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  const {
    data: onchainBest,
    refetch: refetchOnchainBest,
    isLoading: isBestLoading,
  } = useReadContract({
    address: reactionScoreAddress,
    abi: reactionScoreAbi,
    functionName: "getBestScore",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const startGame = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setGameState("waiting");
    setReactionTime(null);
    setRank("--");
    setMessage("Wait for green... don't tap too early.");

    const randomDelay = Math.floor(Math.random() * 4000) + 3000;

    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = Date.now();
      setGameState("ready");
      setMessage("TAP NOW");
    }, randomDelay);
  };

  const handleMainAreaClick = () => {
    if (gameState === "waiting") {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setGameState("tooSoon");
      setMessage("Too early. You jumped before the signal.");
      setAttempts((prev) => prev + 1);
      setRank("Too soon");
      return;
    }

    if (gameState === "ready" && startTimeRef.current) {
      const time = Date.now() - startTimeRef.current;
      const nextRank = getRank(time);

      setReactionTime(time);
      setRank(nextRank);
      setGameState("clicked");
      setMessage("Round finished.");
      setAttempts((prev) => prev + 1);

      if (bestTime === null || time < bestTime) {
        setBestTime(time);
      }
    }
  };

  const resetGame = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setGameState("idle");
    setReactionTime(null);
    setRank("--");
    setMessage("Press start and wait for green.");
  };

  const saveScoreOnchain = () => {
    if (!reactionTime || reactionTime <= 0) return;
    if (!isConnected) {
      alert("Connect wallet first");
      return;
    }

    writeContract({
      address: reactionScoreAddress,
      abi: reactionScoreAbi,
      functionName: "saveScore",
      args: [BigInt(reactionTime)],
    });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isTxSuccess) {
      refetchOnchainBest();
    }
  }, [isTxSuccess, refetchOnchainBest]);

  const bgClass =
    gameState === "ready"
      ? "from-green-500 to-emerald-700"
      : gameState === "tooSoon"
      ? "from-red-500 to-rose-700"
      : "from-[#0a0f1f] via-[#11162a] to-[#050816]";

  return (
    <main
      className={`min-h-screen bg-gradient-to-br ${bgClass} text-white transition-all duration-300`}
    >
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-6">
        <div
          onClick={handleMainAreaClick}
          className="w-full rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5 md:p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80 sm:text-xs">
                Base Mini App
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl md:text-4xl">
                Reaction Game
              </h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
              <p className="text-[10px] text-white/60">Best local</p>
              <p className="text-lg font-semibold sm:text-xl">
                {bestTime !== null ? `${bestTime} ms` : "--"}
              </p>
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/60">Status</p>
              <p className="mt-1 text-sm font-medium">{message}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/60">Last score</p>
              <p className="mt-1 text-xl font-semibold">
                {reactionTime !== null ? `${reactionTime} ms` : "--"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/60">Attempts</p>
              <p className="mt-1 text-xl font-semibold">{attempts}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/60">Onchain best</p>
              <p className="mt-1 text-xl font-semibold">
                {!isConnected
                  ? "--"
                  : isBestLoading
                  ? "Loading..."
                  : onchainBest !== undefined
                  ? `${Number(onchainBest)} ms`
                  : "--"}
              </p>
            </div>
          </div>

          <div
            className={`mb-4 flex min-h-[180px] cursor-pointer items-center justify-center rounded-3xl border border-white/10 px-4 text-center transition sm:min-h-[220px] ${
              gameState === "ready"
                ? "bg-green-500/80"
                : gameState === "tooSoon"
                ? "bg-red-500/80"
                : "bg-white/5"
            }`}
          >
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-white/60 sm:text-xs">
                Tap area
              </p>
              <p className="text-2xl font-bold sm:text-4xl">
                {gameState === "ready"
                  ? "TAP!"
                  : gameState === "waiting"
                  ? "WAIT..."
                  : gameState === "tooSoon"
                  ? "TOO SOON"
                  : gameState === "clicked"
                  ? `${reactionTime} ms`
                  : "READY?"}
              </p>

              {gameState === "clicked" && reactionTime !== null && (
                <p className="mt-3 text-sm text-white/75">
                  Your rank: <span className="font-semibold">{rank}</span>
                </p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <SignInWithBase />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="flex-1 rounded-full bg-cyan-400 px-5 py-3 text-base font-semibold text-slate-950 transition hover:scale-[1.01]"
            >
              Start Game
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (gameState === "clicked" || gameState === "tooSoon") {
                  startGame();
                } else {
                  resetGame();
                }
              }}
              className="flex-1 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/15"
            >
              {gameState === "clicked" || gameState === "tooSoon"
                ? "Play Again"
                : "Reset"}
            </button>
          </div>

          {reactionTime !== null && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  saveScoreOnchain();
                }}
                disabled={isWritePending || isTxLoading}
                className="w-full rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isWritePending || isTxLoading
                  ? "Saving on Base..."
                  : "Save score onchain"}
              </button>

              {isTxSuccess && (
                <p className="text-xs text-emerald-300">
                  Saved on Base mainnet.
                </p>
              )}

              {writeError && (
                <p className="max-w-xs text-xs text-red-300">
                  {(writeError as Error).message}
                </p>
              )}
            </div>
          )}

          {txHash && (
            <p className="mt-2 break-all text-[10px] text-white/50">
              Tx: {txHash}
            </p>
          )}

          <p className="mt-4 text-xs text-white/60">
            Rule: press start, wait for the green signal, then tap as fast as
            you can.
          </p>
        </div>
      </div>
    </main>
  );
}