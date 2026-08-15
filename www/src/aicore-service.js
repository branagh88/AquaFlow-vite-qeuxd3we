// ============================================================
// AQUAFLOW AICORE SERVICE  (classic script, no modules)
// Loaded from index.html BEFORE src/script.js. Exposes
// window.AquaFlowAICore for the AI Diagnostics Module in
// src/script.js (getAiReply) to append deep, structured
// technical diagnostics: symptom -> probable causes ->
// verification checks -> manufacturer-specific guidance.
//
// Fully offline-capable: it only reads live app state
// (current tab, tank calculator results, system settings,
// connectivity, local-AI model status) plus the app's own
// expertKnowledgeBase. It never makes a network request.
// Every global it reads is guarded with typeof so the app
// keeps working even if this file loads before script.js
// or a state variable is renamed.
// ============================================================
(function () {
  'use strict';

  var root = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

  var SERVICE_NAME = 'AquaFlowAICore';
  var SERVICE_VERSION = '1.0.0';
  var APP_VERSION = '4.4.0';

  // Browser-only connectivity flag; safe when navigator exists but
  // does not expose onLine (e.g. some webviews / test runners).
  function isOnline() {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine !== false;
  }

  // Local HTML escaper (self-contained; script.js also has one).
  function aicoreEscapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ------------------------------------------------------------
  // (2) Live diagnostics context snapshot from the running app.
  // Reads globals created later by src/script.js at call time.
  // ------------------------------------------------------------
  function getDiagnosticsContext() {
    var ctx = {
      service: { name: SERVICE_NAME, version: SERVICE_VERSION, available: true },
      capturedAt: new Date().toISOString(),
      app: {
        name: 'AquaFlow',
        version: APP_VERSION,
        currentTab: (typeof currentTab !== 'undefined') ? currentTab : null
      }
    };

    // --- Tank calculator state (cutIn / cutOut / precharge / drawdown) ---
    if (typeof calculateTankStateResults === 'function') {
      try {
        var tank = calculateTankStateResults();
        ctx.tankCalculator = {
          model: tank.model,
          totalVolume: tank.totalVolume,
          switchSetting: tank.switchSetting,
          cutIn: tank.cutIn,
          cutOut: tank.cutOut,
          precharge: tank.precharge,
          drawdown: tank.drawdown,
          percentage: tank.percentage,
          dataSource: tank.dataSource
        };
      } catch (e) {
        ctx.tankCalculator = { available: false };
      }
    }
    if (typeof tankState !== 'undefined') {
      ctx.tankCalculator = ctx.tankCalculator || {};
      ctx.tankCalculator.rawState = {
        tankMode: tankState.tankMode,
        selectedPreset: tankState.selectedPreset,
        manualVolume: tankState.manualVolume,
        switchSetting: tankState.switchSetting,
        customPrechargeEnabled: tankState.customPrechargeEnabled,
        customPrechargeValue: tankState.customPrechargeValue
      };
    }

    // --- Well pump / friction system state ---
    if (typeof wellSpec !== 'undefined') {
      ctx.wellSystem = {
        manufacturer: wellSpec.manufacturer,
        hp: wellSpec.hp,
        pumpFamily: wellSpec.pumpFamily,
        totalDepth: wellSpec.totalDepth,
        staticWaterLevel: wellSpec.staticWaterLevel,
        pumpSetting: wellSpec.pumpSetting,
        pumpingWaterLevel: wellSpec.pumpingWaterLevel,
        wellYield: wellSpec.wellYield,
        switchCutIn: wellSpec.switchCutIn,
        switchCutOut: wellSpec.switchCutOut,
        horizontalDist: wellSpec.horizontalDist
      };
      if (typeof getActivePumpObject === 'function') {
        try {
          var pump = getActivePumpObject();
          if (pump) {
            ctx.wellSystem.activePumpModel = pump.model;
            ctx.wellSystem.catalogNumber = pump.catalogNumber;
            ctx.wellSystem.shutoffHead = pump.shutoffHead;
            ctx.wellSystem.sourceDocument = pump.sourceDocument;
          }
        } catch (e) { /* optional pump detail */ }
      }
    }

    // --- Water test readings ---
    if (typeof testHardness !== 'undefined') {
      ctx.waterTest = {
        hardness: testHardness,
        ph: testPh,
        iron: testIron,
        tds: testTds,
        chlorine: testChlorine
      };
    }

    // --- System settings (company / technician + preferences) ---
    if (typeof appSettings !== 'undefined') {
      ctx.systemSettings = {
        companyName: appSettings.companyName,
        technicianName: appSettings.technicianName
      };
    }
    if (typeof settingsPrefs !== 'undefined') {
      ctx.systemSettings = ctx.systemSettings || {};
      ctx.systemSettings.preferences = {
        gpsEnabled: settingsPrefs.gpsEnabled,
        offlineStorage: settingsPrefs.offlineStorage,
        cameraPermission: settingsPrefs.cameraPermission,
        microphonePermission: settingsPrefs.microphonePermission,
        notifications: settingsPrefs.notifications,
        autoBackup: settingsPrefs.autoBackup
      };
    }

    // --- Connectivity and local-AI model status ---
    ctx.connectivity = {
      online: isOnline(),
      aiModelStatus: (typeof aiModelStatus !== 'undefined') ? aiModelStatus : 'unknown',
      aiSyncEndpointConfigured: (typeof aiSyncEndpoint !== 'undefined') ? !!aiSyncEndpoint : false,
      pendingSyncCount: (typeof aiPendingSync !== 'undefined') ? aiPendingSync.length : 0
    };

    // --- Knowledge base availability (brands/topics from script.js) ---
    var kbBrands = [];
    if (typeof expertKnowledgeBase !== 'undefined' && expertKnowledgeBase) {
      kbBrands = Object.keys(expertKnowledgeBase);
    }
    ctx.knowledgeBase = { brands: kbBrands, loaded: kbBrands.length > 0 };

    return ctx;
  }

  // ------------------------------------------------------------
  // (3) Structured diagnostic pipeline.
  // Symptom router: query -> symptom -> probable causes ->
  // verification checks -> manufacturer guidance. Guidance is
  // pulled from the app's own expertKnowledgeBase (Grundfos
  // CUE 100 / Pentek Intellidrive / Clack WS1) when a topic
  // matches, with built-in fallback text otherwise.
  // ------------------------------------------------------------

  var SYMPTOM_ROUTER = [
    {
      key: 'shortCycling',
      label: 'Pressure tank short cycling (pump turns on and off rapidly)',
      triggers: ['short cycle', 'short-cycl', 'rapid', 'cycle', 'cycling', 'on and off', 'on/off', 'turns on and off', 'waterlogged', 'water logged', 'water-logged', 'bladder', 'air bladder', 'air charge', 'tank pressure'],
      causes: [
        'Waterlogged pressure tank: the air charge is lost, so the tank stores little water and the pump restarts on every small draw.',
        'Precharge set wrong for the switch: rule of thumb is precharge = cut-in minus 2 PSI, checked with the tank empty and pump power off.',
        'Undersized tank for the pump: published drawdown is too small for the home demand.',
        'Faulty pressure switch contacts or a worn gauge causing early restart.',
        'Leaking check valve or foot valve lets pressure bleed back into the well between cycles.'
      ],
      checks: [
        'Open the Pressure Tank calculator and note switchSetting, cutIn, cutOut, precharge and drawdown (live in the AICore context).',
        'Turn pump power off, drain the tank, and measure air precharge at the schrader valve with a tire gauge; compare to cut-in minus 2 PSI.',
        'Restore power and watch the gauge: at normal demand the pump should run at least 60 seconds between starts.',
        'Check for water on the air side of the tank (waterlogged bladder) by pressing the schrader valve - water means the bladder is ruptured.',
        'Inspect the check valve and foot valve for leaks that let pressure bleed back down the drop pipe.'
      ],
      guidance: 'For constant-pressure drives, cycling complaints are often controller-side: on a Grundfos CUE 100 verify the pressure setpoint and P020 dry-run threshold; on a Pentek Intellidrive verify the 4-20 mA transducer wiring and SFA. For Amtrol Well-X-Trol tanks compare the installed tank against the published drawdown in the calculator. See the matched knowledge base topic below.'
    },
    {
      key: 'lowPressure',
      label: 'Low or weak water pressure at fixtures',
      triggers: ['low pressure', 'weak pressure', 'no pressure', 'pressure drop', 'low flow', 'weak flow', 'not building', 'loses pressure', 'pressure loss'],
      causes: [
        'Clogged sediment filter, softener, or aerator reducing fixture flow.',
        'Worn pump (impeller/stages) or pump operating off its curve due to drawdown.',
        'Restriction in the drop pipe, check valve, or service line.',
        'Pressure switch cut-out set too low for the home.',
        'Undersized or waterlogged pressure tank so the pump cannot hold pressure.',
        'Well yield exceeded: the pump outruns the well and pulls air.'
      ],
      checks: [
        'Read the tank gauge at rest and compare with the switch cut-in/cut-out in the calculator.',
        'Bypass the softener/filter and re-test: pressure recovery points to treatment gear.',
        'Run the Well & Friction Loss calculator and compare the computed operating GPM/TDH against the pump curve (shutoff head).',
        'Time the pressure recovery from cut-in to cut-out with a known faucet flow.',
        'Check the well yield against the pump operating flow to rule out drawdown/air pull.'
      ],
      guidance: 'On Grundfos CUE 100 systems low pressure is usually a setpoint/feedback issue: confirm the closed-loop pressure setpoint and the feedback sensor. On Pentek Intellidrive verify the transducer reads correctly (4-20 mA, AI+/AI- wiring) and that the drive is in the right control mode. See the matched knowledge base topic below.'
    },
    {
      key: 'noWater',
      label: 'No water / dry run / loss of prime',
      triggers: ['no water', 'dry well', 'dry run', 'dry-run', 'loss of prime', 'lost prime', 'air in line', 'air in the line', 'sputter', 'spitting', 'coughing', 'gurgling'],
      causes: [
        'Water level in the well dropped below the pump intake (dry run).',
        'Pump set too shallow or the well has gone dry during drought.',
        'Leaking foot valve / check valve causing loss of prime.',
        'Overload or thermal trip on the motor from a dry run.',
        'Collapsed or frozen drop pipe, or an air lock in the line.',
        'Failed pump (open winding, seized bearing) with the breaker still closed.'
      ],
      checks: [
        'Verify the pump is actually running: listen at the well seal and check amp draw versus nameplate.',
        'Compare static/pumping water level against pump setting in the Well & Friction calculator.',
        'Check the breaker and any overload relay: a tripped overload is a strong dry-run signal.',
        'Confirm dry-run protection is armed: Grundfos CUE 100 P020, Pentek undercurrent fault.',
        'Inspect the foot valve and check valve for debris holding them open.'
      ],
      guidance: 'Dry-run is the number one submersible killer. On Grundfos CUE 100 make sure P020 (dry run threshold) is set and Alarm A04 is treated seriously. On Pentek Intellidrive the Under Current / Dry Run fault fires when motor load drops - do not just reset it; find the cause. See the matched knowledge base topic below.'
    },
    {
      key: 'pumpRunsContinuous',
      label: 'Pump runs continuously / never shuts off',
      triggers: ['runs all the time', 'runs constantly', 'never shuts off', 'never turns off', 'keeps running', 'won\'t shut off', 'won\'t stop', 'run continuously', 'continuous run', 'short cycles'],
      causes: [
        'Leak in the service line or a running toilet/faucet that the pump cannot outpace.',
        'Failed pressure switch with welded contacts holding the pump on.',
        'Waterlogged tank: the tank cannot store enough water to reach cut-out.',
        'Constant-pressure drive setpoint not reached because of a bad transducer.',
        'Check valve stuck open so pressure bleeds back and the pump cycles or runs long.'
      ],
      checks: [
        'Close the ball valve downstream of the tank: if the pump still runs, the leak is on the tank/well side; if it shuts off, the leak is in the house.',
        'Watch the tank gauge for a slow pressure drop with all faucets closed (leak indicator).',
        'Inspect the pressure switch contacts and plunger for pitting or debris.',
        'Verify tank precharge and drawdown with the Pressure Tank calculator.',
        'On a VFD system, verify the feedback transducer reading matches the tank gauge.'
      ],
      guidance: 'A continuously running pump on a constant-pressure system usually means the drive cannot reach setpoint: check the transducer signal first on Pentek Intellidrive, then the pressure setpoint on Grundfos CUE 100. See the matched knowledge base topic below.'
    },
    {
      key: 'vfdGrundfos',
      label: 'Grundfos CUE 100 / VFD controller fault',
      triggers: ['grundfos', 'cue', 'cue100', 'cue 100', 'inverter', 'vfd', 'alarm', 'a01', 'a03', 'a04', 'overcurrent', 'dry run'],
      causes: [
        'Motor data mismatch: P017 (motor rated current) does not match the nameplate.',
        'Dry run protection not set: P020 threshold too low, so the pump ran dry undetected.',
        'Overcurrent (A01): shorted motor cable, failing insulation, or binding pump.',
        'Over temperature (A03): blocked heatsink or hot enclosure.',
        'Feedback sensor / pressure transmitter fault causing unstable control.'
      ],
      checks: [
        'Read the exact alarm code on the LCP display and match it to the alarm list.',
        'Verify P017 against the motor nameplate FLA and re-run motor FOC calibration.',
        'Check the heatsink for dust and confirm ambient temperature is below 50 C (122 F).',
        'Verify the pressure transducer wiring and signal (4-20 mA / 0-10 V).',
        'Confirm P020 dry run threshold is set for low current/power.'
      ],
      guidance: 'Use the Grundfos CUE 100 VFD Diagnostics & Alarms topic in the AquaFlow Expert Knowledge Base below: Alarm A01 overcurrent, A03 over temperature, A04 dry run, plus the P017/P020 programming notes.'
    },
    {
      key: 'pentek',
      label: 'Pentek Intellidrive fault code',
      triggers: ['pentek', 'intellidrive', 'pid10', 'pid20', 'pid30', 'pid50', 'fault', 'overcurrent', 'transducer', 'undervoltage', 'trip'],
      causes: [
        'Over Current: shorted motor cable, failing insulation, or binding pump bearings.',
        'Under Current / Dry Run: loss of prime or water table below the pump.',
        'Open / Shorted Transducer: 4-20 mA sensor signal missing or out of range.',
        'Overvoltage / Undervoltage: unstable incoming L1/L2 supply or wrong transformer tap.',
        'Over Temperature: heatsink above 85 C (185 F) from poor ventilation.'
      ],
      checks: [
        'Read the fault text on the display and confirm the motor SFA from the nameplate.',
        'Verify transducer wiring: red to AI+, black to AI-, shield grounded.',
        'Measure L1/L2 voltage under load and check supply stability.',
        'Clean the cooling fins and confirm enclosure airflow.',
        'Reset via password 7777 -> Main Menu -> Reset -> Yes only after the root cause is fixed.'
      ],
      guidance: 'Use the Pentek Intellidrive Complete Fault & Error Code Directory in the AquaFlow Expert Knowledge Base below for the exact fault-to-cause mapping and reset procedure.'
    },
    {
      key: 'clack',
      label: 'Clack WS1 / WS1.25 softener or valve error',
      triggers: ['clack', 'ws1', 'ws1.25', 'softener', 'brine', 'valve', 'piston', 'regenerate', 'regeneration', 'err 1', 'err 2', 'err 3', 'encoder', 'stall'],
      causes: [
        'Err 1 / E1: optical encoder cannot read the main gear position (dirty eye, loose drive bracket).',
        'Err 2 / E2: stalled motor - piston or seal stack binding from debris.',
        'Err 3 / E3: motor ran too long hunting for home (gear mesh / bracket alignment).',
        'Brine system problems: empty salt tank, clogged injector, or bad brine draw.',
        'Resin fouling from iron or chlorine reducing capacity.'
      ],
      checks: [
        'Read the error code and compare with the Clack error list in the knowledge base.',
        'Inspect the drive bracket, optical eye, and motor connection.',
        'Check the piston and seal/stack assembly for debris or wear.',
        'Confirm the salt level, brine tank water, and injector nozzle/venturi are clean.',
        'Use the master reset only after repairs: unplug, hold NEXT + REGEN, plug back in.'
      ],
      guidance: 'Use the Clack Error Codes & Troubleshooting topic in the AquaFlow Expert Knowledge Base below (Err 1/E1, Err 2/E2, Err 3/E3 and the master reset procedure).'
    },
    {
      key: 'waterQuality',
      label: 'Water quality complaint (iron, hardness, odor, sediment)',
      triggers: ['iron', 'hardness', 'gpg', 'odor', 'rotten egg', 'sulfur', 'sediment', 'cloudy', 'stain', 'staining', 'taste', 'smell', 'tannin'],
      causes: [
        'Iron above 0.3 PPM stains fixtures and fouls softener resin.',
        'Hard water scaling from elevated GPG hardness.',
        'Sulfur / rotten egg odor: bacterial activity in the well or a corroding anode rod.',
        'Sediment from a new well, failing screen, or iron bacteria slime.',
        'Low pH below 6.5 makes water corrosive and can leach metals.'
      ],
      checks: [
        'Run the Water Test module and compare hardness, pH, iron, TDS and chlorine to targets.',
        'Sample at the pressure tank (before treatment) and at the tap (after) to isolate the cause.',
        'Check for iron bacteria slime in the toilet tank or on the pressure tank.',
        'Test the water heater separately for sulfur odor (anode rod issue).',
        'Confirm the softener/iron filter sizing against the actual flow and regeneration schedule.'
      ],
      guidance: 'Water chemistry drives equipment choice: >0.3 PPM iron needs oxidation/filtration ahead of the softener, sulfur needs aeration or chlorination, low pH needs neutralization. Reference the Clack programming topic below when setting hardness and capacity on the WS1.'
    },
    {
      key: 'electrical',
      label: 'Electrical fault (breaker trips, no power, hum)',
      triggers: ['breaker', 'trip', 'tripping', 'electrical', 'shock', 'voltage', 'hum', 'buzz', 'no power', 'dead', 'winding', 'capacitor'],
      causes: [
        'Shorted motor windings or failing start capacitor in the control box.',
        'Water intrusion in a splice or the motor lead connection.',
        'Undersized wire for the run length causing voltage drop and overload.',
        'Bad breaker, loose connection, or ground fault in the circuit.',
        'Overheated motor from repeated dry runs or a locked rotor.'
      ],
      checks: [
        'Measure L1/L2 voltage at the control box under load; check for drop below 10% of nameplate.',
        'Megger the motor windings to confirm insulation integrity.',
        'Inspect all splices for water and use waterproof splice kits.',
        'Verify wire gauge against the total run length for the pump HP.',
        'Check amp draw at startup and running against the nameplate SFA/FLA.'
      ],
      guidance: 'Electrical faults are safety-critical: always disconnect power before testing. Reference the Grundfos CUE 100 and Pentek Intellidrive topics below when the fault is controller-side (A01 overcurrent on Grundfos, Over Current on Pentek).'
    }
  ];

  var FALLBACK_SYMPTOM = {
    key: 'general',
    label: 'General water system diagnostic review',
    causes: [
      'Root cause not matched to a specific symptom; several sub-systems can overlap.',
      'Start with the highest-risk checks: dry run protection, tank precharge, and electrical supply.',
      'Use the live AICore context (tank calculator, well spec, water test) to ground the diagnosis.'
    ],
    checks: [
      'Confirm pump operation: amp draw, voltage, and run/stop behavior.',
      'Verify tank precharge and drawdown against the Pressure Tank calculator.',
      'Run the Well & Friction Loss calculator and compare operating point to the pump curve.',
      'Review water test readings for chemistry-driven failures.'
    ],
    guidance: 'When the symptom is unclear, treat it as a system review: verify electrical, tank, well, and water chemistry in that order. The matched knowledge base topic below (Grundfos CUE 100 / Pentek / Clack) adds manufacturer-specific depth when the query names a brand.'
  };

  function matchSymptom(q) {
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < SYMPTOM_ROUTER.length; i++) {
      var sym = SYMPTOM_ROUTER[i];
      var score = 0;
      var triggers = sym.triggers;
      for (var t = 0; t < triggers.length; t++) {
        if (q.indexOf(triggers[t]) !== -1) score += 3;
      }
      if (score > bestScore) {
        bestScore = score;
        best = sym;
      }
    }
    return best || FALLBACK_SYMPTOM;
  }

  // Find the best matching expertKnowledgeBase topic (same scoring
  // approach as processNaturalLanguageQuery in script.js).
  function findKnowledgeBaseMatch(q) {
    if (typeof expertKnowledgeBase === 'undefined' || !expertKnowledgeBase) return null;
    var best = null;
    var bestScore = 0;
    var brandKeys = Object.keys(expertKnowledgeBase);
    for (var b = 0; b < brandKeys.length; b++) {
      var brandKey = brandKeys[b];
      var brandObj = expertKnowledgeBase[brandKey];
      var brandMatched = false;
      var aliases = brandObj.aliases || [];
      for (var a = 0; a < aliases.length; a++) {
        if (q.indexOf(aliases[a]) !== -1) { brandMatched = true; break; }
      }
      var brandBonus = brandMatched ? 5 : 1;
      var topics = brandObj.topics || {};
      var topicKeys = Object.keys(topics);
      for (var tk = 0; tk < topicKeys.length; tk++) {
        var topicKey = topicKeys[tk];
        var topicObj = topics[topicKey];
        var score = 0;
        var triggers = topicObj.triggers || [];
        for (var tr = 0; tr < triggers.length; tr++) {
          if (q.indexOf(triggers[tr]) !== -1) score += 3;
        }
        score = score * brandBonus;
        if (score > bestScore) {
          bestScore = score;
          best = {
            brand: brandKey,
            topic: topicKey,
            content: topicObj.content || ''
          };
        }
      }
    }
    return bestScore > 0 ? best : null;
  }

  // Compact live-context line appended to the enrichment footer.
  function buildContextLine() {
    var parts = [];
    if (typeof currentTab !== 'undefined') parts.push('tab: ' + currentTab);
    if (typeof tankState !== 'undefined' && typeof calculateTankStateResults === 'function') {
      try {
        var t = calculateTankStateResults();
        parts.push('tank ' + t.switchSetting + ' (' + t.cutIn + '/' + t.cutOut + ' psi, precharge ' + t.precharge + ' psi, drawdown ' + t.drawdown + ' gal)');
      } catch (e) { /* tank context optional */ }
    }
    if (typeof wellSpec !== 'undefined') {
      parts.push('well: ' + wellSpec.manufacturer + ' ' + wellSpec.pumpFamily + ' ' + wellSpec.hp);
    }
    parts.push(isOnline() ? 'online' : 'offline');
    if (typeof aiModelStatus !== 'undefined') parts.push('local AI: ' + aiModelStatus);
    return parts.join(' | ');
  }

  function buildListHtml(items, ordered) {
    var tag = ordered ? 'ol' : 'ul';
    var cls = ordered
      ? 'list-decimal list-inside space-y-1 text-slate-400'
      : 'list-disc list-inside space-y-1 text-slate-400';
    var html = '<' + tag + ' class="' + cls + '">';
    for (var i = 0; i < items.length; i++) {
      html += '<li>' + aicoreEscapeHtml(items[i]) + '</li>';
    }
    html += '</' + tag + '>';
    return html;
  }

  function buildEnrichmentHtml(symptom, kbMatch, query) {
    var header =
      '<div class="mt-3 bg-slate-950 border border-cyan-500/30 rounded-xl overflow-hidden">' +
        '<div class="px-4 py-2 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-b border-cyan-500/20">' +
          '<b class="text-[10px] font-black uppercase tracking-wider text-cyan-300">AICore Deep Diagnostics</b>' +
          '<span class="ml-2 text-[9px] font-bold text-cyan-400/80 border border-cyan-500/30 rounded-full px-2 py-0.5">v' + SERVICE_VERSION + '</span>' +
        '</div>' +
        '<div class="px-4 py-3 space-y-3 text-xs">';

    var symptomBlock =
      '<div>' +
        '<p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Symptom</p>' +
        '<p class="text-cyan-200 font-semibold">' + aicoreEscapeHtml(symptom.label) + '</p>' +
      '</div>';

    var causesBlock =
      '<div>' +
        '<p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Probable Causes</p>' +
        buildListHtml(symptom.causes, false) +
      '</div>';

    var checksBlock =
      '<div>' +
        '<p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Verification Checks</p>' +
        buildListHtml(symptom.checks, true) +
      '</div>';

    var kbHtml = '';
    if (kbMatch && kbMatch.content) {
      kbHtml =
        '<div class="pt-2 border-t border-slate-800/60">' +
          '<p class="text-[9px] font-bold uppercase tracking-wider text-cyan-500 mb-1.5">From AquaFlow Expert Knowledge Base: ' +
            aicoreEscapeHtml(kbMatch.brand) + ' / ' + aicoreEscapeHtml(kbMatch.topic) + '</p>' +
          '<div class="text-slate-300 leading-relaxed">' + kbMatch.content + '</div>' +
        '</div>';
    }

    var guidanceBlock =
      '<div class="bg-slate-900/80 border border-slate-800 rounded-lg p-3">' +
        '<p class="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">Manufacturer Guidance</p>' +
        '<p class="text-slate-300 leading-relaxed">' + aicoreEscapeHtml(symptom.guidance) + '</p>' +
        kbHtml +
      '</div>';

    var footer =
      '<p class="text-[9px] text-slate-500 italic pt-2 border-t border-slate-800/60">' +
        'AICore offline enrichment - verify every finding before servicing equipment. ' +
        'AICore live context: ' + aicoreEscapeHtml(buildContextLine()) +
      '</p>';

    return header + symptomBlock + causesBlock + checksBlock + guidanceBlock + footer + '</div></div>';
  }

  // ------------------------------------------------------------
  // (3) enrichDiagnostics(query, kbReply) -> HTML compatible with
  // the chat rendering (Tailwind-styled string like kb replies).
  // Returns '' when the query is empty so callers can fall back
  // cleanly to the offline knowledge base reply.
  // ------------------------------------------------------------
  function enrichDiagnostics(query, kbReply) {
    try {
      var q = String(query || '').toLowerCase();
      if (!q) return '';
      var symptom = matchSymptom(q);
      var kbMatch = findKnowledgeBaseMatch(q);
      return buildEnrichmentHtml(symptom, kbMatch, q);
    } catch (e) {
      return '';
    }
  }

  // Structured version of the same pipeline (for programmatic use).
  function runDiagnostics(query) {
    var q = String(query || '').toLowerCase();
    var symptom = matchSymptom(q);
    return {
      symptom: symptom.label,
      probableCauses: symptom.causes.slice(),
      verificationChecks: symptom.checks.slice(),
      manufacturerGuidance: symptom.guidance,
      knowledgeBaseMatch: findKnowledgeBaseMatch(q),
      context: getDiagnosticsContext(),
      enrichedHtml: enrichDiagnostics(query, null)
    };
  }

  var api = {
    name: SERVICE_NAME,
    version: SERVICE_VERSION,
    getDiagnosticsContext: getDiagnosticsContext,
    enrichDiagnostics: enrichDiagnostics,
    runDiagnostics: runDiagnostics,
    matchSymptom: matchSymptom
  };

  root.AquaFlowAICore = api;
})();
