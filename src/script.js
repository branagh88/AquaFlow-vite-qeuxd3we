let currentTab = 'dashboard';
let currentCalcTab = 'pipe';

let customersList = [
  { id: 1, name: 'Robert Smith', address: '124 Lakeview Dr, Austin TX', phone: '(555) 234-5678', email: 'rsmith@example.com' },
  { id: 2, name: 'Sarah Johnson', address: '88 Pine Rd, Pottstown PA', phone: '(555) 987-6543', email: 'sjohnson@example.com' }
];

let customerReports = {
  1: { customerName: 'Robert Smith', address: '124 Lakeview Dr, Austin TX', phone: '(555) 234-5678', email: 'rsmith@example.com', notes: '', sections: {} }
};

let activeReportCustomerId = 1;
let jobRecords = [
  { id: 1, title: 'Annual Pump & Filter Service', customer: 'Robert Smith', date: '2026-08-08', status: 'Completed' }
];

let appSettings = { companyName: 'AquaFlow Field Services LLC', technicianName: 'Dave Miller (Master Tech)' };

let pipeMat = 'CTS (Copper Tube Size)', pipeSubType = 'SDR 9', pipeSize = '1.0', pipeLen = 100, targetCustomerId = 1;
let chlorWellDepth = 200, chlorStaticLevel = 40, chlorCasingDiam = 6;
let chlorPlumbingMode = 'average', chlorCustomPlum = 20;

let wizSource = 'Well', wizHardness = 25, wizPh = 6.6, wizIron = 2.5, wizTds = 450, wizNitrates = 12.0, wizNitrites = 0.5, wizBacteria = 'Pass';
let wizGenerated = false;

let testHardness = 22, testPh = 7.0, testIron = 1.2, testTds = 380, testChlorine = 0.5;
let customerSearchQuery = '', reportSearchQuery = '', calcCustomerSearchQuery = '';

// ============================================================
// COMPREHENSIVE MULTI-MANUFACTURER NORMALIZED PUMP DATABASE
// (Grundfos, Pentair/Sta-Rite, Berkeley, Goulds, Franklin Electric - 1/2 HP to 1 HP)
// ============================================================
const masterPumpDatabase = {
  "Grundfos": {
    "SP 7S": {
      "0.5 HP": [
        {
          model: "Grundfos SP 7S 7S05-8",
          series: "SP",
          family: "7 GPM",
          familyGpm: 7,
          nominalGpm: 7,
          horsepower: "0.5 HP",
          stages: 8,
          voltage: 230,
          motorType: "3-Wire / 2-Wire",
          catalogNumber: "7S05-8",
          shutoffHead: 180,
          shutoffPsi: Math.round(180 * 0.433),
          sourceDocument: "Grundfos SP Submersible Pumps Data Booklet",
          sourcePage: 37,
          curve: [
            { flow: 0, head: 180 }, { flow: 3, head: 170 }, { flow: 5, head: 160 }, { flow: 7, head: 145 }, { flow: 10, head: 110 }, { flow: 14, head: 50 }
          ]
        }
      ],
      "0.75 HP": [
        {
          model: "Grundfos SP 7S 7S07-15",
          series: "SP",
          family: "7 GPM",
          familyGpm: 7,
          nominalGpm: 7,
          horsepower: "0.75 HP",
          stages: 15,
          voltage: 230,
          motorType: "3-Wire / 2-Wire",
          catalogNumber: "7S07-15",
          shutoffHead: 335,
          shutoffPsi: Math.round(335 * 0.433),
          sourceDocument: "Grundfos SP Submersible Pumps Data Booklet",
          sourcePage: 37,
          curve: [
            { flow: 0, head: 335 }, { flow: 1, head: 330 }, { flow: 2, head: 324 }, { flow: 3, head: 317 }, { flow: 4, head: 309 }, 
            { flow: 5, head: 300 }, { flow: 6, head: 289 }, { flow: 7, head: 276 }, { flow: 8, head: 261 }, { flow: 9, head: 243 }, 
            { flow: 10, head: 222 }, { flow: 11, head: 198 }, { flow: 12, head: 170 }, { flow: 13, head: 138 }, { flow: 14, head: 100 }
          ]
        }
      ],
      "1 HP": [
        {
          model: "Grundfos SP 7S 7S10-20",
          series: "SP",
          family: "7 GPM",
          familyGpm: 7,
          nominalGpm: 7,
          horsepower: "1 HP",
          stages: 20,
          voltage: 230,
          motorType: "3-Wire / 2-Wire",
          catalogNumber: "7S10-20",
          shutoffHead: 445,
          shutoffPsi: Math.round(445 * 0.433),
          sourceDocument: "Grundfos SP Submersible Pumps Data Booklet",
          sourcePage: 37,
          curve: [
            { flow: 0, head: 445 }, { flow: 3, head: 420 }, { flow: 5, head: 390 }, { flow: 7, head: 350 }, { flow: 10, head: 280 }, { flow: 14, head: 150 }
          ]
        }
      ]
    }
  },
  "Pentair / Sta-Rite": {
    "5 GPM": {
      "1/2 HP": [
        { model: "Sta-Rite 5 GPM 1/2 HP (HS Series)", series: "HS", family: "5 GPM", familyGpm: 5, nominalGpm: 5, horsepower: "1/2 HP", stages: 14, voltage: 230, motorType: "2 Wire", catalogNumber: "S5P4HS05221", shutoffHead: 421, shutoffPsi: 182, sourceDocument: "Sta-Rite 4\" Submersible Pumps Catalog S11576", sourcePage: 5, curve: [{flow:0, head:420}, {flow:3, head:380}, {flow:5, head:310}, {flow:8, head:40}] }
      ],
      "3/4 HP": [
        { model: "Sta-Rite 5 GPM 3/4 HP (HS Series)", series: "HS", family: "5 GPM", familyGpm: 5, nominalGpm: 5, horsepower: "3/4 HP", stages: 19, voltage: 230, motorType: "2 Wire", catalogNumber: "S5P4HS07221", shutoffHead: 571, shutoffPsi: 247, sourceDocument: "Sta-Rite 4\" Submersible Pumps Catalog S11576", sourcePage: 5, curve: [{flow:0, head:570}, {flow:3, head:520}, {flow:5, head:440}, {flow:8, head:50}] }
      ],
      "1 HP": [
        { model: "Sta-Rite 5 GPM 1 HP (HS Series)", series: "HS", family: "5 GPM", familyGpm: 5, nominalGpm: 5, horsepower: "1 HP", stages: 22, voltage: 230, motorType: "2 Wire", catalogNumber: "S5P4HS10221", shutoffHead: 661, shutoffPsi: 286, sourceDocument: "Sta-Rite 4\" Submersible Pumps Catalog S11576", sourcePage: 5, curve: [{flow:0, head:660}, {flow:3, head:600}, {flow:5, head:520}, {flow:8, head:60}] }
      ]
    },
    "7 GPM": {
      "1/2 HP": [
        { model: "Sta-Rite 7 GPM 1/2 HP (HS Series)", series: "HS", family: "7 GPM", familyGpm: 7, nominalGpm: 7, horsepower: "1/2 HP", stages: 11, voltage: 230, motorType: "2 Wire", catalogNumber: "S7P4HS05221", shutoffHead: 372, shutoffPsi: 161, sourceDocument: "Sta-Rite 4\" Submersible Pumps Catalog S11576", sourcePage: 7, curve: [{flow:0, head:370}, {flow:3, head:340}, {flow:7, head:270}, {flow:10, head:120}] }
      ],
      "3/4 HP": [
        { model: "Sta-Rite 7 GPM 3/4 HP (HS Series)", series: "HS", family: "7 GPM", familyGpm: 7, nominalGpm: 7, horsepower: "3/4 HP", stages: 15, voltage: 230, motorType: "2 Wire", catalogNumber: "S7P4HS07221", shutoffHead: 507, shutoffPsi: 220, sourceDocument: "Sta-Rite 4\" Submersible Pumps Catalog S11576", sourcePage: 7, curve: [{flow:0, head:500}, {flow:3, head:460}, {flow:7, head:380}, {flow:11, head:150}] }
      ],
      "1 HP": [
        { model: "Sta-Rite 7 GPM 1 HP (HS Series)", series: "HS", family: "7 GPM", familyGpm: 7, nominalGpm: 7, horsepower: "1 HP", stages: 18, voltage: 230, motorType: "2 Wire", catalogNumber: "S7P4HS10221", shutoffHead: 661, shutoffPsi: 286, sourceDocument: "Sta-Rite 4\" Submersible Pumps Catalog S11576", sourcePage: 7, curve: [{flow:0, head:660}, {flow:3, head:600}, {flow:7, head:500}, {flow:11, head:200}] }
      ]
    },
    "10 GPM": {
      "1/2 HP": [
        { model: "Sta-Rite 10 GPM 1/2 HP (HS Series)", series: "HS", family: "10 GPM", familyGpm: 10, nominalGpm: 10, horsepower: "1/2 HP", stages: 8, voltage: 230, motorType: "2 Wire", catalogNumber: "S10P4HS05221", shutoffHead: 278, shutoffPsi: 120, sourceDocument: "Sta-Rite 4\" Submersible Pumps Catalog S11576", sourcePage: 9, curve: [{flow:0, head:275}, {flow:5, head:250}, {flow:10, head:200}, {flow:14, head:100}] }
      ],
      "3/4 HP": [
        { model: "Sta-Rite 10 GPM 3/4 HP (HS Series)", series: "HS", family: "10 GPM", familyGpm: 10, nominalGpm: 10, horsepower: "3/4 HP", stages: 11, voltage: 230, motorType: "2 Wire", catalogNumber: "S10P4HS07221", shutoffHead: 382, shutoffPsi: 165, sourceDocument: "Sta-Rite 4\" Submersible Pumps Catalog S11576", sourcePage: 9, curve: [{flow:0, head:380}, {flow:5, head:350}, {flow:10, head:280}, {flow:14, head:140}] }
      ],
      "1 HP": [
        { model: "Sta-Rite 10 GPM 1 HP (HS Series)", series: "HS", family: "10 GPM", familyGpm: 10, nominalGpm: 10, horsepower: "1 HP", stages: 13, voltage: 230, motorType: "2 Wire", catalogNumber: "S10P4HS10221", shutoffHead: 452, shutoffPsi: 195, sourceDocument: "Sta-Rite 4\" Submersible Pumps Catalog S11576", sourcePage: 9, curve: [{flow:0, head:450}, {flow:5, head:410}, {flow:10, head:330}, {flow:14, head:170}] }
      ]
    }
  },
  "Berkeley": {
    "7 GPM": {
      "1/2 HP": [{ model: "Berkeley 7 GPM 1/2 HP (K-Series)", series: "K", family: "7 GPM", familyGpm: 7, nominalGpm: 7, horsepower: "1/2 HP", stages: 10, voltage: 230, motorType: "2 Wire", catalogNumber: "B7K05221", shutoffHead: 329, shutoffPsi: 142, sourceDocument: "Berkeley K-Series Catalog", sourcePage: 2, curve: [{flow:0, head:329}, {flow:5, head:290}, {flow:7, head:240}, {flow:10, head:100}] }],
      "3/4 HP": [{ model: "Berkeley 7 GPM 3/4 HP (K-Series)", series: "K", family: "7 GPM", familyGpm: 7, nominalGpm: 7, horsepower: "3/4 HP", stages: 13, voltage: 230, motorType: "2 Wire", catalogNumber: "B7K07221", shutoffHead: 428, shutoffPsi: 185, sourceDocument: "Berkeley K-Series Catalog", sourcePage: 2, curve: [{flow:0, head:428}, {flow:5, head:380}, {flow:7, head:320}, {flow:10, head:150}] }],
      "1 HP": [{ model: "Berkeley 7 GPM 1 HP (K-Series)", series: "K", family: "7 GPM", familyGpm: 7, nominalGpm: 7, horsepower: "1 HP", stages: 17, voltage: 230, motorType: "2 Wire", catalogNumber: "B7K10221", shutoffHead: 560, shutoffPsi: 242, sourceDocument: "Berkeley K-Series Catalog", sourcePage: 2, curve: [{flow:0, head:560}, {flow:5, head:500}, {flow:7, head:420}, {flow:10, head:200}] }]
    },
    "10 GPM": {
      "1/2 HP": [{ model: "Berkeley 10 GPM 1/2 HP (K-Series)", series: "K", family: "10 GPM", familyGpm: 10, nominalGpm: 10, horsepower: "1/2 HP", stages: 7, voltage: 230, motorType: "2 Wire", catalogNumber: "B10K05221", shutoffHead: 243, shutoffPsi: 105, sourceDocument: "Berkeley K-Series Catalog", sourcePage: 2, curve: [{flow:0, head:243}, {flow:7, head:210}, {flow:10, head:170}, {flow:14, head:80}] }],
      "3/4 HP": [{ model: "Berkeley 10 GPM 3/4 HP (K-Series)", series: "K", family: "10 GPM", familyGpm: 10, nominalGpm: 10, horsepower: "3/4 HP", stages: 9, voltage: 230, motorType: "2 Wire", catalogNumber: "B10K07221", shutoffHead: 313, shutoffPsi: 135, sourceDocument: "Berkeley K-Series Catalog", sourcePage: 2, curve: [{flow:0, head:313}, {flow:7, head:270}, {flow:10, head:220}, {flow:14, head:100}] }],
      "1 HP": [{ model: "Berkeley 10 GPM 1 HP (K-Series)", series: "K", family: "10 GPM", familyGpm: 10, nominalGpm: 10, horsepower: "1 HP", stages: 12, voltage: 230, motorType: "2 Wire", catalogNumber: "B10K10221", shutoffHead: 417, shutoffPsi: 181, sourceDocument: "Berkeley K-Series Catalog", sourcePage: 2, curve: [{flow:0, head:417}, {flow:7, head:360}, {flow:10, head:300}, {flow:14, head:140}] }]
    }
  },
  "Goulds Water Technology": {
    "7GS": {
      "1/2 HP": [{ model: "Goulds 7GS05", series: "GS", family: "7GS", familyGpm: 7, nominalGpm: 7, horsepower: "1/2 HP", stages: 10, voltage: 230, motorType: "2 Wire", catalogNumber: "7GS05", shutoffHead: 300, shutoffPsi: 130, sourceDocument: "Goulds Technical Brochure B5-25GS R4", sourcePage: 2, curve: [{flow:0, head:300}, {flow:4, head:270}, {flow:7, head:220}, {flow:11, head:80}] }],
      "3/4 HP": [{ model: "Goulds 7GS07", series: "GS", family: "7GS", familyGpm: 7, nominalGpm: 7, horsepower: "3/4 HP", stages: 13, voltage: 230, motorType: "2 Wire", catalogNumber: "7GS07", shutoffHead: 380, shutoffPsi: 165, sourceDocument: "Goulds Technical Brochure B5-25GS R4", sourcePage: 2, curve: [{flow:0, head:380}, {flow:4, head:340}, {flow:7, head:280}, {flow:11, head:100}] }],
      "1 HP": [{ model: "Goulds 7GS10", series: "GS", family: "7GS", familyGpm: 7, nominalGpm: 7, horsepower: "1 HP", stages: 17, voltage: 230, motorType: "2 Wire", catalogNumber: "7GS10", shutoffHead: 500, shutoffPsi: 216, sourceDocument: "Goulds Technical Brochure B5-25GS R4", sourcePage: 2, curve: [{flow:0, head:500}, {flow:4, head:450}, {flow:7, head:370}, {flow:11, head:140}] }]
    }
  },
  "Franklin Electric": {
    "4\" 3200 Series": {
      "1/2 HP": [{ model: "Franklin 5 GPM 1/2 HP (3200 Series)", series: "3200", family: "5 GPM", familyGpm: 5, nominalGpm: 5, horsepower: "1/2 HP", stages: 13, voltage: 230, motorType: "2 Wire", catalogNumber: "5JR05P4-2W230", shutoffHead: 390, shutoffPsi: 169, sourceDocument: "Franklin Electric J-Class Catalog", sourcePage: 6, curve: [{flow:0, head:390}, {flow:3, head:360}, {flow:5, head:310}, {flow:8, head:100}] }],
      "3/4 HP": [{ model: "Franklin 5 GPM 3/4 HP (3200 Series)", series: "3200", family: "5 GPM", familyGpm: 5, horsepower: "3/4 HP", stages: 18, voltage: 230, motorType: "2 Wire", catalogNumber: "5JR07P4-2W230", shutoffHead: 541, shutoffPsi: 234, sourceDocument: "Franklin Electric J-Class Catalog", sourcePage: 6, curve: [{flow:0, head:540}, {flow:3, head:500}, {flow:5, head:430}, {flow:8, head:150}] }],
      "1 HP": [{ model: "Franklin 5 GPM 1 HP (3200 Series)", series: "3200", family: "5 GPM", familyGpm: 5, horsepower: "1 HP", stages: 23, voltage: 230, motorType: "2 Wire", catalogNumber: "5JR10P4-2W230", shutoffHead: 690, shutoffPsi: 299, sourceDocument: "Franklin Electric J-Class Catalog", sourcePage: 6, curve: [{flow:0, head:690}, {flow:3, head:640}, {flow:5, head:550}, {flow:8, head:180}] }]
    }
  }
};

let wellSpec = {
  manufacturer: "Grundfos",
  hp: "0.5 HP",
  pumpFamily: "SP 7S",
  pumpModelIndex: 0,
  totalDepth: 200,
  staticWaterLevel: 20,
  pumpSetting: 140,
  pumpingWaterLevel: '', 
  wellYield: 5,          
  pipeDiam: '1.049',     
  pipeMaterial: 'PVC',
  horizontalDist: 15,
  switchCutIn: 40,
  switchCutOut: 60
};

let comparisonMode = false;
let comparisonPumpB = {
  manufacturer: "Pentair / Sta-Rite",
  hp: "3/4 HP",
  pumpFamily: "7 GPM",
  pumpModelIndex: 0
};

let wfReportGenerated = false;

const sch40PvcFrictionTable = [
  { flow: 5, lossPer100: 1.8 },
  { flow: 6, lossPer100: 2.5 },
  { flow: 7, lossPer100: 3.3 },
  { flow: 8, lossPer100: 4.2 },
  { flow: 9, lossPer100: 5.2 },
  { flow: 10, lossPer100: 6.3 }
];

function getActivePumpObject(spec = wellSpec) {
  let mDb = masterPumpDatabase[spec.manufacturer];
  if (!mDb) return null;
  let famObj = mDb[spec.pumpFamily];
  if (!famObj) {
    let firstFam = Object.keys(mDb)[0];
    spec.pumpFamily = firstFam;
    famObj = mDb[firstFam];
  }
  let hpList = famObj[spec.hp] || Object.values(famObj)[0];
  let index = Math.min(spec.pumpModelIndex, hpList.length - 1);
  return hpList[index];
}

function interpolatePumpCurve(q, pumpObj) {
  if (!pumpObj || !pumpObj.curve) return 0;
  let curve = pumpObj.curve;
  if (q <= curve[0].flow) return curve[0].head;
  const last = curve[curve.length - 1];
  if (q >= last.flow) return last.head;

  for (let i = 0; i < curve.length - 1; i++) {
    let p1 = curve[i];
    let p2 = curve[i + 1];
    if (q >= p1.flow && q <= p2.flow) {
      let ratio = (q - p1.flow) / (p2.flow - p1.flow);
      return p1.head + ratio * (p2.head - p1.head);
    }
  }
  return 0;
}

function interpolateFrictionTable(q) {
  if (q <= sch40PvcFrictionTable[0].flow) return sch40PvcFrictionTable[0].lossPer100;
  const last = sch40PvcFrictionTable[sch40PvcFrictionTable.length - 1];
  if (q >= last.flow) return last.lossPer100;

  for (let i = 0; i < sch40PvcFrictionTable.length - 1; i++) {
    let p1 = sch40PvcFrictionTable[i];
    let p2 = sch40PvcFrictionTable[i + 1];
    if (q >= p1.flow && q <= p2.flow) {
      let ratio = (q - p1.flow) / (p2.flow - p1.flow);
      return p1.lossPer100 + ratio * (p2.lossPer100 - p1.lossPer100);
    }
  }
  return 0;
}

function solveOperatingPoint(targetPsiHead, verticalLift, totalPipeLen, pumpObj) {
  let bestQ = 0;
  let minDiff = Infinity;
  for (let q = 0; q <= 35; q += 0.05) {
    let pumpHead = interpolatePumpCurve(q, pumpObj);
    let lossPer100 = interpolateFrictionTable(q);
    let totalFriction = (lossPer100 * totalPipeLen) / 100;
    let systemHead = verticalLift + targetPsiHead + totalFriction;
    let diff = Math.abs(pumpHead - systemHead);
    if (diff < minDiff) {
      minDiff = diff;
      bestQ = q;
    }
  }
  return Math.round(bestQ * 10) / 10;
}

// ============================================================
// AUTHORITATIVE AMTROL WELL-X-TROL DATABASE & PUBLISHED DRAWDOWN
// ============================================================
const amtrolTankDatabase = {
  "WX-202": { model: "WX-202", totalVolume: 20, drawdowns: { "20/40": 4.9, "30/50": 6.2, "40/60": 5.4, "50/70": 4.7 } },
  "WX-202XL": { model: "WX-202XL", totalVolume: 26, drawdowns: { "20/40": 6.3, "30/50": 8.0, "40/60": 7.0, "50/70": 6.1 } },
  "WX-203": { model: "WX-203", totalVolume: 32, drawdowns: { "20/40": 7.8, "30/50": 9.9, "40/60": 8.6, "50/70": 7.6 } },
  "WX-205": { model: "WX-205", totalVolume: 34, drawdowns: { "20/40": 8.3, "30/50": 10.5, "40/60": 9.1, "50/70": 8.0 } },
  "WX-250": { model: "WX-250", totalVolume: 44, drawdowns: { "20/40": 10.7, "30/50": 13.6, "40/60": 11.8, "50/70": 10.4 } },
  "WX-251": { model: "WX-251", totalVolume: 62, drawdowns: { "20/40": 15.1, "30/50": 19.2, "40/60": 16.6, "50/70": 14.6 } },
  "WX-255": { model: "WX-255", totalVolume: 81, drawdowns: { "20/40": 19.7, "30/50": 25.0, "40/60": 21.7, "50/70": 19.1 } },
  "WX-302": { model: "WX-302", totalVolume: 86, drawdowns: { "20/40": 21.0, "30/50": 26.6, "40/60": 23.0, "50/70": 20.3 } },
  "WX-350": { model: "WX-350", totalVolume: 119, drawdowns: { "20/40": 29.0, "30/50": 36.8, "40/60": 31.9, "50/70": 28.1 } }
};

let tankState = {
  tankMode: "preset",         
  selectedPreset: "WX-203",   
  manualVolume: 32,
  switchSetting: "50/70",     
  customPrechargeEnabled: false,
  customPrechargeValue: 48,
  lastUpdated: new Date().toISOString()
};

function getActiveTankVolume() {
  if (tankState.tankMode === 'preset') {
    return amtrolTankDatabase[tankState.selectedPreset] ? amtrolTankDatabase[tankState.selectedPreset].totalVolume : 32;
  }
  return tankState.manualVolume;
}

function getCutInAndOut(switchStr) {
  let parts = switchStr.split('/');
  return { cutIn: parseInt(parts[0]), cutOut: parseInt(parts[1]) };
}

function calculateTankStateResults() {
  let { cutIn, cutOut } = getCutInAndOut(tankState.switchSetting);
  let defaultPrecharge = cutIn - 2;
  let precharge = tankState.customPrechargeEnabled ? tankState.customPrechargeValue : defaultPrecharge;
  
  let totalVol = getActiveTankVolume();
  let drawdown = 0;
  let dataSource = "Manufacturer Published Drawdown";

  if (tankState.tankMode === 'preset' && amtrolTankDatabase[tankState.selectedPreset]) {
    let tankEntry = amtrolTankDatabase[tankState.selectedPreset];
    if (tankEntry.drawdowns[tankState.switchSetting] !== undefined && !tankState.customPrechargeEnabled) {
      drawdown = tankEntry.drawdowns[tankState.switchSetting];
      dataSource = "Manufacturer Published Drawdown";
    } else {
      let p0Abs = precharge + 14.7;
      let pInAbs = cutIn + 14.7;
      let pOutAbs = cutOut + 14.7;
      drawdown = totalVol * p0Abs * ((1 / pInAbs) - (1 / pOutAbs));
      dataSource = tankState.customPrechargeEnabled ? "Calculated from Custom Precharge" : "Calculated Estimate (Boyle's Law)";
    }
  } else {
    let p0Abs = precharge + 14.7;
    let pInAbs = cutIn + 14.7;
    let pOutAbs = cutOut + 14.7;
    drawdown = totalVol * p0Abs * ((1 / pInAbs) - (1 / pOutAbs));
    dataSource = "Calculated Estimate (Manual Tank)";
  }

  let percentage = totalVol > 0 ? (drawdown / totalVol) * 100 : 0;

  return {
    model: tankState.tankMode === 'preset' ? tankState.selectedPreset : "Custom Manual Tank",
    totalVolume: totalVol,
    switchSetting: tankState.switchSetting,
    cutIn,
    cutOut,
    precharge,
    drawdown: Math.round(drawdown * 10) / 10,
    percentage: Math.round(percentage * 10) / 10,
    dataSource,
    timestamp: new Date().toLocaleTimeString()
  };
}

let aiChatHistory = [
  { role: 'model', parts: [{ text: "Hello Master Technician! I am your AquaFlow Hybrid AI Expert. Ask me about 1/2HP to 1HP multi-manufacturer pump curves, Hazen-Williams friction tables, or Amtrol Well-X-Trol tank sizing." }] }
];

function switchTab(tab) {
  currentTab = tab;
  render();
  window.scrollTo(0, 0);
}

function switchCalcTab(calcTab) {
  currentCalcTab = calcTab;
  render();
}

function render() {
  const container = document.getElementById('app-container');
  if (!container) return;

  let backBtnHtml = currentTab !== 'dashboard' ? `
    <button onclick="switchTab('dashboard')" class="mb-4 inline-flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
      <i data-lucide="arrow-left" class="w-4 h-4"></i>
      <span>Back to Dashboard</span>
    </button>
  ` : '';

  let contentHtml = '';
  if (currentTab === 'dashboard') contentHtml = renderDashboard();
  else if (currentTab === 'calculators') contentHtml = renderCalculators();
  else if (currentTab === 'wizard') contentHtml = renderWizard();
  else if (currentTab === 'jobs') contentHtml = renderJobs();
  else if (currentTab === 'customers') contentHtml = renderCustomers();
  else if (currentTab === 'reports') contentHtml = renderMasterReport();
  else if (currentTab === 'ai') contentHtml = renderAI();
  else if (currentTab === 'tests') contentHtml = renderWaterTestModule();
  else if (currentTab === 'settings') contentHtml = renderSettings();

  container.innerHTML = backBtnHtml + contentHtml;
  
  if (currentTab === 'calculators') {
    renderCalculatorSubTab();
  }

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function renderDashboard() {
  return `
    <div class="space-y-6">
      <div class="bg-gradient-to-r from-slate-800 to-slate-800/90 border border-slate-700 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
            <span class="text-xs uppercase tracking-wider font-bold text-emerald-400">1/2HP to 1HP Pump & Friction Engine Active</span>
          </div>
          <h2 class="text-xl md:text-2xl font-black text-white mt-1">Welcome back, ${appSettings.technicianName}</h2>
          <p class="text-sm text-slate-400 mt-0.5">Company: <span class="text-blue-400 font-semibold">${appSettings.companyName}</span></p>
        </div>
        <button onclick="switchTab('jobs')" class="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all flex items-center justify-center space-x-2">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>New Job Record</span>
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        ${cardHtml('calculators', 'Calculators', 'Pipe, Tank Drawdown, Friction & Chlorination', 'calculator', 'text-blue-400', 'from-blue-600/20 to-indigo-600/20', 'border-blue-500/30')}
        ${cardHtml('wizard', 'Water Treatment Wizard', 'Well vs Municipal & Comprehensive Test Sizing', 'sparkles', 'text-cyan-400', 'from-cyan-600/20 to-blue-600/20', 'border-cyan-500/30')}
        ${cardHtml('jobs', 'Job Records', 'Invoices, photos & signatures', 'file-check', 'text-emerald-400', 'from-emerald-600/20 to-teal-600/20', 'border-emerald-500/30')}
        ${cardHtml('customers', 'Customer Database', 'Profiles & equipment history', 'users', 'text-amber-400', 'from-amber-600/20 to-orange-600/20', 'border-amber-500/30')}
        ${cardHtml('reports', 'Master PDF Report', 'Unified viewable/editable report', 'file-text', 'text-indigo-400', 'from-indigo-600/20 to-violet-600/20', 'border-indigo-500/30')}
        ${cardHtml('ai', 'AI Diagnostics & Expert', 'Grundfos, Pentek, Clack & Fleck VFDs', 'bot', 'text-teal-400', 'from-teal-600/20 to-emerald-600/20', 'border-teal-500/30')}
        ${cardHtml('tests', 'Water Test Module', 'Field kits, parameters & graphs', 'droplets', 'text-sky-400', 'from-sky-600/20 to-blue-600/20', 'border-sky-500/30')}
        ${cardHtml('settings', 'App Settings', 'Permissions, storage & GPS', 'settings', 'text-slate-400', 'from-slate-700/20 to-slate-800/20', 'border-slate-600/30')}
      </div>
    </div>
  `;
}

function cardHtml(id, title, desc, icon, iconColor, bg, border) {
  return `
    <div onclick="switchTab('${id}')" class="bg-slate-800/80 hover:bg-slate-800 border ${border} rounded-2xl p-4 md:p-5 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl flex flex-col justify-between group">
      <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center mb-3 shadow-inner group-hover:scale-110 transition-transform">
        <i data-lucide="${icon}" class="w-7 h-7 ${iconColor}"></i>
      </div>
      <div>
        <h3 class="text-base font-bold text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
          ${title}
          <i data-lucide="chevron-right" class="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform"></i>
        </h3>
        <p class="text-xs text-slate-400 mt-1 line-clamp-2">${desc}</p>
      </div>
    </div>
  `;
}

function renderCalculators() {
  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 class="text-2xl font-black text-white flex items-center gap-2">
            <i data-lucide="calculator" class="w-7 h-7 text-blue-400"></i>
            Field Calculators
          </h2>
          <p class="text-sm text-slate-400">Calculations automatically export to customer master reports.</p>
        </div>
        <button onclick="switchTab('reports')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5">
          <i data-lucide="file-text" class="w-4 h-4"></i> View Master PDF
        </button>
      </div>

      <div class="flex overflow-x-auto space-x-2 pb-2">
        <button onclick="switchCalcTab('pipe')" class="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${currentCalcTab==='pipe'?'bg-blue-600 text-white shadow':'bg-slate-800 text-slate-300'}">Pipe Volume</button>
        <button onclick="switchCalcTab('tank')" class="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${currentCalcTab==='tank'?'bg-blue-600 text-white shadow':'bg-slate-800 text-slate-300'}">Pressure Tank</button>
        <button onclick="switchCalcTab('wellfriction')" class="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${currentCalcTab==='wellfriction'?'bg-blue-600 text-white shadow':'bg-slate-800 text-slate-300'}">Well & Friction Loss</button>
        <button onclick="switchCalcTab('chlorination')" class="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${currentCalcTab==='chlorination'?'bg-blue-600 text-white shadow':'bg-slate-800 text-slate-300'}">Shock Chlorination</button>
      </div>

      <div id="calc-content-area" class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl"></div>
    </div>
  `;
}

function renderCustomerExportSection(calcKey) {
  let filtered = customersList.filter(c => c.name.toLowerCase().includes(calcCustomerSearchQuery.toLowerCase()) || c.address.toLowerCase().includes(calcCustomerSearchQuery.toLowerCase()));
  return `
    <div class="mt-6 pt-4 border-t border-slate-700/80 bg-slate-900/40 p-4 rounded-xl space-y-3">
      <h4 class="text-xs font-bold uppercase tracking-wider text-blue-400">Assign & Export to Customer Master Report</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-[10px] font-semibold text-slate-400 mb-1">Search Name or Address</label>
          <input type="text" value="${calcCustomerSearchQuery}" oninput="calcCustomerSearchQuery=this.value; renderCalculatorSubTab()" placeholder="Filter customers..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
        </div>
        <div>
          <label class="block text-[10px] font-semibold text-slate-400 mb-1">Select Customer</label>
          <select id="export-customer-${calcKey}" onchange="targetCustomerId=parseInt(this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
            ${filtered.length === 0 ? '<option value="">No matching customers</option>' : filtered.map(c => `<option value="${c.id}" ${targetCustomerId===c.id?'selected':''}>${c.name} (${c.address})</option>`).join('')}
          </select>
        </div>
      </div>
      <button onclick="exportCalculatorResult('${calcKey}')" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all">
        <i data-lucide="upload" class="w-4 h-4"></i> Export to Selected Customer Master Report
      </button>
    </div>
  `;
}

function renderCalculatorSubTab() {
  const area = document.getElementById('calc-content-area');
  if (!area) return;

  if (currentCalcTab === 'pipe') {
    let vol = pipeLen * 0.0408 * Math.pow(parseFloat(pipeSize || 1), 2);
    let waterWeight = vol * 8.34;
    area.innerHTML = `
      <h3 class="text-lg font-bold text-white mb-4">Pipe Volume & Capacity</h3>
      <div class="space-y-4 max-w-xl">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Pipe Material</label>
          <select id="pipe-mat" onchange="pipeMat=this.value; renderCalculatorSubTab()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
            <option value="CTS (Copper Tube Size)" ${pipeMat==='CTS (Copper Tube Size)'?'selected':''}>CTS (Copper Tube Size)</option>
            <option value="PVC / Poly Tubing" ${pipeMat==='PVC / Poly Tubing'?'selected':''}>PVC / Poly Tubing</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">SDR Rating</label>
          <select id="pipe-sub" onchange="pipeSubType=this.value; renderCalculatorSubTab()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
            <option value="SDR 9" ${pipeSubType==='SDR 9'?'selected':''}>SDR 9</option>
            <option value="SDR 11" ${pipeSubType==='SDR 11'?'selected':''}>SDR 11</option>
            <option value="Schedule 40" ${pipeSubType==='Schedule 40'?'selected':''}>Schedule 40</option>
            <option value="Schedule 80" ${pipeSubType==='Schedule 80'?'selected':''}>Schedule 80</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Nominal Pipe Size (Inches)</label>
          <select id="pipe-sz" onchange="pipeSize=this.value; renderCalculatorSubTab()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
            <option value="0.75" ${pipeSize==='0.75'?'selected':''}>3/4"</option>
            <option value="1.0" ${pipeSize==='1.0'?'selected':''}>1"</option>
            <option value="1.25" ${pipeSize==='1.25'?'selected':''}>1-1/4"</option>
            <option value="1.5" ${pipeSize==='1.5'?'selected':''}>1-1/2"</option>
            <option value="2.0" ${pipeSize==='2.0'?'selected':''}>2"</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Run Length of Pipe (Feet)</label>
          <input type="number" id="input-len" value="${pipeLen}" oninput="pipeLen=parseFloat(this.value)||0; updateCalcResultDisplay()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
        </div>
        <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-1">
          <div class="flex justify-between items-center">
            <span class="text-xs text-slate-400">Estimated Water Volume:</span>
            <span id="calc-result" class="text-xl font-bold text-blue-400">${vol.toFixed(2)} Gallons</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-slate-400">Total Water Weight:</span>
            <span id="calc-weight" class="text-sm font-semibold text-cyan-400">${waterWeight.toFixed(1)} lbs</span>
          </div>
        </div>
        ${renderCustomerExportSection('pipe')}
      </div>
    `;
  } else if (currentCalcTab === 'tank') {
    let results = calculateTankStateResults();

    area.innerHTML = `
      <h3 class="text-lg font-bold text-white mb-4">Pressure Tank Drawdown Calculator (Amtrol Well-X-Trol)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div class="space-y-4">
          
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Pressure Switch Setting [USER INPUT]</label>
            <select onchange="tankState.switchSetting=this.value; renderCalculatorSubTab();" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
              <option value="20/40" ${tankState.switchSetting==='20/40'?'selected':''}>20 / 40 PSI</option>
              <option value="30/50" ${tankState.switchSetting==='30/50'?'selected':''}>30 / 50 PSI</option>
              <option value="40/60" ${tankState.switchSetting==='40/60'?'selected':''}>40 / 60 PSI (Standard)</option>
              <option value="50/70" ${tankState.switchSetting==='50/70'?'selected':''}>50 / 70 PSI</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Tank Capacity Mode [USER INPUT]</label>
            <div class="flex gap-2 mb-2">
              <button onclick="tankState.tankMode='preset'; renderCalculatorSubTab()" class="flex-1 py-1.5 rounded-lg text-xs font-bold ${tankState.tankMode==='preset'?'bg-blue-600 text-white':'bg-slate-900 text-slate-400 border border-slate-700'}">Preset Tanks</button>
              <button onclick="tankState.tankMode='manual'; renderCalculatorSubTab()" class="flex-1 py-1.5 rounded-lg text-xs font-bold ${tankState.tankMode==='manual'?'bg-blue-600 text-white':'bg-slate-900 text-slate-400 border border-slate-700'}">Manual Input</button>
            </div>
            
            ${tankState.tankMode === 'preset' ? `
              <select onchange="tankState.selectedPreset=this.value; renderCalculatorSubTab()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
                <option value="WX-202" ${tankState.selectedPreset==='WX-202'?'selected':''}>Amtrol Well-X-Trol WX-202 — 20 Gal</option>
                <option value="WX-202XL" ${tankState.selectedPreset==='WX-202XL'?'selected':''}>Amtrol Well-X-Trol WX-202XL — 26 Gal</option>
                <option value="WX-203" ${tankState.selectedPreset==='WX-203'?'selected':''}>Amtrol Well-X-Trol WX-203 — 32 Gal</option>
                <option value="WX-205" ${tankState.selectedPreset==='WX-205'?'selected':''}>Amtrol Well-X-Trol WX-205 — 34 Gal</option>
                <option value="WX-250" ${tankState.selectedPreset==='WX-250'?'selected':''}>Amtrol Well-X-Trol WX-250 — 44 Gal</option>
                <option value="WX-251" ${tankState.selectedPreset==='WX-251'?'selected':''}>Amtrol Well-X-Trol WX-251 — 62 Gal</option>
                <option value="WX-255" ${tankState.selectedPreset==='WX-255'?'selected':''}>Amtrol Well-X-Trol WX-255 — 81 Gal</option>
                <option value="WX-302" ${tankState.selectedPreset==='WX-302'?'selected':''}>Amtrol Well-X-Trol WX-302 — 86 Gal</option>
                <option value="WX-350" ${tankState.selectedPreset==='WX-350'?'selected':''}>Amtrol Well-X-Trol WX-350 — 119 Gal</option>
              </select>
            ` : `
              <input type="number" value="${tankState.manualVolume}" oninput="tankState.manualVolume=parseFloat(this.value)||0; renderCalculatorSubTab()" placeholder="Enter total tank volume in gallons..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
            `}
          </div>

          <div class="bg-slate-900/40 p-3 rounded-xl border border-slate-700/60 space-y-2">
            <div class="flex items-center space-x-2">
              <input type="checkbox" id="custom-precharge-check" ${tankState.customPrechargeEnabled?'checked':''} onchange="tankState.customPrechargeEnabled=this.checked; renderCalculatorSubTab();" class="rounded bg-slate-900 border-slate-700 text-blue-600">
              <label for="custom-precharge-check" class="text-xs font-semibold text-cyan-300">Custom Precharge Override [USER INPUT]</label>
            </div>
            ${tankState.customPrechargeEnabled ? `
              <div>
                <label class="block text-[10px] font-semibold text-slate-400 mb-1">Custom Precharge PSI</label>
                <input type="number" value="${tankState.customPrechargeValue}" oninput="tankState.customPrechargeValue=parseFloat(this.value)||0; renderCalculatorSubTab()" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-white text-xs">
              </div>
            ` : ''}
          </div>

          <div class="bg-slate-900/90 p-4 rounded-2xl border border-blue-500/40 space-y-1.5 text-xs">
            <p class="text-slate-400">Tank Model: <b class="text-white">${results.model}</b> [MANUFACTURER DATA]</p>
            <p class="text-slate-400">Total Tank Capacity: <b class="text-white">${results.totalVolume} gal</b> [MANUFACTURER DATA]</p>
            <p class="text-slate-400">Tank Precharge: <b class="text-cyan-400">${results.precharge} PSI</b> [CALCULATED]</p>
            <p class="text-slate-400">Estimated/Manufacturer Drawdown: <b class="text-emerald-400 text-sm">${results.drawdown} gal</b> [${results.dataSource.toUpperCase()}]</p>
            <p class="text-slate-400">Drawdown Percentage: <b class="text-blue-400">${results.percentage}%</b> [CALCULATED]</p>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center bg-slate-900/80 border border-slate-700 rounded-2xl p-6">
          <div class="w-28 h-52 bg-slate-800 border-2 border-blue-500 rounded-3xl relative overflow-hidden flex flex-col justify-end shadow-inner">
            <div style="height: ${Math.max(10, results.percentage)}%" class="bg-gradient-to-t from-blue-600 to-cyan-400 w-full transition-all duration-300"></div>
            <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
              ${results.drawdown} Gal (${results.percentage}%)
            </div>
          </div>
          <span class="text-xs text-slate-400 mt-3 font-semibold">Tank Water Drawdown Level</span>
        </div>
      </div>

      <div class="bg-slate-950 p-4 rounded-xl border border-amber-500/30 text-[11px] text-slate-400 space-y-1">
        <p class="text-amber-400 font-bold uppercase tracking-wider">Developer Debug Panel [STATE INSPECTOR]</p>
        <p>• Selected Tank Model: <b class="text-white">${results.model}</b></p>
        <p>• Total Tank Volume: <b class="text-white">${results.totalVolume} gal</b></p>
        <p>• Cut-In / Cut-Out: <b class="text-white">${results.cutIn} / ${results.cutOut} PSI</b></p>
        <p>• Calculated Precharge: <b class="text-cyan-300">${results.precharge} PSI</b></p>
        <p>• Drawdown Source: <b class="text-cyan-300">${results.dataSource}</b></p>
        <p>• Drawdown Value: <b class="text-emerald-400">${results.drawdown} gal</b></p>
        <p>• Visual Percentage: <b class="text-blue-400">${results.percentage}%</b></p>
        <p>• Last State Timestamp: <b class="text-slate-300">${results.timestamp}</b></p>
      </div>

      ${renderCustomerExportSection('tank')}
    `;
  } else if (currentCalcTab === 'wellfriction') {
    let activePump = getActivePumpObject(wellSpec);
    let pumpingLevel = wellSpec.pumpingWaterLevel !== '' ? parseFloat(wellSpec.pumpingWaterLevel) : wellSpec.staticWaterLevel;
    let verticalLift = wellSpec.pumpSetting - pumpingLevel;
    if (verticalLift < 0) verticalLift = 0;

    let cutInHead = wellSpec.switchCutIn * 2.31;
    let cutOutHead = wellSpec.switchCutOut * 2.31;
    let totalPipeLen = wellSpec.pumpSetting + wellSpec.horizontalDist;

    let flow40 = solveOperatingPoint(cutInHead, verticalLift, totalPipeLen, activePump);
    let flow50 = solveOperatingPoint(50 * 2.31, verticalLift, totalPipeLen, activePump);
    let flow60 = solveOperatingPoint(cutOutHead, verticalLift, totalPipeLen, activePump);

    let operatingGpm = flow60;
    let operatingLossPer100 = interpolateFrictionTable(operatingGpm);
    let operatingFriction = (operatingLossPer100 * totalPipeLen) / 100;
    let operatingTdh = verticalLift + cutOutHead + operatingFriction;

    let warnings = [];
    if (wellSpec.pumpSetting > wellSpec.totalDepth) warnings.push("⚠️ WARNING: Pump setting is deeper than total well depth.");
    if (wellSpec.staticWaterLevel > wellSpec.pumpSetting) warnings.push("⚠️ WARNING: Static water level is deeper than pump setting.");
    if (pumpingLevel > wellSpec.pumpSetting) warnings.push("⚠️ WARNING: Pumping water level is deeper than pump setting.");
    if (activePump && operatingTdh > activePump.shutoffHead) warnings.push(`⚠️ WARNING: System TDH (${operatingTdh.toFixed(1)} ft) exceeds pump shutoff head (${activePump.shutoffHead} ft). Pump cannot achieve required pressure.`);
    if (operatingGpm > wellSpec.wellYield) warnings.push(`⚠️ WARNING: Pump/system operating capacity (${operatingGpm} GPM) exceeds entered well yield (${wellSpec.wellYield} GPM).`);

    let sustainableFlow = Math.min(operatingGpm, wellSpec.wellYield);

    let mDb = masterPumpDatabase[wellSpec.manufacturer];
    let famObj = mDb[wellSpec.pumpFamily] || mDb[Object.keys(mDb)[0]];
    let availableHps = Object.keys(famObj);
    if (!availableHps.includes(wellSpec.hp)) {
      wellSpec.hp = availableHps[0];
      wellSpec.pumpModelIndex = 0;
      famObj = masterPumpDatabase[wellSpec.manufacturer][wellSpec.pumpFamily];
    }
    let hpModels = famObj[wellSpec.hp] || [];
    if (wellSpec.pumpModelIndex >= hpModels.length) wellSpec.pumpModelIndex = 0;
    let currentPumpObj = hpModels[wellSpec.pumpModelIndex] || hpModels[0];
    wellSpec.pumpModel = currentPumpObj.model;

    let compPumpObj = null;
    let compFlow60 = 0, compTdh = 0;
    if (comparisonMode) {
      let cDb = masterPumpDatabase[comparisonPumpB.manufacturer];
      let cFam = cDb[comparisonPumpB.pumpFamily] || cDb[Object.keys(cDb)[0]];
      let cHps = cFam[comparisonPumpB.hp] || cFam[Object.keys(cFam)[0]];
      compPumpObj = cHps[0];
      compFlow60 = solveOperatingPoint(cutOutHead, verticalLift, totalPipeLen, compPumpObj);
      let compLoss = interpolateFrictionTable(compFlow60);
      let compFrict = (compLoss * totalPipeLen) / 100;
      compTdh = verticalLift + cutOutHead + compFrict;
    }

    area.innerHTML = `
      <h3 class="text-lg font-bold text-white mb-4">Well Pump Friction Loss & Performance Analysis (1/2HP to 1HP)</h3>
      
      <div class="space-y-4 max-w-2xl bg-slate-900/60 p-5 rounded-2xl border border-slate-700">
        
        <div class="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-blue-500/30">
          <div>
            <label class="block text-[11px] font-semibold text-cyan-400 mb-1">1. Select Manufacturer [USER INPUT]</label>
            <select onchange="wellSpec.manufacturer=this.value; let fams=Object.keys(masterPumpDatabase[wellSpec.manufacturer]); wellSpec.pumpFamily=fams[0]; let hps=Object.keys(masterPumpDatabase[wellSpec.manufacturer][wellSpec.pumpFamily]); wellSpec.hp=hps[0]; wellSpec.pumpModelIndex=0; renderCalculatorSubTab();" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
              ${Object.keys(masterPumpDatabase).map(m => `<option value="${m}" ${wellSpec.manufacturer===m?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-cyan-400 mb-1">2. Pump Family / GPM [USER INPUT]</label>
            <select onchange="wellSpec.pumpFamily=this.value; let hps=Object.keys(masterPumpDatabase[wellSpec.manufacturer][wellSpec.pumpFamily]); wellSpec.hp=hps[0]; wellSpec.pumpModelIndex=0; renderCalculatorSubTab();" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
              ${Object.keys(masterPumpDatabase[wellSpec.manufacturer]).map(f => `<option value="${f}" ${wellSpec.pumpFamily===f?'selected':''}>${f}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-blue-500/30">
          <div>
            <label class="block text-[11px] font-semibold text-cyan-400 mb-1">3. Select Horsepower (1/2HP - 1HP) [USER INPUT]</label>
            <select onchange="wellSpec.hp=this.value; wellSpec.pumpModelIndex=0; renderCalculatorSubTab();" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
              ${availableHps.map(h => `<option value="${h}" ${wellSpec.hp===h?'selected':''}>${h}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-cyan-400 mb-1">4. Specific Model / Series [MANUFACTURER DATA]</label>
            <select onchange="wellSpec.pumpModelIndex=parseInt(this.value); renderCalculatorSubTab();" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
              ${hpModels.map((m, idx) => `<option value="${idx}" ${wellSpec.pumpModelIndex===idx?'selected':''}>${m.model} (${m.catalogNumber})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Total Well Depth (Ft) [USER INPUT]</label>
            <input type="number" value="${wellSpec.totalDepth}" oninput="wellSpec.totalDepth=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Static Water Lvl (Ft) [USER INPUT]</label>
            <input type="number" value="${wellSpec.staticWaterLevel}" oninput="wellSpec.staticWaterLevel=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Pump Setting (Ft) [USER INPUT]</label>
            <input type="number" value="${wellSpec.pumpSetting}" oninput="wellSpec.pumpSetting=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Pumping Water Lvl (Opt.) [USER INPUT]</label>
            <input type="number" value="${wellSpec.pumpingWaterLevel}" oninput="wellSpec.pumpingWaterLevel=this.value===''? '': parseFloat(this.value)" placeholder="Leave blank for est." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Well Yield (GPM) [USER INPUT]</label>
            <input type="number" value="${wellSpec.wellYield}" oninput="wellSpec.wellYield=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Pipe Diameter (ID)</label>
            <select onchange="wellSpec.pipeDiam=this.value" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
              <option value="1.049" ${wellSpec.pipeDiam==='1.049'?'selected':''}>1" Schedule 40 PVC (1.049" ID)</option>
              <option value="0.824" ${wellSpec.pipeDiam==='0.824'?'selected':''}>3/4" Schedule 40 PVC (0.824" ID)</option>
              <option value="1.380" ${wellSpec.pipeDiam==='1.380'?'selected':''}>1-1/4" Schedule 40 PVC (1.380" ID)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Horizontal Distance (Ft) [USER INPUT]</label>
            <input type="number" value="${wellSpec.horizontalDist}" oninput="wellSpec.horizontalDist=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Switch Cut-In (PSI) [USER INPUT]</label>
            <input type="number" value="${wellSpec.switchCutIn}" oninput="wellSpec.switchCutIn=parseFloat(this.value)||40" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Switch Cut-Out (PSI) [USER INPUT]</label>
            <input type="number" value="${wellSpec.switchCutOut}" oninput="wellSpec.switchCutOut=parseFloat(this.value)||60" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
          </div>
        </div>

        <div class="flex items-center space-x-2 pt-2">
          <input type="checkbox" id="comp-mode-check" ${comparisonMode?'checked':''} onchange="comparisonMode=this.checked; renderCalculatorSubTab();" class="rounded bg-slate-900 border-slate-700 text-blue-600">
          <label for="comp-mode-check" class="text-xs font-semibold text-cyan-300">Enable Pump Comparison Mode</label>
        </div>

        ${comparisonMode ? `
          <div class="bg-slate-950 p-3 rounded-xl border border-cyan-500/40 grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-1">Comparison Manufacturer</label>
              <select onchange="comparisonPumpB.manufacturer=this.value; let fams=Object.keys(masterPumpDatabase[comparisonPumpB.manufacturer]); comparisonPumpB.pumpFamily=fams[0]; let hps=Object.keys(masterPumpDatabase[comparisonPumpB.manufacturer][comparisonPumpB.pumpFamily]); comparisonPumpB.hp=hps[0]; renderCalculatorSubTab();" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-white text-xs">
                ${Object.keys(masterPumpDatabase).map(m => `<option value="${m}" ${comparisonPumpB.manufacturer===m?'selected':''}>${m}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-1">Comparison Family / HP</label>
              <select onchange="let parts=this.value.split('|'); comparisonPumpB.pumpFamily=parts[0]; comparisonPumpB.hp=parts[1]; renderCalculatorSubTab();" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-white text-xs">
                ${Object.keys(masterPumpDatabase[comparisonPumpB.manufacturer]).map(fam => {
                  let fObj = masterPumpDatabase[comparisonPumpB.manufacturer][fam];
                  return Object.keys(fObj).map(hp => `<option value="${fam}|${hp}" ${comparisonPumpB.pumpFamily===fam&&comparisonPumpB.hp===hp?'selected':''}>${fam} (${hp})</option>`).join('');
                }).join('')}
              </select>
            </div>
          </div>
        ` : ''}

        <button onclick="wfReportGenerated=true; renderCalculatorSubTab();" class="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2">
          <i data-lucide="file-text" class="w-4 h-4"></i> Run Manufacturer Curve Hydraulic Analysis
        </button>

        ${wfReportGenerated ? `
          <div class="bg-slate-950 p-5 rounded-2xl border border-cyan-500/40 space-y-4 animate-fadeIn">
            
            <div class="bg-slate-900 p-4 rounded-xl border border-blue-500/30 space-y-2">
              <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider">Selected Pump Summary Card</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-300">
                <div>Manufacturer: <b class="text-white">${wellSpec.manufacturer}</b> [USER INPUT]</div>
                <div>Series: <b class="text-white">${currentPumpObj.series}</b> [MANUFACTURER DATA]</div>
                <div>Family GPM: <b class="text-white">${currentPumpObj.familyGpm} GPM</b> [MANUFACTURER DATA]</div>
                <div>Horsepower: <b class="text-white">${wellSpec.hp}</b> [USER INPUT]</div>
                <div>Stages: <b class="text-white">${currentPumpObj.stages}</b> [MANUFACTURER DATA]</div>
                <div>Voltage: <b class="text-white">${currentPumpObj.voltage} V</b> [MANUFACTURER DATA]</div>
                <div>Motor Type: <b class="text-white">${currentPumpObj.motorType}</b> [MANUFACTURER DATA]</div>
                <div>Catalog Number: <b class="text-cyan-300">${currentPumpObj.catalogNumber}</b> [MANUFACTURER DATA]</div>
              </div>
              <p class="text-[10px] text-slate-400 italic mt-1">Curve Source: ${currentPumpObj.sourceDocument} (Page ${currentPumpObj.sourcePage}) [MANUFACTURER DATA]</p>
            </div>

            <div class="grid grid-cols-2 gap-4 text-xs">
              <div class="space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <p class="font-bold text-white">Well & Lift Data:</p>
                <p class="text-slate-400">• Total Depth: <b class="text-white">${wellSpec.totalDepth} ft [USER INPUT]</b></p>
                <p class="text-slate-400">• Static Water Level: <b class="text-white">${wellSpec.staticWaterLevel} ft [USER INPUT]</b></p>
                <p class="text-slate-400">• Pumping Water Level: <b class="text-white">${pumpingLevel.toFixed(1)} ft [${wellSpec.pumpingWaterLevel===''?'ESTIMATED FROM STATIC':'USER INPUT'}]</b></p>
                <p class="text-slate-400">• Pump Setting Depth: <b class="text-white">${wellSpec.pumpSetting} ft [USER INPUT]</b></p>
                <p class="text-slate-400">• Vertical Water Lift: <b class="text-cyan-400">${verticalLift.toFixed(1)} ft [CALCULATED]</b></p>
              </div>

              <div class="space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <p class="font-bold text-white">Pipe & System Friction:</p>
                <p class="text-slate-400">• Vertical Pipe: <b class="text-white">${wellSpec.pumpSetting} ft</b></p>
                <p class="text-slate-400">• Horizontal Pipe: <b class="text-white">${wellSpec.horizontalDist} ft</b></p>
                <p class="text-slate-400">• Total Pipe Length: <b class="text-white">${totalPipeLen} ft [CALCULATED]</b></p>
                <p class="text-slate-400">• Pipe ID: <b class="text-white">${wellSpec.pipeDiam}" Schedule 40 PVC [MANUFACTURER DATA]</b></p>
                <p class="text-slate-400">• Friction Loss (hf): <b class="text-cyan-400">${operatingFriction.toFixed(1)} ft [TABLE / INTERPOLATED]</b></p>
              </div>
            </div>

            <div class="bg-blue-950/40 p-4 rounded-xl border border-blue-500/30 flex justify-between items-center">
              <div>
                <p class="text-xs text-slate-400 uppercase font-semibold">Pump/System Operating Capability:</p>
                <p class="text-xl font-black text-emerald-400 mt-0.5">${operatingGpm.toFixed(1)} GPM @ ${operatingTdh.toFixed(1)} ft TDH [CALCULATED FROM CURVE INTERSECTION]</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-slate-400 uppercase font-semibold">Sustainable Well-Limited Flow:</p>
                <p class="text-sm font-bold text-cyan-300">${sustainableFlow.toFixed(1)} GPM max (Yield: ${wellSpec.wellYield} GPM)</p>
              </div>
            </div>

            ${comparisonMode ? `
              <div class="bg-slate-900 p-4 rounded-xl border border-amber-500/40 space-y-2">
                <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider">Pump Comparison Mode Results</h4>
                <div class="grid grid-cols-2 gap-4 text-xs">
                  <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <p class="font-bold text-white">Pump A: ${wellSpec.manufacturer}</p>
                    <p class="text-slate-400">Model: <b class="text-white">${currentPumpObj.model}</b></p>
                    <p class="text-slate-400">Operating Flow: <b class="text-emerald-400">${operatingGpm.toFixed(1)} GPM</b></p>
                    <p class="text-slate-400">Operating TDH: <b class="text-blue-400">${operatingTdh.toFixed(1)} ft</b></p>
                    <p class="text-slate-400">Shutoff Head: <b class="text-white">${currentPumpObj.shutoffHead} ft</b></p>
                  </div>
                  <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <p class="font-bold text-white">Pump B: ${comparisonPumpB.manufacturer}</p>
                    <p class="text-slate-400">Model: <b class="text-white">${compPumpObj.model}</b></p>
                    <p class="text-slate-400">Operating Flow: <b class="text-emerald-400">${compFlow60.toFixed(1)} GPM</b></p>
                    <p class="text-slate-400">Operating TDH: <b class="text-blue-400">${compTdh.toFixed(1)} ft</b></p>
                    <p class="text-slate-400">Shutoff Head: <b class="text-white">${compPumpObj.shutoffHead} ft</b></p>
                  </div>
                </div>
              </div>
            ` : ''}

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="border-b border-slate-800 text-slate-400">
                    <th class="py-2">System Pressure</th>
                    <th class="py-2">Pressure Head</th>
                    <th class="py-2">Friction Loss</th>
                    <th class="py-2">System TDH</th>
                    <th class="py-2">Operating Flow (Q)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td class="py-2 font-semibold text-white">40 PSI</td>
                    <td class="py-2">${(40*2.31).toFixed(1)} ft [CALCULATED]</td>
                    <td class="py-2">${((interpolateFrictionTable(flow40)*totalPipeLen)/100).toFixed(1)} ft [INTERPOLATED]</td>
                    <td class="py-2">${(verticalLift + (40*2.31) + ((interpolateFrictionTable(flow40)*totalPipeLen)/100)).toFixed(1)} ft [CALCULATED]</td>
                    <td class="py-2 font-bold text-emerald-400">${flow40.toFixed(1)} GPM [CURVE INTERSECTION]</td>
                  </tr>
                  <tr>
                    <td class="py-2 font-semibold text-white">50 PSI</td>
                    <td class="py-2">${(50*2.31).toFixed(1)} ft [CALCULATED]</td>
                    <td class="py-2">${((interpolateFrictionTable(flow50)*totalPipeLen)/100).toFixed(1)} ft [INTERPOLATED]</td>
                    <td class="py-2">${(verticalLift + (50*2.31) + ((interpolateFrictionTable(flow50)*totalPipeLen)/100)).toFixed(1)} ft [CALCULATED]</td>
                    <td class="py-2 font-bold text-emerald-400">${flow50.toFixed(1)} GPM [CURVE INTERSECTION]</td>
                  </tr>
                  <tr>
                    <td class="py-2 font-semibold text-white">60 PSI</td>
                    <td class="py-2">${(60*2.31).toFixed(1)} ft [CALCULATED]</td>
                    <td class="py-2">${((interpolateFrictionTable(flow60)*totalPipeLen)/100).toFixed(1)} ft [INTERPOLATED]</td>
                    <td class="py-2">${(verticalLift + (60*2.31) + ((interpolateFrictionTable(flow60)*totalPipeLen)/100)).toFixed(1)} ft [CALCULATED]</td>
                    <td class="py-2 font-bold text-emerald-400">${flow60.toFixed(1)} GPM [CURVE INTERSECTION]</td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${warnings.length > 0 ? `
              <div class="bg-rose-950/50 border border-rose-500/40 p-3 rounded-xl space-y-1">
                ${warnings.map(w => `<p class="text-xs font-semibold text-rose-300">${w}</p>`).join('')}
              </div>
            ` : ''}

            ${wellSpec.pumpingWaterLevel === '' ? `
              <p class="text-[11px] text-amber-400 italic">ℹ️ Source: Pumping Water Level: ${pumpingLevel.toFixed(1)} ft — Estimated from Static Water Level [ESTIMATED]</p>
            ` : ''}
          </div>
        ` : ''}

        ${renderCustomerExportSection('wellfriction')}
      </div>
    `;
  } else if (currentCalcTab === 'chlorination') {
    let radiusInches = chlorCasingDiam / 2;
    let wellGallonsPerFoot = 0.163 * Math.pow(radiusInches, 2);
    let waterColumnFeet = Math.max(0, chlorWellDepth - chlorStaticLevel);
    let wellWaterGallons = waterColumnFeet * wellGallonsPerFoot;
    
    let plumbingGallons = chlorPlumbingMode === 'small' ? 10 : chlorPlumbingMode === 'average' ? 20 : chlorPlumbingMode === 'large' ? 40 : chlorCustomPlum;
    let totalSystemGallons = wellWaterGallons + plumbingGallons;
    let requiredBleachQuarts = (totalSystemGallons * 0.00133);

    area.innerHTML = `
      <h3 class="text-lg font-bold text-white mb-4">Shock Chlorination Bleach Calculator</h3>
      <div class="space-y-4 max-w-xl">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Total Well Depth (Feet)</label>
            <input type="number" id="chlor-depth-input" value="${chlorWellDepth}" oninput="chlorWellDepth=parseFloat(this.value)||0; updateChlorDisplay()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Static Water Level (Feet)</label>
            <input type="number" id="chlor-static-input" value="${chlorStaticLevel}" oninput="chlorStaticLevel=parseFloat(this.value)||0; updateChlorDisplay()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Casing Diameter (Inches)</label>
          <select id="chlor-diam" onchange="chlorCasingDiam=parseFloat(this.value); renderCalculatorSubTab()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
            <option value="4" ${chlorCasingDiam===4?'selected':''}>4 Inches</option>
            <option value="6" ${chlorCasingDiam===6?'selected':''}>6 Inches (Standard)</option>
            <option value="8" ${chlorCasingDiam===8?'selected':''}>8 Inches</option>
            <option value="10" ${chlorCasingDiam===10?'selected':''}>10 Inches</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Home's Estimated Plumbing Volume</label>
          <select id="chlor-plum" onchange="chlorPlumbingMode=this.value; renderCalculatorSubTab()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
            <option value="small" ${chlorPlumbingMode==='small'?'selected':''}>Small Home (~10 Gal)</option>
            <option value="average" ${chlorPlumbingMode==='average'?'selected':''}>Average Home (~20 Gal)</option>
            <option value="large" ${chlorPlumbingMode==='large'?'selected':''}>Large Home (~40 Gal)</option>
            <option value="custom" ${chlorPlumbingMode==='custom'?'selected':''}>Custom Volume...</option>
          </select>
        </div>
        ${chlorPlumbingMode === 'custom' ? `
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Custom Plumbing Volume (Gallons)</label>
            <input type="number" id="chlor-custom-input" value="${chlorCustomPlum}" oninput="chlorCustomPlum=parseFloat(this.value)||0; updateChlorDisplay()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
          </div>
        ` : ''}
        <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-1">
          <p class="text-xs text-slate-400">Total System Water Volume: <b id="res-sys-gal" class="text-white">${totalSystemGallons.toFixed(1)} Gallons</b></p>
          <p class="text-xs text-slate-400">Required Household Bleach (5.25% Regular Chlorine):</p>
          <p id="res-bleach" class="text-xl font-bold text-blue-400 mt-1">${requiredBleachQuarts.toFixed(2)} Quarts (${(requiredBleachQuarts * 4).toFixed(1)} Cups)</p>
        </div>
        ${renderCustomerExportSection('chlorination')}
      </div>
    `;
  }
}

function updateCalcResultDisplay() {
  const resEl = document.getElementById('calc-result');
  if (resEl) {
    let vol = pipeLen * 0.0408 * Math.pow(parseFloat(pipeSize || 1), 2);
    resEl.innerText = `${vol.toFixed(2)} Gallons`;
  }
}

function updateChlorDisplay() {
  let radiusInches = chlorCasingDiam / 2;
  let wellGallonsPerFoot = 0.163 * Math.pow(radiusInches, 2);
  let waterColumnFeet = Math.max(0, chlorWellDepth - chlorStaticLevel);
  let wellWaterGallons = waterColumnFeet * wellGallonsPerFoot;
  let plumbingGallons = chlorPlumbingMode === 'small' ? 10 : chlorPlumbingMode === 'average' ? 20 : chlorPlumbingMode === 'large' ? 40 : chlorCustomPlum;
  let totalSystemGallons = wellWaterGallons + plumbingGallons;
  let requiredBleachQuarts = (totalSystemGallons * 0.00133);

  const rsg = document.getElementById('res-sys-gal');
  const rbl = document.getElementById('res-bleach');
  if (rsg) rsg.innerText = `${totalSystemGallons.toFixed(1)} Gallons`;
  if (rbl) rbl.innerText = `${requiredBleachQuarts.toFixed(2)} Quarts (${(requiredBleachQuarts * 4).toFixed(1)} Cups)`;
}

function exportCalculatorResult(calcKey) {
  let cust = customersList.find(c => c.id === targetCustomerId);
  if (!cust) { alert('Please select a valid customer.'); return; }

  if (!customerReports[targetCustomerId]) {
    customerReports[targetCustomerId] = {
      customerName: cust.name,
      address: cust.address,
      phone: cust.phone,
      email: cust.email,
      notes: '',
      sections: {}
    };
  }

  let textSummary = '';
  if (calcKey === 'pipe') {
    let vol = (pipeLen * 0.0408 * Math.pow(parseFloat(pipeSize || 1), 2)).toFixed(2);
    let waterWeight = vol * 8.34;
    textSummary = `Pipe Volume: ${pipeLen} ft, ${pipeSize}" ${pipeMat} (${pipeSubType}) = ${vol} Gallons (${waterWeight.toFixed(1)} lbs)`;
  } else if (calcKey === 'tank') {
    let tankResults = calculateTankStateResults();
    textSummary = `Pressure Tank Report (${tankResults.model}): Total Vol ${tankResults.totalVolume} gal, Switch ${tankResults.switchSetting} PSI, Precharge ${tankResults.precharge} PSI, Drawdown ${tankResults.drawdown} gal (${tankResults.percentage}%), Source: ${tankResults.dataSource}`;
  } else if (calcKey === 'wellfriction') {
    let activePump = getActivePumpObject(wellSpec);
    let pumpingLevel = wellSpec.pumpingWaterLevel !== '' ? parseFloat(wellSpec.pumpingWaterLevel) : wellSpec.staticWaterLevel;
    let verticalLift = Math.max(0, wellSpec.pumpSetting - pumpingLevel);
    let cutOutHead = wellSpec.switchCutOut * 2.31;
    let totalPipeLen = wellSpec.pumpSetting + wellSpec.horizontalDist;
    let operatingGpm = solveOperatingPoint(cutOutHead, verticalLift, totalPipeLen, activePump);
    let lossPer100 = interpolateFrictionTable(operatingGpm);
    let hf = (lossPer100 * totalPipeLen) / 100;
    let tdh = verticalLift + hf + cutOutHead;
    textSummary = `Manufacturer Curve Report (${activePump.model}): Well Depth ${wellSpec.totalDepth} ft, Static ${wellSpec.staticWaterLevel} ft, Setting ${wellSpec.pumpSetting} ft, Lift ${verticalLift.toFixed(1)} ft, TDH ${tdh.toFixed(1)} ft, Flow ${operatingGpm.toFixed(1)} GPM`;
  } else if (calcKey === 'chlorination') {
    let radiusInches = chlorCasingDiam / 2;
    let wellGalPerFt = 0.163 * Math.pow(radiusInches, 2);
    let waterCol = Math.max(0, chlorWellDepth - chlorStaticLevel);
    let wellGal = waterCol * wellGalPerFt;
    let plumGal = chlorPlumbingMode === 'small' ? 10 : chlorPlumbingMode === 'average' ? 20 : chlorPlumbingMode === 'large' ? 40 : chlorCustomPlum;
    let totalSysGal = wellGal + plumGal;
    let bleachQts = totalSysGal * 0.00133;
    textSummary = `Shock Chlorination: Well Depth ${chlorWellDepth} ft (${chlorCasingDiam}" Casing), Total System ${totalSysGal.toFixed(1)} Gal = ${bleachQts.toFixed(2)} Quarts Bleach`;
  }

  customerReports[targetCustomerId].sections[calcKey] = textSummary;
  alert(`Successfully exported calculation to ${cust.name}'s Master PDF Report!`);
}

function renderWizard() { 
  return `
    <div class="space-y-6 max-w-2xl mx-auto">
      <div class="border-b border-slate-700 pb-4">
        <h2 class="text-2xl font-black text-white flex items-center gap-2"><i data-lucide="sparkles" class="w-7 h-7 text-cyan-400"></i> Water Treatment Wizard</h2>
        <p class="text-sm text-slate-400">Configure water source parameters and generate equipment sizing recommendations.</p>
      </div>
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Water Source</label>
          <select id="wiz-source" onchange="wizSource=this.value" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
            <option value="Well" ${wizSource==='Well'?'selected':''}>Private Well</option>
            <option value="Municipal" ${wizSource==='Municipal'?'selected':''}>Municipal / City Water</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Hardness (GPG)</label>
            <input type="number" value="${wizHardness}" oninput="wizHardness=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">pH Level</label>
            <input type="number" step="0.1" value="${wizPh}" oninput="wizPh=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Iron (PPM)</label>
            <input type="number" step="0.1" value="${wizIron}" oninput="wizIron=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">TDS (PPM)</label>
            <input type="number" value="${wizTds}" oninput="wizTds=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Nitrates (PPM)</label>
            <input type="number" step="0.1" value="${wizNitrates}" oninput="wizNitrates=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Nitrites (PPM)</label>
            <input type="number" step="0.01" value="${wizNitrites}" oninput="wizNitrites=parseFloat(this.value)||0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm">
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Bacteria Test Result</label>
          <select id="wiz-bac" onchange="wizBacteria=this.value" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
            <option value="Pass" ${wizBacteria==='Pass'?'selected':''}>Pass (Safe)</option>
            <option value="Fail" ${wizBacteria==='Fail'?'selected':''}>Fail (Contaminated)</option>
          </select>
        </div>

        <button onclick="wizGenerated=true; render();" class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2">
          <i data-lucide="sparkles" class="w-4 h-4"></i> Generate Equipment Recommendations
        </button>

        ${wizGenerated ? `
          <div class="bg-slate-900/90 p-5 rounded-2xl border border-cyan-500/40 space-y-4 animate-fadeIn">
            <h4 class="text-sm font-bold text-cyan-400 uppercase tracking-wider">Detailed Treatment & Sizing Recommendations</h4>
            
            <div class="space-y-3 text-xs text-slate-300">
              <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <p class="font-bold text-white text-sm">1. Water Softener Sizing</p>
                <p class="mt-1">• Hardness: <b>${wizHardness} GPG</b> | Estimated Daily Capacity: <b>${wizHardness * 240} grains/day</b> (based on 4 occupants).</p>
                <p class="text-cyan-300 mt-1"><b>Recommendation:</b> ${wizHardness > 20 ? '48,000 to 64,000 grain high-capacity cabinet or twin-tank water softener with fine mesh resin.' : '32,000 grain standard metered water softener.'}</p>
              </div>

              <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <p class="font-bold text-white text-sm">2. Iron & Sediment Filtration</p>
                <p class="mt-1">• Iron Level: <b>${wizIron} PPM</b> | pH: <b>${wizPh}</b></p>
                <p class="text-cyan-300 mt-1"><b>Recommendation:</b> ${wizIron > 0.3 ? (wizPh < 6.8 ? 'AIO (Air Injection Oxidizing) Iron Filter + Acid Neutralizer Tank' : 'AIO Catalytic Carbon / Birm Iron Filter') : 'Standard 5-micron sediment pre-filter.'}</p>
              </div>

              <div class="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <p class="font-bold text-white text-sm">3. Disinfection & Safety</p>
                <p class="mt-1">• Bacteria Test: <span class="${wizBacteria==='Pass'?'text-emerald-400 font-bold':'text-rose-400 font-bold'}">${wizBacteria}</span></p>
                <p class="text-cyan-300 mt-1"><b>Recommendation:</b> ${wizBacteria === 'Fail' ? 'Shock chlorination required immediately followed by NSF-certified UV Disinfection System (12+ GPM).' : 'Optional UV Disinfection System for continuous well protection.'}</p>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `; 
}

function renderJobs() { 
  return `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div class="border-b border-slate-700 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-black text-white flex items-center gap-2"><i data-lucide="file-check" class="w-7 h-7 text-emerald-400"></i> Job Records & Invoices</h2>
          <p class="text-sm text-slate-400">Create and manage field service tickets and customer invoices.</p>
        </div>
        <button onclick="openNewJobModal()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow flex items-center gap-1.5">
          <i data-lucide="plus" class="w-4 h-4"></i> New Job Record
        </button>
      </div>

      <div id="new-job-form-container"></div>

      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        ${jobRecords.length === 0 ? '<p class="text-slate-400 text-sm">No job records available.</p>' : jobRecords.map(j => `
          <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h4 class="font-bold text-white text-base">${j.title}</h4>
              <p class="text-xs text-slate-400 mt-0.5">Customer: <span class="text-blue-400">${j.customer}</span> | Date: ${j.date}</p>
            </div>
            <span class="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 font-semibold">${j.status}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `; 
}

function openNewJobModal() {
  const container = document.getElementById('new-job-form-container');
  if (!container) return;
  container.innerHTML = `
    <div class="bg-slate-800 border border-emerald-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
      <h3 class="text-lg font-bold text-white">Create New Field Job Record</h3>
      <div>
        <label class="block text-xs font-semibold text-slate-400 mb-1">Service Title / Description</label>
        <input type="text" id="job-title-input" placeholder="e.g., Pump Replacement & Pressure Tank Install" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-400 mb-1">Customer Name</label>
        <select id="job-cust-input" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
          ${customersList.map(c => `<option value="${c.name}">${c.name} (${c.address})</option>`).join('')}
        </select>
      </div>
      <div class="flex gap-3">
        <button onclick="saveNewJob()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow">Save Job Record</button>
        <button onclick="document.getElementById('new-job-form-container').innerHTML=''" class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">Cancel</button>
      </div>
    </div>
  `;
}

function saveNewJob() {
  let title = document.getElementById('job-title-input').value.trim();
  let cust = document.getElementById('job-cust-input').value;
  if (!title) { alert('Please enter a job title.'); return; }
  jobRecords.push({
    id: Date.now(),
    title: title,
    customer: cust,
    date: new Date().toISOString().split('T')[0],
    status: 'In Progress'
  });
  document.getElementById('new-job-form-container').innerHTML = '';
  render();
}

function renderCustomers() { 
  let filtered = customersList.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || c.address.toLowerCase().includes(customerSearchQuery.toLowerCase()));
  return `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div class="border-b border-slate-700 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-black text-white flex items-center gap-2"><i data-lucide="users" class="w-7 h-7 text-amber-400"></i> Customer Database</h2>
          <p class="text-sm text-slate-400">Manage client profiles and equipment history.</p>
        </div>
        <button onclick="openAddCustomerModal()" class="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow flex items-center gap-1.5">
          <i data-lucide="plus" class="w-4 h-4"></i> Add Customer
        </button>
      </div>

      <div class="flex gap-2">
        <input type="text" id="cust-search" value="${customerSearchQuery}" oninput="customerSearchQuery=this.value; render()" placeholder="Search customers by name or address..." class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500">
      </div>

      <div id="add-customer-form-container"></div>

      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        ${filtered.length === 0 ? '<p class="text-slate-400 text-sm">No customers found.</p>' : filtered.map(c => `
          <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h4 class="font-bold text-white text-base">${c.name}</h4>
              <p class="text-xs text-slate-400 mt-1">📍 ${c.address}</p>
              <p class="text-xs text-slate-400 mt-0.5">📞 ${c.phone} | ✉️ ${c.email}</p>
            </div>
            <button onclick="activeReportCustomerId=${c.id}; switchTab('reports');" class="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-500/30">View Report</button>
          </div>
        `).join('')}
      </div>
    </div>
  `; 
}

function openAddCustomerModal() {
  const container = document.getElementById('add-customer-form-container');
  if (!container) return;
  container.innerHTML = `
    <div class="bg-slate-800 border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
      <h3 class="text-lg font-bold text-white">Add New Customer Profile</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" id="new-c-name" placeholder="Full Name" class="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
        <input type="text" id="new-c-phone" placeholder="Phone Number" class="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
        <input type="email" id="new-c-email" placeholder="Email Address" class="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
        <input type="text" id="new-c-address" placeholder="Service Address" class="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
      </div>
      <div class="flex gap-3">
        <button onclick="saveNewCustomer()" class="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow">Save Customer</button>
        <button onclick="document.getElementById('add-customer-form-container').innerHTML=''" class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">Cancel</button>
      </div>
    </div>
  `;
}

function saveNewCustomer() {
  let name = document.getElementById('new-c-name').value.trim();
  let phone = document.getElementById('new-c-phone').value.trim();
  let email = document.getElementById('new-c-email').value.trim();
  let address = document.getElementById('new-c-address').value.trim();
  if (!name) { alert('Customer name is required.'); return; }
  let newId = Date.now();
  customersList.push({ id: newId, name, phone, email, address });
  customerReports[newId] = { customerName: name, address, phone, email, notes: '', sections: {} };
  document.getElementById('add-customer-form-container').innerHTML = '';
  render();
}

function renderMasterReport() { 
  let rep = customerReports[activeReportCustomerId] || { customerName: 'Selected Customer', address: '', phone: '', email: '', notes: '', sections: {} };
  let filteredCustomers = customersList.filter(c => c.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || c.address.toLowerCase().includes(reportSearchQuery.toLowerCase()));

  return `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div class="flex items-center justify-between border-b border-slate-700 pb-4 flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-black text-white flex items-center gap-2"><i data-lucide="file-text" class="w-7 h-7 text-indigo-400"></i> Master PDF Report</h2>
          <p class="text-sm text-slate-400">Unified viewable and exportable service report for customer records.</p>
        </div>
        <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow flex items-center gap-2">
          <i data-lucide="printer" class="w-4 h-4"></i> Export / Print PDF
        </button>
      </div>

      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="w-full md:w-1/2 space-y-1">
          <label class="block text-xs font-semibold text-slate-400">Search Customer for Report</label>
          <input type="text" value="${reportSearchQuery}" oninput="reportSearchQuery=this.value; render()" placeholder="Type name or address to filter dropdown..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
        </div>
        <div class="w-full md:w-1/2 space-y-1">
          <label class="block text-xs font-semibold text-slate-400">Select Customer Report</label>
          <select id="report-customer-select" onchange="activeReportCustomerId=parseInt(this.value); render()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
            ${filteredCustomers.length === 0 ? '<option value="">No matching customers</option>' : filteredCustomers.map(c => `<option value="${c.id}" ${activeReportCustomerId===c.id?'selected':''}>${c.name} — ${c.address}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6 text-slate-200">
        <div class="border-b border-slate-700 pb-4 flex justify-between items-start flex-wrap gap-2">
          <div>
            <h3 class="text-xl font-black text-white">${rep.customerName}</h3>
            <p class="text-xs text-slate-400 mt-1">📍 ${rep.address}</p>
            <p class="text-xs text-slate-400 mt-0.5">📞 ${rep.phone} | ✉️ ${rep.email}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-blue-400 font-bold">${appSettings.companyName}</p>
            <p class="text-[10px] text-slate-400">Technician: ${appSettings.technicianName}</p>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-bold text-indigo-400 uppercase tracking-wider">Exported Calculator Data</h4>
          ${Object.keys(rep.sections).length === 0 ? '<p class="text-xs text-slate-400 italic">No calculator data exported to this report yet. Use the export section at the bottom of any calculator.</p>' : Object.values(rep.sections).map(s => `<div class="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs">${s}</div>`).join('')}
        </div>

        <div class="border-t border-slate-700 pt-4">
          <h4 class="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Field Service notes & Remarks</h4>
          <textarea oninput="if(customerReports[activeReportCustomerId]) customerReports[activeReportCustomerId].notes=this.value" placeholder="Enter service notes or recommendations..." class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs h-24">${rep.notes || ''}</textarea>
        </div>
      </div>
    </div>
  `; 
}

render();