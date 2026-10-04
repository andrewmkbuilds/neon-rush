// Permanent upgrades purchased with Neon Credits in the Storefront.
// Small head-start bonuses — no pay-to-win, fully offline.

export const UPGRADES = [
  {
    id: "start_energy",
    name: "Energy Capacitor",
    desc: "Begin every run with bonus energy already charged.",
    maxTier: 5,
    baseCost: 80,
    costStep: 60,
    per: 1,
    unit: "energy",
  },
];

export function upgradeCost(upg, currentTier) {
  return upg.baseCost + upg.costStep * currentTier;
}

export function getUpgradeTier(profile, id) {
  return profile.upgrades?.[id] || 0;
}

export function getUpgradeView(profile) {
  return UPGRADES.map((u) => {
    const tier = getUpgradeTier(profile, u.id);
    const cost = upgradeCost(u, tier);
    const maxed = tier >= u.maxTier;
    return { ...u, tier, cost, maxed };
  });
}

// Total starting in-run energy granted by purchased upgrades.
export function getStartEnergy(profile) {
  const u = UPGRADES.find((x) => x.id === "start_energy");
  if (!u) return 0;
  return getUpgradeTier(profile, "start_energy") * (u.per || 1);
}