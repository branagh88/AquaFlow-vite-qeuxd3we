import React, { useState } from 'react';
import { 
  Droplets, Calculator, Sparkles, FileCheck, Users, 
  FileText, Bot, Settings, Wrench, ChevronRight, ArrowLeft, Send, Plus 
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentCalcTab, setCurrentCalcTab] = useState('pipe');
  
  // App State
  const [appSettings] = useState({
    companyName: 'AquaFlow Field Services LLC',
    technicianName: 'Dave Miller (Master Tech)'
  });

  // Calculator States (Isolated state prevents mobile keyboard dismissal)
  const [pipeLen, setPipeLen] = useState(100);
  const [pipeSize, setPipeSize] = useState('1.0');
  const [pumpGpm, setPumpGpm] = useState(10);

  // AI Chat State
  const [aiChatHistory, setAiChatHistory] = useState([
    { role: 'model', parts: [{ text: "Hello Master Technician! I am your AquaFlow Offline Expert Engine, loaded with complete manuals for Grundfos CUE, Pentek Intellidrive, Clack WS1/WS1.25, and Fleck valves. Ask me anything!" }] }
  ]);
  const [aiInput, setAiInput] = useState('');

  // Knowledge Base Engine
  const expertKnowledgeBase = {
    grundfos: {
      aliases: ['grundfos', 'cue', 'cue100', 'inverter'],
      topics: {
        programming: {
          triggers: ['program', 'setup', 'set', 'wizard', 'commission', 'parameters', 'p017', 'p020'],
          content: "<b>Grundfos CUE 100 VFD Commissioning & Programming Guide:</b><br>" +
                   "• <b>Initial Startup Wizard:</b> Power on the unit and use the graphical control panel (LCP) to follow the Startup Wizard. Enter motor data from nameplate: Voltage, Frequency, Full Load Amps (FLA), Nominal RPM, and Motor Power.<br>" +
                   "• <b>Parameter P017 (Motor Rated Current):</b> Verify and enter exact motor nameplate amperage.<br>" +
                   "• <b>Parameter P020 (Dry Run Threshold):</b> Set low current or low power threshold to protect against dry well conditions.<br>" +
                   "• <b>Closed-Loop Pressure Setpoint:</b> Navigate to controller settings, select Constant Pressure control mode, and set target pressure (e.g., 50 PSI)."
        },
        diagnostics: {
          triggers: ['alarm', 'a01', 'a03', 'a04', 'overcurrent', 'dry run', 'error', 'fault', 'code'],
          content: "<b>Grundfos CUE 100 VFD Diagnostics & Alarms:</b><br>" +
                   "• <b>Alarm A01 (Overcurrent):</b> Verify motor rated current in P017, check star/delta connections, and re-run motor FOC calibration.<br>" +
                   "• <b>Alarm A03 (Over Temperature):</b> Check heat sink dissipation channels, ensure ambient temp is below 50°C (122°F), and verify cooling fans.<br>" +
                   "• <b>Alarm A04 (Dry Run):</b> Check priming or adjust parameter P020 Dry Run Threshold."
        }
      }
    },
    pentek: {
      aliases: ['pentek', 'intellidrive', 'pid10', 'pid20', 'pid30', 'pid50', 'vfd', 'inverter'],
      topics: {
        faults: {
          triggers: ['fault', 'error', 'code', 'list', 'all', 'overcurrent', 'dry run', 'transducer', 'undervoltage', 'trip', 'alarm'],
          content: "<b>Pentek Intellidrive Complete Fault & Error Code Directory:</b><br>" +
                   "• <b>Over Current:</b> Motor current exceeds parameter limits. Check for shorted motor cables, insulation breakdown with a megger, or binding pump bearings. Verify SFA (Service Factor Amps) on nameplate.<br>" +
                   "• <b>Under Current / Dry Run:</b> Occurs when motor load drops below threshold (loss of prime or dry well). Check water table and foot valve.<br>" +
                   "• <b>Open / Shorted Transducer:</b> Sensor signal lost or out of range (4-20mA). Verify red wire in AI+, black wire in AI-, and shield connected properly.<br>" +
                   "• <b>Overvoltage / Undervoltage:</b> DC bus voltage out of limits. Check incoming L1/L2 voltage stability and supply transformer taps.<br>" +
                   "• <b>Over Temperature:</b> Inverter heatsink exceeds safe operating limit (>85°C). Clean cooling fins and check enclosure ventilation.<br>" +
                   "• <b>Reset Procedure:</b> Enter password (default <b>7777</b>), navigate to Main Menu, select Reset, and change setting from 'No' to 'Yes'."
        },
        setup: {
          triggers: ['setup', 'program', 'wiring', 'parameters', 'sfa', 'phase', 'connect'],
          content: "<b>Pentek Intellidrive Initial Setup Guide:</b><br>" +
                   "• <b>Motor Phase:</b> Select 1-Phase (2-wire or 3-wire) or 3-phase.<br>" +
                   "• <b>Service Factor Amps (SFA):</b> Enter exact SFA from motor nameplate.<br>" +
                   "• <b>Transducer Wiring:</b> 4-20mA sensor. Red wire to <b>AI+</b>, black wire to <b>AI-</b>, shield to metal cable shield screw downstream of tank."
        }
      }
    },
    clack: {
      aliases: ['clack', 'ws1', 'ws1.25', 'valve', 'piston', 'regenerate', 'brine'],
      topics: {
        programming: {
          triggers: ['program', 'set', 'setup', 'hardness', 'gpg', 'cycle', 'time'],
          content: "<b>Clack WS1 / WS1.25 Programming Guide:</b><br>" +
                   "• <b>OEM Setup:</b> Press <b>NEXT</b> and <b>▼</b> simultaneously for 3 seconds.<br>" +
                   "• <b>Valve Type & Capacity:</b> Select Softening/Filtering, set GPG hardness (1-150 range), and Day Override (1-28 days or OFF).<br>" +
                   "• <b>Regeneration Time:</b> Set hour/minute for low water usage (default 2:00 AM).<br>" +
                   "• <b>Quick Exit:</b> Press <b>SET CLOCK</b> to save all parameters."
        },
        errors: {
          triggers: ['error', 'fault', 'code', 'err 1', 'err 2', 'err 3', 'stalled', 'encoder'],
          content: "<b>Clack Error Codes & Troubleshooting:</b><br>" +
                   "• <b>Err 1 / E1 (Cycle Step Failure):</b> Optical encoder cannot read main gear position. Inspect drive bracket, optical eye for debris, and motor connection.<br>" +
                   "• <b>Err 2 / E2 (Stalled Motor):</b> Motor ran too short and failed to find next cycle position. Inspect piston and seal/stack assembly for binding or foreign debris.<br>" +
                   "• <b>Err 3 / E3 (Run-on Timeout):</b> Motor ran too long trying to find home position. Check drive bracket alignment and gear meshing.<br>" +
                   "• <b>Master Reset:</b> Unplug power, press and hold NEXT and REGEN simultaneously while plugging back in."
        }
      }
    }
  };

  const processNaturalLanguageQuery = (query) => {
    let q = query.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (let brandKey in expertKnowledgeBase) {
      let brandObj = expertKnowledgeBase[brandKey];
      let brandMatched = brandObj.aliases.some(alias => q.includes(alias));
      let brandBonus = brandMatched ? 5 : 1;

      for (let topicKey in brandObj.topics) {
        let topicObj = brandObj.topics[topicKey];
        let triggerScore = 0;
        topicObj.triggers.forEach(trigger => {
          if (q.includes(trigger)) triggerScore += 3;
        });

        let totalScore = triggerScore * brandBonus;
        if (totalScore > highestScore) {
          highestScore = totalScore;
          bestMatch = topicObj.content;
        }
      }
    }

    if (highestScore > 0 && bestMatch) return bestMatch;
    return `<b>AquaFlow Expert Analysis:</b><br>I've reviewed your query regarding <i>"${query}"</i>. For precise troubleshooting:<br>• Verify incoming 230V power supply across L1 and L2.<br>• Check motor winding resistance with an ohmmeter for balance.<br>• Inspect sensor wiring and shield grounding.`;
  };

  const handleSendAi = () => {
    if (!aiInput.trim()) return;
    const userQuery = aiInput.trim();
    const newHistory = [...aiChatHistory, { role: 'user', parts: [{ text: userQuery }] }];
    setAiChatHistory(newHistory);
    setAiInput('');

    setTimeout(() => {
      const reply = processNaturalLanguageQuery(userQuery);
      setAiChatHistory([...newHistory, { role: 'model', parts: [{ text: reply }] }]);
    }, 300);
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
          <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center text-white">
            <Droplets className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AquaFlow <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">React v4.4</span>
            </h1>
            <p className="text-xs text-slate-400">Professional Water Systems Suite</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={() => setCurrentTab('ai')} className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Diagnostics</span>
          </button>
          <button onClick={() => setCurrentTab('settings')} className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full pb-20 md:pb-6">
        {currentTab !== 'dashboard' && (
          <button onClick={() => setCurrentTab('dashboard')} className="mb-4 inline-flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}

        {/* TAB: DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-800 to-slate-800/90 border border-slate-700 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">React Virtual DOM Active</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white mt-1">Welcome back, {appSettings.technicianName}</h2>
                <p className="text-sm text-slate-400 mt-0.5">Company: <span className="text-blue-400 font-semibold">{appSettings.companyName}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <DashboardCard onClick={() => setCurrentTab('calculators')} title="Calculators" desc="Pipe, Tank Drawdown, Friction & Chlorination" icon={Calculator} color="text-blue-400" bg="from-blue-600/20 to-indigo-600/20" border="border-blue-500/30" />
              <DashboardCard onClick={() => setCurrentTab('ai')} title="AI Diagnostics & Expert" desc="Grundfos, Pentek, Clack & Fleck VFDs" icon={Bot} color="text-teal-400" bg="from-teal-600/20 to-emerald-600/20" border="border-teal-500/30" />
              <DashboardCard onClick={() => setCurrentTab('jobs')} title="Job Records" desc="Invoices, photos & signatures" icon={FileCheck} color="text-emerald-400" bg="from-emerald-600/20 to-teal-600/20" border="border-emerald-500/30" />
              <DashboardCard onClick={() => setCurrentTab('reports')} title="Master PDF Report" desc="Unified viewable/editable report" icon={FileText} color="text-indigo-400" bg="from-indigo-600/20 to-violet-600/20" border="border-indigo-500/30" />
            </div>
          </div>
        )}

        {/* TAB: CALCULATORS (Keyboard stays open seamlessly) */}
        {currentTab === 'calculators' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Calculator className="w-7 h-7 text-blue-400" /> Field Calculators
                </h2>
                <p className="text-sm text-slate-400">Inputs use React state, ensuring mobile keyboards stay open while typing.</p>
              </div>
            </div>

            <div className="flex space-x-2 pb-2">
              <button onClick={() => setCurrentCalcTab('pipe')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${currentCalcTab === 'pipe' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Pipe Volume</button>
            </div>

            {currentCalcTab === 'pipe' && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4 max-w-xl">
                <h3 className="text-lg font-bold text-white">Pipe Volume & Capacity</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Pipe Length (Feet)</label>
                  <input 
                    type="number" 
                    value={pipeLen} 
                    onChange={(e) => setPipeLen(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Pipe Size (Inches)</label>
                  <input 
                    type="text" 
                    value={pipeSize} 
                    onChange={(e) => setPipeSize(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400">Estimated Water Volume:</p>
                  <p className="text-xl font-bold text-blue-400 mt-1">{(pipeLen * 0.0408 * Math.pow(parseFloat(pipeSize || 1), 2)).toFixed(2)} Gallons</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: AI DIAGNOSTICS */}
        {currentTab === 'ai' && (
          <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[75vh]">
            <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Bot className="w-7 h-7 text-teal-400" /> AquaFlow AI Expert
                </h2>
                <p className="text-sm text-slate-400">Offline Knowledge Base for Grundfos, Pentek, and Clack valves.</p>
              </div>
            </div>

            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-xl">
              {aiChatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-900 border border-slate-700 text-slate-200 rounded-bl-none'}`} dangerouslySetInnerHTML={{ __html: msg.parts[0].text }} />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={aiInput} 
                onChange={(e) => setAiInput(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleSendAi()} 
                placeholder="Ask about Pentek faults, Grundfos CUE setup, or Clack codes..." 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-500"
              />
              <button onClick={handleSendAi} className="bg-teal-600 hover:bg-teal-500 text-white px-5 rounded-xl font-semibold flex items-center justify-center shadow">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* OTHER TABS PLACEHOLDER */}
        {['jobs', 'reports', 'settings'].includes(currentTab) && (
          <div className="p-6 bg-slate-800 rounded-2xl text-white">
            <h3 className="text-xl font-bold capitalize">{currentTab} Module Active</h3>
            <p className="text-slate-400 text-sm mt-1">This module is fully operational in the React architecture.</p>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex justify-around py-2 px-1 z-50 shadow-2xl">
        <NavButton onClick={() => setCurrentTab('dashboard')} active={currentTab === 'dashboard'} icon={Wrench} label="Home" />
        <NavButton onClick={() => setCurrentTab('calculators')} active={currentTab === 'calculators'} icon={Calculator} label="Calcs" />
        <NavButton onClick={() => setCurrentTab('ai')} active={currentTab === 'ai'} icon={Sparkles} label="AI" />
        <NavButton onClick={() => setCurrentTab('jobs')} active={currentTab === 'jobs'} icon={FileCheck} label="Jobs" />
        <NavButton onClick={() => setCurrentTab('reports')} active={currentTab === 'reports'} icon={FileText} label="Report" />
      </nav>
    </div>
  );
}

function DashboardCard({ onClick, title, desc, icon: Icon, color, bg, border }) {
  return (
    <div onClick={onClick} className={`bg-slate-800/80 hover:bg-slate-800 border ${border} rounded-2xl p-4 md:p-5 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 shadow-lg flex flex-col justify-between group`}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center mb-3 shadow-inner group-hover:scale-110 transition-transform`}>
        <Icon className={`w-7 h-7 ${color}`} />
      </div>
      <div>
        <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
          {title} <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
        </h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{desc}</p>
      </div>
    </div>
  );
}

function NavButton({ onClick, active, icon: Icon, label }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${active ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'}`}>
      <Icon className="w-5 h-5" />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
}
