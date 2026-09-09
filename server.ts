import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import * as XLSX from "xlsx";
import { INITIAL_BENEFICIARIES } from "./src/data/initialRecords";
import { INITIAL_USERS } from "./src/data/initialUsers";
import { INITIAL_BANK_MASTER, VILLAGES_LIST } from "./src/data/bankMaster";
import { BeneficiaryRow, AppUser, AuditLog, GoogleSheetConfig } from "./src/types";
import { normalizeVillageName, CANONICAL_29_VILLAGES } from "./src/utils/villageNormalizer";
import { normalizeSansadName, CANONICAL_16_SANSADS, isHeaderOrJunkSansad, sortSansads } from "./src/utils/sansadNormalizer";
import { formatKycDate } from "./src/utils/dateFormatter";

dotenv.config();

const app = express();
const PORT = 3000;

// Persistent Configuration and Cache File Paths
const CONFIG_FILE_PATH = path.join(process.cwd(), "google_sheet_config.json");
const BENEFICIARIES_FILE_PATH = path.join(process.cwd(), "beneficiaries_cache.json");

function loadSavedSheetConfig(): GoogleSheetConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        sheetUrl: parsed.sheetUrl || "",
        autoSync: parsed.autoSync !== false,
        lastSyncTimestamp: parsed.lastSyncTimestamp || "",
        totalRecords: Number(parsed.totalRecords || 0),
        villagesCount: Number(parsed.villagesCount || 0),
        sansadsCount: Number(parsed.sansadsCount || 0),
        savedAt: parsed.savedAt || "",
        updatedAt: parsed.updatedAt || ""
      };
    }
  } catch (err) {
    console.error("Failed to read google_sheet_config.json:", err);
  }
  return {
    sheetUrl: "",
    autoSync: true,
    lastSyncTimestamp: "",
    totalRecords: 0,
    villagesCount: 0,
    sansadsCount: 0,
    savedAt: "",
    updatedAt: ""
  };
}

function saveSheetConfig(config: Partial<GoogleSheetConfig>): GoogleSheetConfig {
  const existing = loadSavedSheetConfig();
  const updated: GoogleSheetConfig = {
    ...existing,
    ...config,
    updatedAt: new Date().toISOString()
  };
  if (!updated.savedAt && updated.sheetUrl) {
    updated.savedAt = new Date().toISOString();
  }
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write google_sheet_config.json:", err);
  }
  return updated;
}

function loadSavedBeneficiaries(): BeneficiaryRow[] | null {
  try {
    if (fs.existsSync(BENEFICIARIES_FILE_PATH)) {
      const raw = fs.readFileSync(BENEFICIARIES_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load cached beneficiaries from disk:", err);
  }
  return null;
}

function saveBeneficiariesToDisk(data: BeneficiaryRow[]) {
  try {
    fs.writeFileSync(BENEFICIARIES_FILE_PATH, JSON.stringify(data), "utf-8");
  } catch (err) {
    console.error("Failed to save beneficiaries to disk:", err);
  }
}

// In-Memory Database / Cache initialized from permanent disk storage if available
const initialDiskConfig = loadSavedSheetConfig();
const diskBeneficiaries = loadSavedBeneficiaries();

let beneficiariesCache: BeneficiaryRow[] = (diskBeneficiaries && diskBeneficiaries.length > 0)
  ? diskBeneficiaries
  : [...INITIAL_BENEFICIARIES];
let usersCache: AppUser[] = [...INITIAL_USERS];
let auditLogsCache: AuditLog[] = [];
let activeSyncedSheetUrl: string = initialDiskConfig.sheetUrl || "";
let lastSyncTimestamp: string = initialDiskConfig.lastSyncTimestamp || "";

// System Metrics
const serverStartTime = Date.now();
let totalApiRequests = 0;

/**
 * Intelligent AI & Heuristic Parser for Google Sheet & Excel rows
 * Maps field columns into canonical BeneficiaryRow format and
 * guarantees every village is normalized to the 29 Bathuary GP villages.
 */
function parseAndMapSheetRows(rawData: any[][]): BeneficiaryRow[] {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  // 1. Detect if row 0, 1, or 2 contains headers
  let headerRowIdx = -1;
  let colMap: Record<string, number> = {};

  for (let r = 0; r < Math.min(5, rawData.length); r++) {
    const row = rawData[r];
    if (!Array.isArray(row)) continue;
    const rowStr = row.map(c => String(c || '').toLowerCase().trim()).join(' ');
    if (
      rowStr.includes('job') || 
      rowStr.includes('card') || 
      rowStr.includes('sansad') || 
      rowStr.includes('village') || 
      rowStr.includes('aadhaar') ||
      rowStr.includes('applicant')
    ) {
      headerRowIdx = r;
      // Map column names to indices
      row.forEach((colVal, colIdx) => {
        const val = String(colVal || '').toLowerCase().trim();
        if (!val) return;
        if (val.includes('job') && (val.includes('card') || val.includes('no') || val.includes('num'))) colMap['colH'] = colIdx;
        else if (val.includes('applicant') && val.includes('name')) colMap['colJ'] = colIdx;
        else if (val === 'name' || val.includes('beneficiary') || val.includes('worker')) colMap['colJ'] = colIdx;
        else if (val.includes('father') || val.includes('husband')) colMap['colAF'] = colIdx;
        else if (val.includes('head') || val.includes('hoh')) colMap['colAG'] = colIdx;
        else if (val.includes('sansad') || val.includes('ward') || val.includes('part')) colMap['colB'] = colIdx;
        else if (val.includes('village') || val.includes('gram') || val.includes('mouza')) colMap['colV'] = colIdx;
        else if (val.includes('aadhaar') || val.includes('uid')) colMap['colP'] = colIdx;
        else if (val.includes('mobile') || val.includes('phone') || val.includes('contact')) colMap['colQ'] = colIdx;
        else if (val.includes('kyc') && (val.includes('date') || val.includes('dt') || val.includes('time') || val.includes('done on') || val.includes('day'))) colMap['colS'] = colIdx;
        else if (val.includes('kyc') || val.includes('e-kyc')) colMap['colR'] = colIdx;
        else if (val.includes('abps')) colMap['colO'] = colIdx;
        else if (val.includes('bank') && !val.includes('branch') && !val.includes('ifsc') && !val.includes('account')) colMap['colAO'] = colIdx;
        else if (val.includes('ifsc')) colMap['colAP'] = colIdx;
        else if (val.includes('branch')) colMap['colAQ'] = colIdx;
        else if (val.includes('account') || val.includes('a/c') || val.includes('ac no') || val.includes('acc no')) colMap['colAR'] = colIdx;
        else if (val.includes('remark') || val.includes('error') || val.includes('reason')) colMap['colT'] = colIdx;
        else if (val.includes('vle') || val.includes('officer') || val.includes('grs')) colMap['colU'] = colIdx;
      });
      break;
    }
  }

  const startIdx = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
  const parsed: BeneficiaryRow[] = [];

  for (let i = startIdx; i < rawData.length; i++) {
    const row = rawData[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    // Skip only if the entire row is completely empty or all cells are whitespace
    const hasAnyValue = row.some(c => c !== undefined && c !== null && String(c).trim() !== '');
    if (!hasAnyValue) continue;

    // Helper to get value either from detected header or positional index
    const get = (key: string, defaultIdx: number): string => {
      const idx = colMap[key] !== undefined ? colMap[key] : defaultIdx;
      return String(row[idx] ?? '').trim();
    };

    // Extract Job Card and Name
    let jobCard = get('colH', 7);
    let name = get('colJ', 9);
    const rawSansad = get('colB', 1);

    const nameUpper = name.toUpperCase();
    const jobCardUpper = jobCard.toUpperCase();

    // Skip only literal repeated column header rows (both name and jobCard are header labels)
    if (
      (nameUpper === 'NAME' || nameUpper === 'NAME OF APPLICANT' || nameUpper === 'BENEFICIARY NAME' || nameUpper === 'APPLICANT NAME') &&
      (jobCardUpper === 'JOB CARD' || jobCardUpper === 'JOB CARD NO' || jobCardUpper === 'REG NO' || jobCardUpper === 'JOB CARD NUMBER')
    ) {
      continue;
    }

    // If row has no name or jobcard in standard column, fallback to row number or identity without dropping
    if (!jobCard && !name) {
      const altAadhaar = get('colP', 15);
      const altSl = get('colA', 0);
      if (altAadhaar || altSl || rawSansad) {
        name = name || `Citizen #${parsed.length + 1}`;
        jobCard = jobCard || `WB-02-005-${String(parsed.length + 1).padStart(5, '0')}`;
      } else {
        continue;
      }
    }

    const rawVillage = get('colV', 21) || get('colV', 20) || 'BATHUARY';
    // Strictly normalize to one of the 29 canonical villages
    const normalizedVillage = normalizeVillageName(rawVillage, rawSansad);
    // Strictly normalize to one of the 16 canonical Sansads of Bathuary GP (BATHUARY 1 to BATHUARY 16)
    const normalizedSansad = normalizeSansadName(rawSansad, normalizedVillage) || 'BATHUARY 1';

    const rawKyc = get('colR', 17).toUpperCase();
    const isKycDone = rawKyc === 'YES' || rawKyc === 'Y' || rawKyc === 'DONE' || rawKyc === 'SUCCESS' || rawKyc === '1';

    const rawAbps = get('colO', 14).toUpperCase();
    const isAbpsActive = rawAbps === 'YES' || rawAbps === 'Y' || rawAbps === 'ENABLED' || rawAbps === '1';

    const aadhaarClean = get('colP', 15).replace(/\D/g, '');
    const mobileClean = get('colQ', 16).replace(/\D/g, '');

    const record: BeneficiaryRow = {
      rowIndex: parsed.length + 2,
      colA: get('colA', 0) || String(parsed.length + 1),
      colB: normalizedSansad,
      colC: get('colC', 2) || String(parsed.length + 1),
      colD: get('colD', 3) || 'PURBA MEDINIPUR',
      colE: get('colE', 4) || 'EGRA-II',
      colF: get('colF', 5) || 'BATHUARY',
      colH: jobCard || `WB-14-012-005-001/${10000 + parsed.length}`,
      colI: get('colI', 8) || '1',
      colJ: (name || 'BENEFICIARY').toUpperCase(),
      colK: get('colK', 10) || 'MALE',
      colL: get('colL', 11) || name || '',
      colM: get('colM', 12) || 'Yes',
      colN: get('colN', 13) || 'Yes',
      colO: isAbpsActive ? 'Yes' : 'No',
      colP: aadhaarClean,
      colQ: mobileClean,
      colR: isKycDone ? 'Yes' : 'No',
      colS: formatKycDate(get('colS', 18)) || (isKycDone ? new Date().toLocaleDateString('en-GB') : ''),
      colT: get('colT', 19) || '',
      colU: get('colU', 20) || 'SK DAVID, VLE',
      colV: normalizedVillage,
      colW: get('colW', 22) || 'Yes',
      colX: get('colX', 23) || '',
      colAF: get('colAF', 31).toUpperCase(),
      colAG: get('colAG', 32).toUpperCase() || (name || '').toUpperCase(),
      ...(() => {
        let bankName = get('colAO', 40).trim().toUpperCase();
        let ifscCode = get('colAP', 41).trim().toUpperCase();
        let branchName = get('colAQ', 42).trim().toUpperCase();
        const accountNo = get('colAR', 43).trim();

        // Detect if ifscCode and branchName are swapped
        const isBranchAnIfsc = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(branchName) || INITIAL_BANK_MASTER.some(b => b.ifsc === branchName);
        const isIfscABranch = ifscCode.includes('BRANCH') || ifscCode.includes('MAIN') || ifscCode.includes('BAZAR') || ifscCode.includes('RURAL') || ifscCode.includes('MIDNAPORE');

        if (isBranchAnIfsc || isIfscABranch) {
          const temp = ifscCode;
          ifscCode = branchName;
          branchName = temp;
        }

        // Cross-reference with INITIAL_BANK_MASTER for auto-fill
        const matched = INITIAL_BANK_MASTER.find(b => b.ifsc === ifscCode);
        if (matched) {
          if (!bankName || bankName === '—') bankName = matched.bank;
          if (!branchName || branchName === '—') branchName = matched.branch;
        }

        return {
          colAO: bankName,
          colAP: ifscCode,
          colAQ: branchName,
          colAR: accountNo
        };
      })()
    };

    parsed.push(record);
  }

  return parsed;
}

// Middleware
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Rate Limiter
const ipRequestCounts: { [ip: string]: { count: number; resetTime: number } } = {};
const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  totalApiRequests++;
  const ip = req.ip || req.socket.remoteAddress || "anonymous";
  const now = Date.now();
  if (!ipRequestCounts[ip] || now > ipRequestCounts[ip].resetTime) {
    ipRequestCounts[ip] = { count: 1, resetTime: now + 60000 };
    return next();
  }
  ipRequestCounts[ip].count++;
  if (ipRequestCounts[ip].count > 180) {
    return res.status(429).json({
      status: "error",
      message: "Rate limit exceeded. Please wait a minute before making more requests."
    });
  }
  next();
};

app.use("/api", rateLimiter);

// Optional Server-side Gemini AI Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ----------------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------------

// Health & Monitoring
app.get("/api/health", (req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
  res.json({
    status: "ok",
    app: "Bathuary Gram Panchayat Portal",
    uptimeSeconds,
    totalRequests: totalApiRequests,
    totalBeneficiaries: beneficiariesCache.length,
    usersCount: usersCache.length,
    lastSyncTimestamp,
    memoryUsage: process.memoryUsage()
  });
});

// ----------------------------------------------------------------------------
/**
 * Core Google Sheet Fetcher & Parser
 * Handles public links, export CSV, gviz endpoints, and auth redirects
 */
async function fetchAndParseGoogleSheet(rawUrl: string): Promise<{
  beneficiaries: BeneficiaryRow[];
  uniqueVillages: string[];
  uniqueSansads: string[];
  sheetId: string;
}> {
  const trimmedUrl = rawUrl.trim();

  if (trimmedUrl.includes("script.google.com")) {
    throw new Error("You provided a Google Apps Script link. Please use your Google Spreadsheet link (https://docs.google.com/spreadsheets/d/.../edit).");
  }

  // 1. Extract GID (Sheet tab)
  let gid = "0";
  const gidMatch = trimmedUrl.match(/[#&?]gid=([0-9]+)/);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  // 2. Extract Document ID or Web Publish ID
  let sheetId = "";
  const pubMatch = trimmedUrl.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  const docMatch = trimmedUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

  if (pubMatch) {
    sheetId = pubMatch[1];
  } else if (docMatch) {
    sheetId = docMatch[1];
  } else {
    sheetId = trimmedUrl;
  }

  if (!sheetId || sheetId.length < 8) {
    throw new Error("Invalid Google Sheet link. Please copy the full link from your browser address bar (e.g. https://docs.google.com/spreadsheets/d/.../edit).");
  }

  // URLs to try in priority order
  const candidateUrls = pubMatch 
    ? [
        `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv`
      ]
    : [
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`
      ];

  let csvContent = "";
  let isHtmlAuthPage = false;
  let lastError = "";

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*"
        },
        redirect: "follow"
      });
      clearTimeout(timer);

      if (response.ok) {
        const bodyText = await response.text();
        if (bodyText.includes("<html") || bodyText.includes("<!DOCTYPE") || bodyText.includes("accounts.google.com")) {
          isHtmlAuthPage = true;
          lastError = 'Could not access Google Sheet. Please check "Share" > "Anyone with the link can view".';
          continue;
        }

        if (bodyText.trim().length > 20) {
          csvContent = bodyText;
          break;
        }
      } else {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (fetchErr: any) {
      lastError = fetchErr.message;
    }
  }

  if (!csvContent) {
    throw new Error(
      isHtmlAuthPage
        ? 'Could not access Google Sheet. Please click "Share" on your Google Sheet and set "Anyone with the link can view".'
        : (lastError || 'Could not connect to Google Sheet. Please verify link and internet connectivity.')
    );
  }

  // Parse the fetched CSV data
  const workbook = XLSX.read(csvContent, { type: "string" });
  const sheetName = workbook.SheetNames[0];
  const sheetData: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  const beneficiaries = parseAndMapSheetRows(sheetData);

  if (beneficiaries.length === 0) {
    throw new Error("Google Sheet was reached, but no Job Card records were found. Please verify column headers.");
  }

  const uniqueVillages = Array.from(new Set(beneficiaries.map(b => b.colV))).filter(Boolean);
  const uniqueSansads = sortSansads(
    Array.from(new Set(beneficiaries.map(b => b.colB)))
      .filter(s => s && !isHeaderOrJunkSansad(s))
  );

  return {
    beneficiaries,
    uniqueVillages,
    uniqueSansads,
    sheetId
  };
}

// Background startup sync
if (initialDiskConfig.sheetUrl && initialDiskConfig.autoSync !== false) {
  setTimeout(async () => {
    try {
      console.log(`[Auto-Sync] Attempting background sync from permanent Google Sheet: ${initialDiskConfig.sheetUrl}`);
      const res = await fetchAndParseGoogleSheet(initialDiskConfig.sheetUrl);
      if (res.beneficiaries && res.beneficiaries.length > 0) {
        beneficiariesCache = res.beneficiaries;
        lastSyncTimestamp = new Date().toISOString();
        saveBeneficiariesToDisk(beneficiariesCache);
        saveSheetConfig({
          lastSyncTimestamp,
          totalRecords: beneficiariesCache.length,
          villagesCount: res.uniqueVillages.length,
          sansadsCount: res.uniqueSansads.length
        });
        console.log(`[Auto-Sync] Successfully loaded ${beneficiariesCache.length} records on startup.`);
      }
    } catch (err: any) {
      console.warn("[Auto-Sync] Startup background sync notice:", err.message);
    }
  }, 2500);
}

// ----------------------------------------------------------------------------
// Google Sheet Live Sync & Permanent Persistence Endpoints
// ----------------------------------------------------------------------------
app.get("/api/google-sheet/status", (req: Request, res: Response) => {
  const cfg = loadSavedSheetConfig();
  res.json({
    status: "success",
    syncedSheetUrl: activeSyncedSheetUrl || cfg.sheetUrl || "",
    isSaved: !!(cfg.sheetUrl && cfg.sheetUrl.trim().length > 0),
    totalRecords: beneficiariesCache.length,
    villagesCount: new Set(beneficiariesCache.map(b => b.colV)).size,
    lastSyncTimestamp: lastSyncTimestamp || cfg.lastSyncTimestamp || ""
  });
});

app.get("/api/google-sheet/config", (req: Request, res: Response) => {
  const cfg = loadSavedSheetConfig();
  res.json({
    status: "success",
    isSaved: !!(cfg.sheetUrl && cfg.sheetUrl.trim().length > 0),
    config: {
      ...cfg,
      sheetUrl: activeSyncedSheetUrl || cfg.sheetUrl || "",
      lastSyncTimestamp: lastSyncTimestamp || cfg.lastSyncTimestamp || "",
      totalRecords: beneficiariesCache.length,
      villagesCount: new Set(beneficiariesCache.map(b => b.colV)).size,
      sansadsCount: new Set(beneficiariesCache.map(b => b.colB)).size
    }
  });
});

// Permanent Save Endpoint
app.post("/api/google-sheet/save-link", async (req: Request, res: Response) => {
  try {
    const { sheetUrl, autoSync = true, syncNow = true } = req.body;
    if (!sheetUrl || typeof sheetUrl !== "string" || sheetUrl.trim().length < 8) {
      return res.status(400).json({
        status: "error",
        message: "অনুগ্রহ করে একটি সঠিক গুগল স্প্রেডশীট লিঙ্ক দিন (Please provide a valid Google Sheet URL)."
      });
    }

    const trimmedUrl = sheetUrl.trim();

    // Persist configuration to disk immediately
    saveSheetConfig({
      sheetUrl: trimmedUrl,
      autoSync: autoSync !== false
    });
    activeSyncedSheetUrl = trimmedUrl;

    if (syncNow) {
      const syncResult = await fetchAndParseGoogleSheet(trimmedUrl);
      beneficiariesCache = syncResult.beneficiaries;
      lastSyncTimestamp = new Date().toISOString();

      saveBeneficiariesToDisk(beneficiariesCache);
      const updatedConfig = saveSheetConfig({
        sheetUrl: trimmedUrl,
        autoSync: autoSync !== false,
        lastSyncTimestamp,
        totalRecords: beneficiariesCache.length,
        villagesCount: syncResult.uniqueVillages.length,
        sansadsCount: syncResult.uniqueSansads.length
      });

      auditLogsCache.unshift({
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        jobCardNumber: `GSHEET-PERMANENT-SAVED`,
        beneficiaryName: `Permanent Sheet: ${beneficiariesCache.length} Records Saved`,
        updatedBy: "Google Sheet Permanent Save"
      });

      return res.json({
        status: "success",
        message: `গুগল শীট লিঙ্ক স্থায়ীভাবে সেভ ও লাইভ সিঙ্ক সফল হয়েছে! মোট ${beneficiariesCache.length} জন নাগরিকের তথ্য সংরক্ষিত।`,
        isSaved: true,
        config: updatedConfig,
        total: beneficiariesCache.length,
        villagesCount: syncResult.uniqueVillages.length,
        sansadsCount: syncResult.uniqueSansads.length,
        beneficiaries: beneficiariesCache
      });
    } else {
      const updatedConfig = loadSavedSheetConfig();
      return res.json({
        status: "success",
        message: "গুগল শীট লিঙ্ক স্থায়ীভাবে সংরক্ষণ করা হয়েছে (Google Sheet link permanently saved).",
        isSaved: true,
        config: updatedConfig
      });
    }
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to save Google Sheet link"
    });
  }
});

// Clear Permanent Link
app.post("/api/google-sheet/clear-link", (req: Request, res: Response) => {
  try {
    saveSheetConfig({
      sheetUrl: "",
      totalRecords: 0,
      villagesCount: 0,
      sansadsCount: 0,
      lastSyncTimestamp: ""
    });
    activeSyncedSheetUrl = "";

    auditLogsCache.unshift({
      timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      jobCardNumber: `GSHEET-LINK-CLEARED`,
      beneficiaryName: `Permanent Google Sheet Link Removed`,
      updatedBy: "System Config"
    });

    res.json({
      status: "success",
      message: "গুগল শীট লিঙ্ক স্থায়ী মেমরি থেকে সফলভাবে মুছে ফেলা হয়েছে (Saved Google Sheet link cleared)."
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to clear saved Google Sheet link"
    });
  }
});

app.get("/api/sync-google-sheet", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Google Sheet Sync API is ready. Send a POST request with { sheetUrl }."
  });
});

app.post("/api/sync-google-sheet", async (req: Request, res: Response) => {
  try {
    const { sheetUrl } = req.body;
    if (!sheetUrl || typeof sheetUrl !== "string") {
      return res.status(400).json({ 
        status: "error", 
        message: "Please provide a valid Google Sheet URL or spreadsheet link." 
      });
    }

    const trimmedUrl = sheetUrl.trim();
    const syncResult = await fetchAndParseGoogleSheet(trimmedUrl);

    beneficiariesCache = syncResult.beneficiaries;
    activeSyncedSheetUrl = trimmedUrl;
    lastSyncTimestamp = new Date().toISOString();

    // Persist to disk
    saveBeneficiariesToDisk(beneficiariesCache);
    saveSheetConfig({
      sheetUrl: trimmedUrl,
      lastSyncTimestamp,
      totalRecords: beneficiariesCache.length,
      villagesCount: syncResult.uniqueVillages.length,
      sansadsCount: syncResult.uniqueSansads.length
    });

    auditLogsCache.unshift({
      timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      jobCardNumber: `GSHEET-SYNC-${beneficiariesCache.length}`,
      beneficiaryName: `${beneficiariesCache.length} Records (${syncResult.uniqueVillages.length} Villages, ${syncResult.uniqueSansads.length} Sansads)`,
      updatedBy: "Google Sheet Live Sync"
    });

    res.json({
      status: "success",
      message: `Google Sheet Successfully Synced! Loaded ${beneficiariesCache.length} verified citizen records across ${syncResult.uniqueVillages.length} villages and ${syncResult.uniqueSansads.length} Sansads.`,
      total: beneficiariesCache.length,
      villagesCount: syncResult.uniqueVillages.length,
      sansadsCount: syncResult.uniqueSansads.length,
      sheetUrl: activeSyncedSheetUrl,
      lastSync: lastSyncTimestamp,
      beneficiaries: beneficiariesCache
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to synchronize Google Sheet"
    });
  }
});

// Auto-Link and Active Google Sheet configuration
app.get("/api/google-sheet/active-link", (req: Request, res: Response) => {
  const cfg = loadSavedSheetConfig();
  res.json({
    status: "success",
    activeUrl: activeSyncedSheetUrl || cfg.sheetUrl || "",
    isSaved: !!(cfg.sheetUrl && cfg.sheetUrl.trim().length > 0),
    lastSync: lastSyncTimestamp || cfg.lastSyncTimestamp || "",
    totalRecords: beneficiariesCache.length
  });
});


// Beneficiaries List
app.get("/api/beneficiaries", (req: Request, res: Response) => {
  const sansad = req.query.sansad as string;
  const village = req.query.village as string;
  let result = beneficiariesCache;

  if (sansad && sansad !== "ALL") {
    result = result.filter(r => r.colB === sansad);
  }
  if (village && village !== "ALL") {
    result = result.filter(r => r.colV === village);
  }

  res.json({
    status: "success",
    total: result.length,
    beneficiaries: result,
    sansadList: (() => {
      const computed = sortSansads(
        Array.from(new Set(beneficiariesCache.map(b => b.colB)))
          .filter(s => s && !isHeaderOrJunkSansad(s))
      );
      return computed.length > 0 ? computed : (CANONICAL_16_SANSADS as unknown as string[]);
    })(),
    villageList: Array.from(new Set(beneficiariesCache.map(b => b.colV).filter(Boolean))).sort(),
    jobCards: Array.from(new Set(beneficiariesCache.map(b => b.colH).filter(Boolean))).sort(),
    aadhaarList: Array.from(new Set(beneficiariesCache.map(b => b.colP).filter(Boolean))).sort()
  });
});

// Update Beneficiary Record
app.post("/api/beneficiaries/update", async (req: Request, res: Response) => {
  try {
    const formData = req.body;
    const rowIndex = parseInt(formData.rowIndex, 10);
    
    if (isNaN(rowIndex) || rowIndex < 2) {
      return res.status(400).json({ status: "error", message: "Invalid row index" });
    }

    // Input Validation
    if (formData.colP && !/^\d{12}$/.test(formData.colP.trim())) {
      return res.status(400).json({ status: "error", message: "Aadhaar must be exactly 12 digits" });
    }
    if (formData.colQ && !/^\d{10}$/.test(formData.colQ.trim())) {
      return res.status(400).json({ status: "error", message: "Mobile number must be exactly 10 digits" });
    }

    const idx = rowIndex - 2;
    if (idx >= 0 && idx < beneficiariesCache.length) {
      beneficiariesCache[idx] = {
        ...beneficiariesCache[idx],
        colP: formData.colP || beneficiariesCache[idx].colP,
        colQ: formData.colQ || beneficiariesCache[idx].colQ,
        colR: formData.colR || beneficiariesCache[idx].colR,
        colS: formData.colS || beneficiariesCache[idx].colS,
        colT: formData.colT ?? beneficiariesCache[idx].colT,
        colU: formData.colU || beneficiariesCache[idx].colU,
        colV: formData.colV || beneficiariesCache[idx].colV,
        colW: formData.colW || beneficiariesCache[idx].colW,
        colX: formData.colX ?? beneficiariesCache[idx].colX,
        colAO: formData.colAO || beneficiariesCache[idx].colAO,
        colAP: formData.colAP || beneficiariesCache[idx].colAP,
        colAQ: formData.colAQ || beneficiariesCache[idx].colAQ,
        colAR: formData.colAR || beneficiariesCache[idx].colAR
      };

      // Add to audit trail
      const auditLog: AuditLog = {
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        jobCardNumber: beneficiariesCache[idx].colH,
        beneficiaryName: beneficiariesCache[idx].colJ,
        updatedBy: formData.updatedBy || "9002736997 (VB-G RAM G)"
      };
      auditLogsCache.unshift(auditLog);
      if (auditLogsCache.length > 200) auditLogsCache.pop();

      // Direct Google Sheet Row Link Generator
      let googleSheetRowUrl = "";
      if (activeSyncedSheetUrl) {
        const docMatch = activeSyncedSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        const gidMatch = activeSyncedSheetUrl.match(/[#&?]gid=([0-9]+)/);
        const sheetId = docMatch ? docMatch[1] : "";
        const gid = gidMatch ? gidMatch[1] : "0";
        if (sheetId) {
          googleSheetRowUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=${gid}&range=A${rowIndex}:AR${rowIndex}`;
        }
      }

      saveBeneficiariesToDisk(beneficiariesCache);

      return res.json({
        status: "success",
        message: "Data saved and verified successfully in database!",
        googleSheetRowUrl,
        record: beneficiariesCache[idx]
      });
    } else {
      return res.status(404).json({ status: "error", message: "Beneficiary record not found" });
    }
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message || "Failed to update record" });
  }
});

// Public Citizen Search
app.post("/api/search", (req: Request, res: Response) => {
  const query = (req.body.query || "").toString().trim().toLowerCase();
  if (!query) {
    return res.json({ status: "success", count: 0, results: [] });
  }

  const results = beneficiariesCache.filter(item => {
    const jc = item.colH.toLowerCase();
    const name = item.colJ.toLowerCase();
    const aadhaar = item.colP.toLowerCase();
    const phone = item.colQ.toLowerCase();
    const sansad = item.colB.toLowerCase();
    const village = item.colV.toLowerCase();
    return (
      jc.includes(query) ||
      name.includes(query) ||
      aadhaar.includes(query) ||
      phone.includes(query) ||
      sansad.includes(query) ||
      village.includes(query)
    );
  }).slice(0, 50);

  res.json({
    status: "success",
    count: results.length,
    results
  });
});

// Dashboard Analytics
app.get("/api/dashboard-stats", (req: Request, res: Response) => {
  const sansad = req.query.sansad as string;
  let items = beneficiariesCache;

  if (sansad && sansad !== "ALL") {
    items = items.filter(r => r.colB === sansad);
  }

  const total = items.length;
  let done = 0;
  let pending = 0;
  let death = 0;
  let abpsActive = 0;
  let aadhaarSeeded = 0;

  items.forEach(row => {
    const kyc = (row.colR || "").toUpperCase();
    const err = (row.colT || "").toLowerCase();
    const abps = (row.colO || "").toUpperCase();

    if (kyc === "YES" || kyc === "Y") {
      done++;
    } else if (err.includes("death") || err.includes("expired") || err.includes("died")) {
      death++;
    } else {
      pending++;
    }

    if (abps === "YES" || abps === "Y") abpsActive++;
    if (row.colP && row.colP.length === 12) aadhaarSeeded++;
  });

  const donePct = total ? Math.round((done / total) * 100) : 0;
  const pendingPct = total ? Math.round((pending / total) * 100) : 0;
  const deathPct = total ? Math.round((death / total) * 100) : 0;

  // Village-level breakdown (Guaranteed strictly 29 Bathuary GP Villages)
  const villageStatsMap: { [v: string]: { village: string; sansad: string; total: number; done: number; pending: number; death: number } } = {};
  
  // Pre-populate all 29 canonical villages
  CANONICAL_29_VILLAGES.forEach(v => {
    villageStatsMap[v] = { village: v, sansad: "", total: 0, done: 0, pending: 0, death: 0 };
  });

  items.forEach(row => {
    const v = normalizeVillageName(row.colV, row.colB);
    if (!villageStatsMap[v]) {
      villageStatsMap[v] = { village: v, sansad: row.colB || "", total: 0, done: 0, pending: 0, death: 0 };
    }
    villageStatsMap[v].total++;
    const kyc = (row.colR || "").toUpperCase();
    const err = (row.colT || "").toLowerCase();
    if (kyc === "YES" || kyc === "Y") {
      villageStatsMap[v].done++;
    } else if (err.includes("death") || err.includes("expired") || err.includes("died")) {
      villageStatsMap[v].death++;
    } else {
      villageStatsMap[v].pending++;
    }
  });

  const villageStats = CANONICAL_29_VILLAGES.map(vName => villageStatsMap[vName] || {
    village: vName,
    sansad: "",
    total: 0,
    done: 0,
    pending: 0,
    death: 0
  }).sort((a, b) => b.total - a.total);

  res.json({
    status: "success",
    total,
    done,
    pending,
    death,
    donePct,
    pendingPct,
    deathPct,
    abpsActive,
    aadhaarSeeded,
    villageStats
  });
});

// Bulk Import Beneficiaries from Excel/CSV or Google Sheet
app.post("/api/beneficiaries/import", (req: Request, res: Response) => {
  const { beneficiaries } = req.body;
  if (!Array.isArray(beneficiaries) || beneficiaries.length === 0) {
    return res.status(400).json({ status: "error", message: "No beneficiary data provided" });
  }

  // Normalize each record's village and Sansad strictly
  const normalizedRecords = beneficiaries.map((b: BeneficiaryRow) => {
    const v = normalizeVillageName(b.colV, b.colB);
    const s = normalizeSansadName(b.colB, v);
    return {
      ...b,
      colV: v,
      colB: s
    };
  });

  beneficiariesCache = normalizedRecords;
  lastSyncTimestamp = new Date().toISOString();
  saveBeneficiariesToDisk(beneficiariesCache);

  const villages = Array.from(new Set(normalizedRecords.map((b: BeneficiaryRow) => b.colV).filter(Boolean)));
  const sansads = Array.from(new Set(normalizedRecords.map((b: BeneficiaryRow) => b.colB).filter(Boolean)))
    .filter(s => (CANONICAL_16_SANSADS as readonly string[]).includes(s));

  saveSheetConfig({
    totalRecords: normalizedRecords.length,
    villagesCount: villages.length,
    sansadsCount: sansads.length,
    lastSyncTimestamp
  });

  // Add audit record
  auditLogsCache.unshift({
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    jobCardNumber: `BULK-IMPORT-${normalizedRecords.length}`,
    beneficiaryName: `${villages.length} Villages Master Update`,
    updatedBy: "System Master Sync"
  });

  res.json({
    status: "success",
    message: `Successfully synchronized ${normalizedRecords.length} records covering ${villages.length} villages`,
    total: normalizedRecords.length,
    villagesCount: villages.length,
    sansadsCount: sansads.length
  });
});

// Bank Master Data
app.get("/api/bank-master", (req: Request, res: Response) => {
  res.json({
    status: "success",
    banks: INITIAL_BANK_MASTER
  });
});

// Audit Logs
app.get("/api/audit-logs", (req: Request, res: Response) => {
  res.json({
    status: "success",
    logs: auditLogsCache
  });
});

// Users & Authentication
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: "error", message: "Mobile number and password required" });
  }

  const cleanUser = username.toString().trim();
  const cleanPass = password.toString().trim();

  // Master Admin direct check from user's provided code
  if (
    (cleanUser === "9002736997" && (cleanPass === "Madan#&2580" || cleanPass === "Admin@12345")) ||
    (cleanUser.toLowerCase() === "admin" && (cleanPass === "admin123" || cleanPass === "Admin@12345"))
  ) {
    const adminUser: AppUser = {
      mobile: "9002736997",
      userId: "9002736997",
      name: "Bathuary Gram Panchayat (VB-G RAM G)",
      role: "ADMIN",
      designation: "Administrator / Executive Assistant",
      email: "bathuarygp@gmail.com",
      status: "Active"
    };
    return res.json({
      status: "success",
      token: `jwt_sim_${Date.now()}_9002736997`,
      user: adminUser
    });
  }

  const user = usersCache.find(
    u => (u.mobile === cleanUser || u.userId === cleanUser) && u.password === cleanPass
  );

  if (user) {
    const { password: _, ...safeUser } = user;
    return res.json({
      status: "success",
      token: `jwt_sim_${Date.now()}_${user.mobile}`,
      user: safeUser
    });
  }

  return res.status(401).json({ status: "error", message: "Invalid mobile number or password." });
});

// Users Management (Admin only)
app.get("/api/users", (req: Request, res: Response) => {
  const safeUsers = usersCache.map(u => {
    const { password: _, ...rest } = u;
    return rest;
  });
  res.json({ status: "success", users: safeUsers });
});

app.post("/api/users", (req: Request, res: Response) => {
  const newUser = req.body;
  if (!newUser.mobile || !newUser.name) {
    return res.status(400).json({ status: "error", message: "Mobile and Name are required" });
  }

  const existingIdx = usersCache.findIndex(u => u.mobile === newUser.mobile);
  if (existingIdx !== -1) {
    usersCache[existingIdx] = { ...usersCache[existingIdx], ...newUser };
  } else {
    usersCache.push({
      sl: usersCache.length + 1,
      mobile: newUser.mobile,
      userId: newUser.mobile,
      name: newUser.name,
      role: newUser.role || "OFFICER",
      designation: newUser.designation || "Staff",
      password: newUser.password || "123456",
      email: newUser.email || "",
      assignedVillages: newUser.assignedVillages || "ALL",
      status: "Active",
      totalUpdates: 0,
      updatedAt: new Date().toISOString()
    });
  }

  res.json({ status: "success", message: "User account saved successfully!" });
});

app.delete("/api/users/:mobile", (req: Request, res: Response) => {
  const mobile = req.params.mobile;
  if (mobile === "9002736997") {
    return res.status(400).json({ status: "error", message: "Cannot delete master administrator account!" });
  }
  usersCache = usersCache.filter(u => u.mobile !== mobile);
  res.json({ status: "success", message: "User deleted successfully" });
});

// ----------------------------------------------------------------------------
// Artificial Intelligence Endpoint (Gemini API Server-Side)
// ----------------------------------------------------------------------------
app.post("/api/ai/audit", async (req: Request, res: Response) => {
  const { beneficiary } = req.body;
  if (!beneficiary) {
    return res.status(400).json({ status: "error", message: "Beneficiary record required" });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Local rules-based AI intelligence check
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!beneficiary.colP || !/^\d{12}$/.test(beneficiary.colP)) {
      issues.push("Aadhaar number is missing or does not contain 12 digits.");
    }
    if (!beneficiary.colQ || !/^\d{10}$/.test(beneficiary.colQ)) {
      issues.push("Worker mobile phone number is invalid (must be 10 digits).");
    }
    if (beneficiary.colO === "No" && beneficiary.colR === "Yes") {
      recommendations.push("e-KYC is completed, but ABPS (Aadhaar Based Payment System) is not enabled. Submit ABPS mandate form at branch.");
    }
    if (!beneficiary.colAP || beneficiary.colAP.length !== 11) {
      issues.push("Bank IFSC code is missing or format is invalid.");
    }
    if (beneficiary.colAP && beneficiary.colAP.startsWith("UTBI")) {
      recommendations.push("United Bank of India merged into Punjab National Bank. Use updated IFSC starting with 'PUNB'.");
    }
    if (beneficiary.colAP && beneficiary.colAP.startsWith("ALLA")) {
      recommendations.push("Allahabad Bank merged into Indian Bank. Use updated IFSC starting with 'IDIB'.");
    }

    return res.json({
      status: "success",
      mode: "rules_engine",
      issues,
      recommendations,
      score: Math.max(20, 100 - issues.length * 25),
      summary: issues.length === 0
        ? "All beneficiary details comply with official requirements and are verified."
        : `Identified ${issues.length} issue(s) or inconsistency in this record. Action required.`
    });
  }

  try {
    const prompt = `You are the official AI Data Quality Auditor for West Bengal Bathuary Gram Panchayat Job Card & e-KYC System.
Examine this MGNREGA / VB-G RAM G citizen record:
- Job Card No: ${beneficiary.colH}
- Applicant Name: ${beneficiary.colJ}
- Head of Household: ${beneficiary.colAG}
- Aadhaar No: ${beneficiary.colP}
- Mobile No: ${beneficiary.colQ}
- e-KYC Status: ${beneficiary.colR}
- ABPS Enabled: ${beneficiary.colO}
- Bank Name: ${beneficiary.colAO}
- IFSC: ${beneficiary.colAP}
- Branch: ${beneficiary.colAQ}
- Account No: ${beneficiary.colAR}
- Error Note: ${beneficiary.colT}

Verify data integrity, formatting rules (12 digit Aadhaar, 10 digit phone, merged banks IFSC compliance like United Bank -> PNB, Allahabad -> Indian Bank), ABPS linkage, and eligibility.
Respond ONLY in valid JSON format matching this schema:
{
  "score": number between 0 and 100,
  "issues": string[],
  "recommendations": string[],
  "summaryBengali": "Short 1-2 sentence assessment in Bengali"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text?.trim() || "{}";
    const parsed = JSON.parse(resultText);
    res.json({
      status: "success",
      mode: "gemini_ai",
      ...parsed
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message || "AI audit failed" });
  }
});

// AI Panchayat Chatbot & Query Assistant
app.post("/api/ai/chat", async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ status: "error", message: "Question is required" });
  }

  const ai = getGeminiClient();
  const summaryStats = {
    total: beneficiariesCache.length,
    done: beneficiariesCache.filter(b => b.colR === "Yes" || b.colR === "Y").length,
    pending: beneficiariesCache.filter(b => b.colR !== "Yes" && b.colR !== "Y").length,
    panchayat: "Bathuary Gram Panchayat, Egra-II Block, Purba Medinipur",
    officers: "SUPRABHAT PARUA (Secretary), MANIK DAS (GRS), SK DAVID (VLE)"
  };

  if (!ai) {
    // Intelligent local fallback response in English
    let answer = `According to the Bathuary Gram Panchayat database, Total Beneficiaries: ${summaryStats.total}, e-KYC Completed: ${summaryStats.done}, e-KYC Pending: ${summaryStats.pending}. For assistance, please email bathuarygp@gmail.com or visit the Panchayat office.`;
    if (question.toLowerCase().includes("pending")) {
      answer = `Currently ${summaryStats.pending} beneficiaries in Bathuary Gram Panchayat have e-KYC pending. Please contact your local Sansad VLE or GRS with Aadhaar and Job Card.`;
    } else if (question.toLowerCase().includes("aadhaar") || question.toLowerCase().includes("kyc")) {
      answer = `Accurate 12-digit Aadhaar UID seeding and biometric demographic authentication are required for direct ABPS wage crediting under MGNREGA / VB-G RAM G.`;
    } else if (question.toLowerCase().includes("abps") || question.toLowerCase().includes("bank")) {
      answer = `To enable ABPS (Aadhaar Based Payment System), ensure Aadhaar is seeded into your bank account and linked to the NPCI mapper. United Bank of India accounts have merged into PNB (PUNB), and Allahabad Bank accounts into Indian Bank (IDIB).`;
    }
    return res.json({ status: "success", reply: answer, source: "knowledge_base" });
  }

  try {
    const prompt = `You are the Virtual Assistant for Bathuary Gram Panchayat (Govt of West Bengal) Job Card & e-KYC Portal.
Current Stats:
Total Citizens: ${summaryStats.total}
e-KYC Done: ${summaryStats.done}
e-KYC Pending: ${summaryStats.pending}
GP Contact: Email bathuarygp@gmail.com, Office: Hatbaincha, Egra-II Block, Purba Medinipur.
Staff: SUPRABHAT PARUA (Secretary), MANIK DAS (GRS), SK DAVID (VLE)

Question: "${question}"
Answer helpfully, accurately, and politely in English. Keep it concise, professional, and practical.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({
      status: "success",
      reply: response.text?.trim() || "Unable to generate response at this moment. Please try again.",
      source: "gemini-3.8-flash"
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message || "AI Query error" });
  }
});

// Import Excel / CSV records endpoint
app.post("/api/import-records", (req: Request, res: Response) => {
  const { records } = req.body;
  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ status: "error", message: "Valid records array required" });
  }

  const validRecords: BeneficiaryRow[] = records.map((r: any, idx: number) => ({
    rowIndex: idx + 2,
    colA: String(r.colA || idx + 1),
    colB: String(r.colB || "SANSAD-I"),
    colC: String(r.colC || idx + 1),
    colD: String(r.colD || "PURBA MEDINIPUR"),
    colE: String(r.colE || "EGRA-II"),
    colF: String(r.colF || "BATHUARY"),
    colH: String(r.colH || `WB-14-012-005-001/${10000 + idx}`),
    colI: String(r.colI || "1"),
    colJ: String(r.colJ || "BENEFICIARY"),
    colK: String(r.colK || "MALE"),
    colL: String(r.colL || r.colJ || ""),
    colM: String(r.colM || "Yes"),
    colN: String(r.colN || "Yes"),
    colO: String(r.colO || "Yes"),
    colP: String(r.colP || ""),
    colQ: String(r.colQ || ""),
    colR: String(r.colR || "No"),
    colS: String(r.colS || ""),
    colT: String(r.colT || ""),
    colU: String(r.colU || "SK DAVID, VLE"),
    colV: String(r.colV || "BATHUARY"),
    colW: String(r.colW || "Yes"),
    colX: String(r.colX || ""),
    colAF: String(r.colAF || ""),
    colAG: String(r.colAG || ""),
    colAO: String(r.colAO || ""),
    colAP: String(r.colAP || ""),
    colAQ: String(r.colAQ || ""),
    colAR: String(r.colAR || "")
  }));

  beneficiariesCache = validRecords;
  res.json({
    status: "success",
    message: `Successfully imported ${validRecords.length} records into Bathuary GP database!`,
    total: validRecords.length
  });
});

// Explicit JSON 404 handler for all unmatched API routes (prevents Vite index.html fallback for APIs)
app.all("/api/*", (req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: `API endpoint ${req.method} ${req.path} not found.`
  });
});

// Explicit JSON error handler for API routes
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("API error:", err);
  if (req.path.startsWith("/api") || req.url.startsWith("/api")) {
    return res.status(500).json({
      status: "error",
      message: err?.message || "Internal server error occurred while processing request."
    });
  }
  next(err);
});

// ----------------------------------------------------------------------------
// Start Server & Vite Integration
// ----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bathuary Gram Panchayat Portal running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
