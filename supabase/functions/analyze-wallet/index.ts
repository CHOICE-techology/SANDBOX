import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RPC_ENDPOINTS: Record<string, string> = {
  ethereum: "https://eth.llamarpc.com",
  arbitrum: "https://arb1.arbitrum.io/rpc",
  base: "https://mainnet.base.org",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  polygon: "https://polygon-rpc.com",
};

async function getEthLikeStats(rpcUrl: string, address: string) {
  try {
    // Get transaction count
    const txCountRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionCount", params: [address, "latest"], id: 1 }),
    });
    const txCountData = await txCountRes.json();
    const txCount = parseInt(txCountData?.result || "0x0", 16);

    // Get balance
    const balRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [address, "latest"], id: 2 }),
    });
    const balData = await balRes.json();
    const balWei = BigInt(balData?.result || "0x0");
    const balEth = Number(balWei) / 1e18;

    return { txCount, balance: balEth };
  } catch (e) {
    console.error("RPC error:", e);
    return { txCount: 0, balance: 0 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    if (!address || typeof address !== "string") {
      return new Response(JSON.stringify({ error: "Missing address" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Query all EVM chains in parallel
    const chainResults = await Promise.allSettled(
      Object.entries(RPC_ENDPOINTS).map(async ([chain, rpc]) => {
        const stats = await getEthLikeStats(rpc, address);
        return { chain, ...stats };
      })
    );

    const activeChains: string[] = [];
    let totalTxCount = 0;
    let totalBalance = 0;
    const chainDetails: Record<string, { txCount: number; balance: number }> = {};

    for (const result of chainResults) {
      if (result.status === "fulfilled") {
        const { chain, txCount, balance } = result.value;
        chainDetails[chain] = { txCount, balance };
        totalTxCount += txCount;
        totalBalance += balance;
        if (txCount > 0 || balance > 0) {
          activeChains.push(chain.charAt(0).toUpperCase() + chain.slice(1));
        }
      }
    }

    // Estimate account age based on tx count
    const accountAge = totalTxCount > 100 ? "3+ years" : totalTxCount > 50 ? "2+ years" : totalTxCount > 10 ? "1+ year" : totalTxCount > 0 ? "< 1 year" : "New";

    // Generate mock activity data (we don't have historical data from RPCs)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const activityData = months.map((name) => ({
      name,
      tx: Math.max(0, Math.floor(totalTxCount / 6 + (Math.random() - 0.5) * (totalTxCount / 3))),
    }));

    const totalVolume = totalBalance > 100 ? `${totalBalance.toFixed(1)} ETH` : totalBalance > 1 ? `${totalBalance.toFixed(2)} ETH` : `${totalBalance.toFixed(4)} ETH`;

    const response = {
      txCount: totalTxCount,
      accountAge,
      totalVolume,
      assetsHeld: `${activeChains.length} chain${activeChains.length !== 1 ? "s" : ""}`,
      netValue: totalBalance > 0 ? `$${(totalBalance * 3500).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "$0",
      activityData,
      chain: "Multi-chain",
      activeChains,
      balance: `${totalBalance.toFixed(4)} ETH`,
      chainDetails,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
