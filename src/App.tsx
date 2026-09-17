/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GameProvider, useGame } from "./store/GameContext";
import { TEAMS_1970 } from "./data/teams";
import { PLAYERS_1970 } from "./data/players";
import { GameCanvas } from "./components/GameCanvas";

type Screen = "menu" | "country_select" | "roster" | "match" | "wc_hub" | "wc_select";

function Game() {
  const { profile, addCoins, addRawCoins, buyPlayer, buyMultiplier, resetProfile } = useGame();
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [selectedTeam, setSelectedTeam] = useState<string>("BRA");

  // World Cup State
  const [isWcMode, setIsWcMode] = useState(false);
  const [wcStage, setWcStage] = useState<'groups' | 'playoffs' | 'eliminated' | 'champion'>('groups');
  const [wcGroupMatches, setWcGroupMatches] = useState(0);
  const [wcGroupWins, setWcGroupWins] = useState(0);
  const [wcPlayoffRound, setWcPlayoffRound] = useState<'QF' | 'SF' | 'Final'>('QF');
  const [wcOpponent, setWcOpponent] = useState<string>('');
  const [wcRedCards, setWcRedCards] = useState<string[]>([]);

  const generateRandomOpponent = (exclude: string) => {
    const others = TEAMS_1970.filter(t => t.id !== exclude);
    return others[Math.floor(Math.random() * others.length)].id;
  };

  const startWorldCup = (teamId: string) => {
    setSelectedTeam(teamId);
    setIsWcMode(true);
    setWcStage('groups');
    setWcGroupMatches(0);
    setWcGroupWins(0);
    setWcPlayoffRound('QF');
    setWcRedCards([]);
    setWcOpponent(generateRandomOpponent(teamId));
    setCurrentScreen("wc_hub");
  };

  const handleMatchEnd = (stats: any) => {
    let coinsEarned = 1000;
    
    if (!isWcMode) {
      if (stats.result === "win") coinsEarned += 100;
      if (stats.goals >= 3) coinsEarned += 50; 
      addCoins(coinsEarned);
      setCurrentScreen("menu");
    } else {
      // World Cup Logic
      if (stats.reds && stats.reds.length > 0) {
         setWcRedCards(prev => [...prev, ...stats.reds]);
      }
      
      if (stats.result === "win") coinsEarned += 100; // base win

      if (wcStage === 'groups') {
        const newWins = stats.result === "win" ? wcGroupWins + 1 : wcGroupWins;
        const newMatches = wcGroupMatches + 1;
        setWcGroupWins(newWins);
        setWcGroupMatches(newMatches);

        if (newMatches >= 3) {
          if (newWins >= 2) {
            setWcStage('playoffs');
            setWcPlayoffRound('QF');
            setWcOpponent(generateRandomOpponent(selectedTeam));
            coinsEarned += 300; // Group advance bonus
          } else {
            setWcStage('eliminated');
          }
        } else {
          setWcOpponent(generateRandomOpponent(selectedTeam));
        }
      } else if (wcStage === 'playoffs') {
        if (stats.result !== "win") {
           setWcStage('eliminated');
        } else {
           if (wcPlayoffRound === 'QF') {
             setWcPlayoffRound('SF');
             setWcOpponent(generateRandomOpponent(selectedTeam));
             coinsEarned += 500;
           } else if (wcPlayoffRound === 'SF') {
             setWcPlayoffRound('Final');
             setWcOpponent(generateRandomOpponent(selectedTeam));
             coinsEarned += 1000;
           } else if (wcPlayoffRound === 'Final') {
             setWcStage('champion');
             coinsEarned += 5000; // Won the WC
           }
        }
      }
      
      addCoins(coinsEarned);
      setCurrentScreen("wc_hub");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF6E3] font-['Press_Start_2P'] text-[#2D3748] flex flex-col items-center justify-center p-4">
      {/* CRT Overlay Effect */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] z-50 opacity-20" />

      <AnimatePresence mode="wait">
        {currentScreen === "match" ? (
          <motion.div
            key="match"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black"
          >
            <GameCanvas
              homeTeamId={selectedTeam}
              awayTeamId={
                isWcMode ? wcOpponent : (TEAMS_1970.find((t) => t.id !== selectedTeam)?.id || "ITA")
              }
              bannedPlayerIds={isWcMode ? wcRedCards : undefined}
              onQuit={() => setCurrentScreen(isWcMode ? "wc_hub" : "menu")}
              onMatchEnd={handleMatchEnd}
            />
          </motion.div>
        ) : (
          <motion.div
            key="ui"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl bg-white border-4 border-[#2D3748] shadow-[8px_8px_0px_0px_rgba(45,55,72,1)] rounded-lg p-8 relative"
          >
            <div className="absolute top-4 right-8 flex flex-col items-end">
              <span className="text-[#D69E2E] text-sm">
                COINS: {profile.coins}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Multi: x{profile.multipliers}
              </span>
            </div>

            <div className="text-center mb-12 mt-4">
              <h1 className="text-4xl md:text-6xl text-[#E53E3E] drop-shadow-[4px_4px_0px_rgba(45,55,72,1)] mb-4 tracking-tighter">
                FIFA 70
              </h1>
              <p className="text-xs md:text-sm text-gray-500 uppercase tracking-widest">
                World Cup Arcade
              </p>
            </div>

            {currentScreen === "menu" && (
              <div className="flex flex-col gap-6 max-w-md mx-auto">
                <button
                  onClick={() => setIsWcMode(false) || setCurrentScreen("country_select")}
                  className="bg-[#3182CE] text-white py-4 px-6 border-4 border-[#2D3748] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(45,55,72,1)] transition-all uppercase text-sm"
                >
                  Quick Match
                </button>
                <button
                  onClick={() => setCurrentScreen("wc_select")}
                  className="bg-[#D69E2E] text-white py-4 px-6 border-4 border-[#2D3748] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(45,55,72,1)] transition-all uppercase text-sm"
                >
                  World Cup Mode
                </button>
                <button
                  onClick={() => setCurrentScreen("roster")}
                  className="bg-[#48BB78] text-white py-4 px-6 border-4 border-[#2D3748] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(45,55,72,1)] transition-all uppercase text-sm"
                >
                  Manage Roster
                </button>
                <div className="mt-8 border-t-2 border-dashed border-gray-300 pt-6">
                  <button
                    onClick={() => buyMultiplier(500)}
                    className="w-full text-xs bg-yellow-400 py-3 border-2 border-black hover:bg-yellow-300"
                  >
                    Buy +0.5x Multiplier (500C)
                  </button>
                </div>
              </div>
            )}

            {currentScreen === "wc_select" && (
              <div className="max-w-3xl mx-auto">
                <h2 className="text-xl mb-8 text-center uppercase text-[#D69E2E]">
                  Select World Cup Squad
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-64 overflow-y-auto p-2">
                  {TEAMS_1970.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => startWorldCup(team.id)}
                      className="p-4 border-4 border-[#2D3748] hover:scale-105 transition-transform flex flex-col items-center gap-2 bg-[#F3F4F6]"
                    >
                      <img 
                        src={`https://flagcdn.com/w80/${team.iso2}.png`}
                        alt={`${team.name} flag`}
                        className="w-16 h-11 object-cover border-2 border-black/20"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <span className="text-xs font-bold text-[#2D3748]">
                        {team.id}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setCurrentScreen("menu")}
                    className="text-xs text-gray-500 hover:text-[#2D3748] transition-colors"
                  >
                    &lt; Cancel
                  </button>
                </div>
              </div>
            )}

            {currentScreen === "wc_hub" && (
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl mb-2 text-[#D69E2E] uppercase drop-shadow">
                  World Cup 1970
                </h2>
                
                {wcStage === 'eliminated' && (
                  <div className="my-8 py-8 border-4 border-red-600 bg-red-100">
                    <h3 className="text-xl text-red-600 mb-4">Eliminated!</h3>
                    <p className="text-xs text-gray-600">Your journey ends here. Try again in 4 years!</p>
                  </div>
                )}
                
                {wcStage === 'champion' && (
                  <div className="my-8 py-8 border-4 border-yellow-500 bg-yellow-100">
                    <h3 className="text-xl text-yellow-600 mb-4 animate-bounce">WORLD CHAMPIONS!</h3>
                    <p className="text-xs text-gray-600">+5000 Coins Added</p>
                  </div>
                )}
                
                {(wcStage === 'groups' || wcStage === 'playoffs') && (
                  <div className="my-8 flex flex-col items-center gap-4">
                    <div className="text-sm bg-[#2D3748] text-white px-4 py-2 rounded">
                      {wcStage === 'groups' ? `Group Stage - Match ${wcGroupMatches + 1} of 3` : `Playoffs - ${wcPlayoffRound}`}
                    </div>
                    {wcStage === 'groups' && (
                      <div className="text-xs text-gray-500">
                        Record: {wcGroupWins}W - {wcGroupMatches - wcGroupWins}L (Need 2 Wins)
                      </div>
                    )}
                    
                    <div className="flex items-center gap-8 mt-6">
                      <div className="flex flex-col items-center gap-2">
                        <img src={`https://flagcdn.com/w80/${TEAMS_1970.find(t=>t.id===selectedTeam)?.iso2}.png`} className="w-20 h-14 object-cover border-2 border-black" />
                        <span className="text-sm">{selectedTeam}</span>
                      </div>
                      <span className="text-2xl text-red-600">VS</span>
                      <div className="flex flex-col items-center gap-2">
                        <img src={`https://flagcdn.com/w80/${TEAMS_1970.find(t=>t.id===wcOpponent)?.iso2}.png`} className="w-20 h-14 object-cover border-2 border-black" />
                        <span className="text-sm">{wcOpponent}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setCurrentScreen("match")}
                      className="mt-8 bg-[#48BB78] text-white py-4 px-8 border-4 border-[#2D3748] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(45,55,72,1)] transition-all uppercase text-sm"
                    >
                      Play Match
                    </button>
                  </div>
                )}

                <div className="mt-8 text-center">
                  <button
                    onClick={() => { setIsWcMode(false); setCurrentScreen("menu"); }}
                    className="text-xs text-gray-500 hover:text-[#2D3748] transition-colors"
                  >
                    {wcStage === 'eliminated' || wcStage === 'champion' ? 'Return to Main Menu' : 'Abandon Tournament'}
                  </button>
                </div>
              </div>
            )}

            {currentScreen === "country_select" && (
              <div className="max-w-3xl mx-auto">
                <h2 className="text-xl mb-8 text-center uppercase">
                  Choose A Country
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-64 overflow-y-auto p-2">
                  {TEAMS_1970.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeam(team.id);
                        setCurrentScreen("match");
                      }}
                      className="p-4 border-4 border-[#2D3748] hover:scale-105 transition-transform flex flex-col items-center gap-2 bg-[#F3F4F6]"
                    >
                      <img 
                        src={`https://flagcdn.com/w80/${team.iso2}.png`}
                        alt={`${team.name} flag`}
                        className="w-16 h-11 object-cover border-2 border-black/20"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <span className="text-xs font-bold text-[#2D3748]">
                        {team.id}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setCurrentScreen("menu")}
                    className="text-xs text-gray-500 hover:text-[#2D3748] transition-colors"
                  >
                    &lt; Back to Menu
                  </button>
                </div>
              </div>
            )}

            {currentScreen === "roster" && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xl mb-6 text-center uppercase">
                  Transfer Market
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-96 overflow-y-auto pr-4">
                  <div>
                    <h3 className="text-sm mb-4 border-b-2 pb-2">
                      Available Players
                    </h3>
                    <div className="flex flex-col gap-2">
                      {PLAYERS_1970.filter(
                        (p) => !profile.roster.includes(p.id),
                      )
                        .slice(0, 15)
                        .map((player) => (
                          <div
                            key={player.id}
                            className="flex justify-between items-center bg-gray-100 p-2 border-2 border-gray-300 text-xs"
                          >
                            <div>
                              <span className="text-blue-600">
                                [{player.country}]
                              </span>{" "}
                              {player.name} ({player.position})
                              <div className="text-[10px] text-gray-500 mt-1">
                                SPD:{player.stats.speed} SHT:
                                {player.stats.shooting} TCK:
                                {player.stats.tackling}
                              </div>
                            </div>
                            <button
                              onClick={() => buyPlayer(player.id, player.price)}
                              disabled={profile.coins < player.price}
                              className={`px-3 py-2 border-2 ${profile.coins >= player.price ? "bg-green-500 hover:bg-green-400 text-white border-black" : "bg-gray-300 text-gray-500 border-gray-400"}`}
                            >
                              {player.price}C
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm mb-4 border-b-2 pb-2">My Roster</h3>
                    <div className="flex flex-col gap-2">
                      {profile.roster.length === 0 ? (
                        <div className="text-xs text-gray-400 italic">
                          No custom players bought yet.
                        </div>
                      ) : (
                        profile.roster.map((id) => {
                          const p = PLAYERS_1970.find((pl) => pl.id === id);
                          if (!p) return null;
                          return (
                            <div
                              key={id}
                              className="flex justify-between items-center bg-[#EBF8FF] p-2 border-2 border-[#3182CE] text-xs"
                            >
                              <div>
                                <span className="text-blue-600">
                                  [{p.country}]
                                </span>{" "}
                                {p.name}
                              </div>
                              <span className="text-[10px] bg-blue-600 text-white px-2 py-1">
                                {p.position}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setCurrentScreen("menu")}
                    className="text-xs text-gray-500 hover:text-[#2D3748] transition-colors"
                  >
                    &lt; Back
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Developer / Cheat Tools */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => addRawCoins(1000)}
          className="bg-yellow-500 text-black px-3 py-2 text-[10px] font-bold uppercase border-2 border-black hover:bg-yellow-400"
        >
          +1000 Coins
        </button>
        <button
          onClick={() => {
             if (window.confirm("Are you sure you want to reset your account? This will erase all your bought players and multipliers.")) {
                 resetProfile();
             }
          }}
          className="bg-red-600 text-white px-3 py-2 text-[10px] font-bold uppercase border-2 border-black hover:bg-red-500"
        >
          Reset Account
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}
