import { Player, Position } from "../types";
import { TEAMS_1970 } from "./teams";

// Legendary players have custom stats closer to 100
const LEGENDS: Partial<Player>[] = [
  {
    id: "p_pele",
    name: "Pelé",
    country: "BRA",
    position: "FWD",
    stats: { speed: 95, shooting: 99, tackling: 40 },
    price: 500,
  },
  {
    id: "p_jairzinho",
    name: "Jairzinho",
    country: "BRA",
    position: "FWD",
    stats: { speed: 96, shooting: 92, tackling: 35 },
    price: 400,
  },
  {
    id: "p_beckenbauer",
    name: "F. Beckenbauer",
    country: "FRG",
    position: "DEF",
    stats: { speed: 82, shooting: 78, tackling: 98 },
    price: 480,
  },
  {
    id: "p_muller",
    name: "G. Müller",
    country: "FRG",
    position: "FWD",
    stats: { speed: 85, shooting: 98, tackling: 30 },
    price: 450,
  },
  {
    id: "p_riva",
    name: "L. Riva",
    country: "ITA",
    position: "FWD",
    stats: { speed: 88, shooting: 94, tackling: 30 },
    price: 420,
  },
  {
    id: "p_moore",
    name: "B. Moore",
    country: "ENG",
    position: "DEF",
    stats: { speed: 78, shooting: 60, tackling: 99 },
    price: 470,
  },
  {
    id: "p_charlton",
    name: "B. Charlton",
    country: "ENG",
    position: "MID",
    stats: { speed: 85, shooting: 92, tackling: 70 },
    price: 460,
  },
  {
    id: "p_cubilla",
    name: "L. Cubilla",
    country: "URU",
    position: "FWD",
    stats: { speed: 87, shooting: 85, tackling: 40 },
    price: 350,
  },
];

function generateSquad(teamId: string): Player[] {
  const squad: Player[] = [];
  const positions: Position[] = [
    "GK",
    "DEF",
    "DEF",
    "DEF",
    "DEF",
    "MID",
    "MID",
    "MID",
    "FWD",
    "FWD",
    "FWD",
  ];

  positions.forEach((pos, idx) => {
    // Check if we have a legend for this team/position to inject instead,
    // but for simplicity we just generate 11 generic players first,
    // and we'll override/add legends later.
    const quality = Math.random(); // 0 to 1

    // Base stats depending on role
    let speed = 50 + Math.floor(Math.random() * 30);
    let shooting = 40 + Math.floor(Math.random() * 40);
    let tackling = 40 + Math.floor(Math.random() * 40);

    if (pos === "FWD") shooting += 20;
    if (pos === "DEF") tackling += 20;
    if (pos === "MID") {
      speed += 10;
      shooting += 10;
      tackling += 10;
    }
    if (pos === "GK") {
      speed -= 10;
      tackling += 30;
    }

    // Cap at 90 for generic players
    speed = Math.min(speed, 90);
    shooting = Math.min(shooting, 90);
    tackling = Math.min(tackling, 90);

    const price = Math.floor((speed + shooting + tackling) / 3) * 2; // Weak: ~100-150. Strong: ~150-180.

    squad.push({
      id: `gen_${teamId}_${idx}`,
      name: `Player ${idx + 1}`,
      country: teamId,
      position: pos,
      stats: { speed, shooting, tackling },
      price,
    });
  });

  return squad;
}

export const PLAYERS_1970: Player[] = [];

// Populate generic squads
TEAMS_1970.forEach((team) => {
  PLAYERS_1970.push(...generateSquad(team.id));
});

// Add/Overwrite legends
LEGENDS.forEach((legend) => {
  // We just add them to the pool
  PLAYERS_1970.push(legend as Player);
});
