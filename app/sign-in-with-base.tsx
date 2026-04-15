"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function shortAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function SignInWithBase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleSignIn = async () => {
    const baseAccountConnector = connectors.find(
      (connector) => connector.id === "baseAccount"
    );

    if (!baseAccountConnector) {
      setError("Base Account connector not found");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const nonce = window.crypto.randomUUID().replace(/-/g, "");
      await connectAsync({ connector: baseAccountConnector });

      const provider = await baseAccountConnector.getProvider();
      if (!provider) {
        throw new Error("Provider not available");
      }

      const authResult = await (provider as any).request({
        method: "wallet_connect",
        params: [
          {
            version: "1",
            capabilities: {
              signInWithEthereum: {
                nonce,
                chainId: "0x2105",
              },
            },
          },
        ],
      });

      console.log("authResult", authResult);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          className="min-w-[320px] cursor-default rounded-[18px] border-2 border-[#4da3ff] bg-black px-8 py-5 text-[22px] font-bold text-white"
        >
          {shortAddress(address)}
        </button>

        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded-xl border border-[#666] px-4 py-2 text-sm text-[#cfcfcf]"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className="min-w-[320px] rounded-[18px] border-2 border-[#4da3ff] bg-black px-8 py-5 text-[22px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Signing in..." : "Sign in with Base"}
      </button>

      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}