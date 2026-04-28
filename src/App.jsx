import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw, User, Cpu, Info, Sparkles, BrainCircuit, MessageSquareQuote } from 'lucide-react';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; // Environment provided key

// Game Constants
const CHOICES = [
  { name: 'rock', emoji: '🪨', beats: 'scissors', color: 'bg-rose-500' },
  { name: 'paper', emoji: '📄', beats: 'rock', color: 'bg-blue-500' },
  { name: 'scissors', emoji: '✂️', beats: 'paper', color: 'bg-amber-500' },
];

const App = () => {
  useEffect(() => {
    if (apiKey) {
      console.log("✅ AI Configuration Loaded: System Ready");
    } else {
      console.error("❌ AI Configuration Missing: Please check your .env file");
    }
  }, []);

  const [userChoice, setUserChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState(''); // 'win', 'lose', 'tie'
  const [score, setScore] = useState({ user: 0, computer: 0 });
  const [isShaking, setIsShaking] = useState(false);
  const [history, setHistory] = useState([]);
  
  // Gemini Features State
  const [aiPrediction, setAiPrediction] = useState(null);
  const [trashTalk, setTrashTalk] = useState("Ready to lose?");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // API Call helper with exponential backoff
  const callGemini = async (prompt, systemInstruction = "") => {
    if (!apiKey) {
      console.warn("No API key found. Please set VITE_GEMINI_API_KEY in .env");
      return "API Key Missing";
    }
    
    // Combining system prompt into main prompt for maximum compatibility
    const fullPrompt = systemInstruction ? `${systemInstruction}\n\nUser Input: ${prompt}` : prompt;
    const model = "gemini-2.5-flash"; 
    
    for (let i = 0; i < 3; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ text: fullPrompt }] 
            }]
          })
        });

        const data = await response.json();
        
        if (data.error) {
          console.error("Gemini API Error Detail:", data.error);
          const msg = data.error.message?.toLowerCase() || "";
          if (msg.includes("quota") || msg.includes("limit") || msg.includes("rate")) {
            return "Classic Mode Active (API Limit Reached)";
          }
          return `Error: ${data.error.message}`;
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          console.warn("Empty response from Gemini:", data);
          return "AI is thinking...";
        }

        return text;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i === 2) return "AI Strategist is having trouble connecting. Please check your internet or API key.";
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  // Feature: ✨ Get AI Prediction
  const getAiPrediction = async () => {
    if (history.length < 1) return;
    setIsAiLoading(true);
    try {
      const historyText = history.map(h => `Player: ${h.user}, CPU: ${h.computer}, Result: ${h.result}`).join(' | ');
      const systemPrompt = "You are a strategic Rock Paper Scissors master. Analyze the player's history and predict their next move. Be concise.";
      const userPrompt = `History: ${historyText}. Based on psychological patterns, what move is the player likely to play next? Provide a move and a one-sentence reason.`;
      
      const prediction = await callGemini(userPrompt, systemPrompt);
      setAiPrediction(prediction);
    } catch (err) {
      console.error("AI Prediction failed", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Feature: ✨ Get Trash Talk
  const generateTrashTalk = async (lastResult) => {
    try {
      const systemPrompt = "You are a sassy, competitive AI game opponent. Keep it to one short sentence.";
      const userPrompt = `The player just ${lastResult} against me. Current Score is Player: ${score.user}, CPU: ${score.computer}. Give me a quick sassy remark.`;
      const remark = await callGemini(userPrompt, systemPrompt);
      if (remark) setTrashTalk(remark);
    } catch (err) {
      console.error("Trash talk failed", err);
    }
  };

  const getResult = (user, computer) => {
    if (user.name === computer.name) return 'tie';
    if (user.beats === computer.name) return 'win';
    return 'lose';
  };

  const playRound = (choice) => {
    if (isShaking) return;
    setIsShaking(true);
    setUserChoice(null);
    setComputerChoice(null);
    setResult('');
    setAiPrediction(null); // Reset prediction for next round

    setTimeout(() => {
      const computer = CHOICES[Math.floor(Math.random() * CHOICES.length)];
      const roundResult = getResult(choice, computer);

      setUserChoice(choice);
      setComputerChoice(computer);
      setResult(roundResult);
      setIsShaking(false);

      if (roundResult === 'win') setScore(s => ({ ...s, user: s.user + 1 }));
      else if (roundResult === 'lose') setScore(s => ({ ...s, computer: s.computer + 1 }));

      setHistory(prev => [{ 
        user: choice.emoji, 
        computer: computer.emoji, 
        result: roundResult,
        id: Date.now() 
      }, ...prev].slice(0, 10));
      
      generateTrashTalk(roundResult);
    }, 600);
  };

  const resetGame = () => {
    setScore({ user: 0, computer: 0 });
    setUserChoice(null);
    setComputerChoice(null);
    setResult('');
    setHistory([]);
    setAiPrediction(null);
    setTrashTalk("Reset? Scared already?");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 font-sans selection:bg-purple-500/30">
      {/* Header & Scoreboard */}
      {/* Header & Scoreboard Section */}
      <header className="w-full max-w-4xl flex flex-col items-center mb-12 mt-8 gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-purple-500 to-rose-400 bg-clip-text text-transparent">
            RPS.ULTIMATE
          </h1>
          <div className="text-[10px] font-black tracking-[0.3em] text-slate-600 uppercase">AI Enhanced Tournament</div>
        </div>
        
        <div className="flex flex-col gap-4 items-center">
          {/* Trash Talk Bubble - Image Style */}
          <div className="bg-[#111827]/80 px-6 py-3 rounded-2xl border border-slate-800 shadow-[0_0_20px_rgba(168,85,247,0.1)] flex items-center gap-4 transition-all hover:scale-105">
            <MessageSquareQuote className="w-6 h-6 text-purple-500" />
            <p className="text-lg italic font-medium text-slate-200 tracking-wide">"{trashTalk}"</p>
          </div>

          {/* Scoreboard - Image Style */}
          <div className="bg-[#111827]/90 px-10 py-6 rounded-[2.5rem] border border-slate-800 flex items-center gap-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
            
            <div className="flex flex-col items-center min-w-[80px]">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Player</span>
              <span className="text-5xl font-black text-blue-500 tabular-nums drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                {score.user}
              </span>
            </div>

            <div className="w-[1px] h-16 bg-slate-800/80"></div>

            <div className="flex flex-col items-center min-w-[80px]">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">CPU</span>
              <span className="text-5xl font-black text-rose-500 tabular-nums drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                {score.computer}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl flex flex-col gap-12">
        {/* Top: Game Arena */}
        <div className="flex flex-col items-center gap-10">
          <div className="flex justify-around w-full items-center min-h-[220px] bg-slate-900/20 rounded-3xl p-8 border border-slate-800/30">
            <div className="flex flex-col items-center gap-4">
              <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-6xl sm:text-7xl shadow-2xl transition-all duration-300 ${
                isShaking ? 'animate-bounce' : ''
              } ${userChoice ? userChoice.color : 'bg-slate-900 border-2 border-dashed border-slate-700'}`}>
                {userChoice ? userChoice.emoji : (isShaking ? '✊' : <User className="w-10 h-10 text-slate-700" />)}
              </div>
              <span className="text-xs font-bold text-slate-500 tracking-tighter uppercase">Player</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              {!result && !isShaking && <span className="text-2xl font-black text-slate-800 italic">VS</span>}
              {isShaking && <span className="text-xs font-bold animate-pulse text-slate-500 uppercase tracking-widest">Battling...</span>}
              {result && (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                  <span className={`text-5xl font-black uppercase tracking-tighter ${
                    result === 'win' ? 'text-green-400' : result === 'lose' ? 'text-rose-500' : 'text-slate-400'
                  }`}>
                    {result === 'win' ? 'Win' : result === 'lose' ? 'Loss' : 'Draw'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-6xl sm:text-7xl shadow-2xl transition-all duration-300 ${
                isShaking ? 'animate-bounce' : ''
              } ${computerChoice ? computerChoice.color : 'bg-slate-900 border-2 border-dashed border-slate-700'}`}>
                {computerChoice ? computerChoice.emoji : (isShaking ? '✊' : <Cpu className="w-10 h-10 text-slate-700" />)}
              </div>
              <span className="text-xs font-bold text-slate-500 tracking-tighter uppercase">System</span>
            </div>
          </div>

          <div className="flex gap-4">
            {CHOICES.map((choice) => (
              <button
                key={choice.name}
                disabled={isShaking}
                onClick={() => playRound(choice)}
                className={`group relative flex flex-col items-center gap-2 p-6 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${choice.color} shadow-lg shadow-black/40`}
              >
                <span className="text-4xl">{choice.emoji}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{choice.name}</span>
              </button>
            ))}
          </div>

          <button onClick={resetGame} className="text-xs font-bold text-slate-600 hover:text-slate-400 uppercase tracking-[0.2em] transition-colors">
            Reset Tournament
          </button>
        </div>

        {/* Middle: AI Insights */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl bg-slate-900 p-8 rounded-2xl border-2 border-purple-500/30 shadow-lg shadow-purple-500/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit className="w-5 h-5" /> AI Strategist Move Prediction
              </h3>
              <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
            </div>

            <div className="min-h-[120px] flex flex-col justify-center">
              {aiPrediction ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 text-center">
                  <p className="text-lg text-slate-200 leading-relaxed italic">
                    "{aiPrediction}"
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                   <p className="text-sm text-slate-500 leading-relaxed">
                     {history.length < 1 
                        ? "Play at least one round to enable AI move prediction." 
                        : "Ready to predict your next move based on your playstyle."}
                   </p>
                   {history.length >= 1 && (
                     <button 
                       onClick={getAiPrediction}
                       disabled={isAiLoading}
                       className="mx-auto px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
                     >
                       {isAiLoading ? "✨ Analyzing Patterns..." : "✨ Get AI Prediction"}
                     </button>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: History Section */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
             <RotateCcw className="w-4 h-4" /> Match History
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {history.length === 0 && (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-800 rounded-xl">
                  <p className="text-sm text-slate-600 italic">No games played in this tournament yet...</p>
                </div>
              )}
              {history.map((round) => (
                <div key={round.id} className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4 text-base">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">{round.user}</span>
                      <span className="text-[8px] text-slate-600 uppercase font-bold">You</span>
                    </div>
                    <span className="text-[10px] text-slate-700 font-black">VS</span>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">{round.computer}</span>
                      <span className="text-[8px] text-slate-600 uppercase font-bold">CPU</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                      round.result === 'win' ? 'bg-green-500/10 text-green-500' : 
                      round.result === 'lose' ? 'bg-rose-500/10 text-rose-500' : 
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {round.result}
                    </span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </main>

    </div>
  );
};

export default App;
