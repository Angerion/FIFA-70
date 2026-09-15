import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../types";

interface GameContextType {
  profile: UserProfile;
  addCoins: (amount: number) => void;
  buyPlayer: (playerId: string, cost: number) => boolean;
  buyMultiplier: (cost: number) => boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  coins: 0,
  roster: [],
  multipliers: 1,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("fifa70_profile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem("fifa70_profile", JSON.stringify(profile));
  }, [profile]);

  const addCoins = (amount: number) => {
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + amount * prev.multipliers,
    }));
  };

  const buyPlayer = (playerId: string, cost: number) => {
    if (profile.coins >= cost) {
      setProfile((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        roster: [...prev.roster, playerId],
      }));
      return true;
    }
    return false;
  };

  const buyMultiplier = (cost: number) => {
    if (profile.coins >= cost) {
      setProfile((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        multipliers: prev.multipliers + 0.5,
      }));
      return true;
    }
    return false;
  };

  return (
    <GameContext.Provider
      value={{ profile, addCoins, buyPlayer, buyMultiplier }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};
