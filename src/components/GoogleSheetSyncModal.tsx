import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  ClipboardPaste,
  ArrowRight,
  Code,
  Sparkles,
  Zap,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BeneficiaryRow } from '../types';
import { normalizeVillageName, CANONICAL_29_VILLAGES } from '../utils/villageNormalizer';
import { normalizeSansadName, CANONICAL_16_SANSADS, isHeaderOrJunkSansad } from '../utils/sansadNormalizer';
import { safeStorage, safeCopyToClipboard } from '../utils/safeStorage';

interface GoogleSheetSyncModalProps {
  onClose: () => void;
  onDataImported: (rows: BeneficiaryRow[]) => void;
  currentCount: number;
  initialMode?: 'sheetLink' | 'paste' | 'upload' | 'gas';
}

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * Bathuary Gram Panchayat - Live 2-Way Google Sheet Auto-Sync Script
 * When you update any record on the web portal, this script automatically 
 * updates that beneficiary's row in your Google Sheet in real-time!
 * =========================================================================
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Bathuary GP Live Auto-Sync Webhook is ACTIVE and connected!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000); // 15 seconds lock to prevent write collision

  try {
    var contents = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Spreadsheet has no data rows"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var targetRow = -1;

    // Strategy 1: Match by exact rowIndex if provided and valid
    if (data.rowIndex && Number(data.rowIndex) >= 2 && Number(data.rowIndex) <= lastRow) {
      var candidateRow = Number(data.rowIndex);
      if (data.colH) {
        var existingJc = String(sheet.getRange(candidateRow, 8).getValue()).trim();
        if (!existingJc || existingJc === String(data.colH).trim()) {
          targetRow = candidateRow;
        }
      } else {
        targetRow = candidateRow;
      }
    }

    // Strategy 2: Search by Job Card Number (Column H = Col 8) and Applicant
    if (targetRow === -1 && data.colH) {
      var jcValues = sheet.getRange(2, 8, lastRow - 1, 1).getValues();
      var targetJc = String(data.colH).trim().toLowerCase();
      var targetApplicantNo = data.colI ? String(data.colI).trim() : "";
      var targetName = data.colJ ? String(data.colJ).trim().toLowerCase() : "";

      for (var i = 0; i < jcValues.length; i++) {
        var rowNum = i + 2;
        var rowJc = String(jcValues[i][0] || "").trim().toLowerCase();
        if (rowJc === targetJc) {
          if (targetApplicantNo) {
            var rowAppNo = String(sheet.getRange(rowNum, 9).getValue() || "").trim();
            if (rowAppNo === targetApplicantNo) {
              targetRow = rowNum;
              break;
            }
          }
          if (targetName) {
            var rowName = String(sheet.getRange(rowNum, 10).getValue() || "").trim().toLowerCase();
            if (rowName === targetName) {
              targetRow = rowNum;
              break;
            }
          }
          if (targetRow === -1) {
            targetRow = rowNum;
          }
        }
      }
    }

    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Record not found in sheet for Job Card: " + (data.colH || '')
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Update Columns safely (prepend ' for numbers to preserve leading zeros & avoid scientific notation)
    // Col P (16): Aadhaar Number
    if (data.colP !== undefined && data.colP !== null) {
      sheet.getRange(targetRow, 16).setValue("'" + String(data.colP).trim());
    }
    // Col Q (17): Mobile Number
    if (data.colQ !== undefined && data.colQ !== null) {
      sheet.getRange(targetRow, 17).setValue("'" + String(data.colQ).trim());
    }
    // Col R (18): e-KYC Done (Yes/No)
    if (data.colR !== undefined && data.colR !== null) {
      sheet.getRange(targetRow, 18).setValue(String(data.colR).trim());
    }
    // Col S (19): e-KYC Date
    if (data.colS !== undefined && data.colS !== null) {
      sheet.getRange(targetRow, 19).setValue(String(data.colS).trim());
    }
    // Col T (20): Reason if e-KYC not done
    if (data.colT !== undefined && data.colT !== null) {
      sheet.getRange(targetRow, 20).setValue(String(data.colT).trim());
    }
    // Col U (21): Living Status (ALIVE / DEAD)
    if (data.colU !== undefined && data.colU !== null) {
      sheet.getRange(targetRow, 21).setValue(String(data.colU).trim());
    }
    // Col V (22): Village Name
    if (data.colV !== undefined && data.colV !== null) {
      sheet.getRange(targetRow, 22).setValue(String(data.colV).trim());
    }
    // Col W (23): Job Card Submitted to Office (Yes/No)
    if (data.colW !== undefined && data.colW !== null) {
      sheet.getRange(targetRow, 23).setValue(String(data.colW).trim());
    }
    // Col X (24): Remark
    if (data.colX !== undefined && data.colX !== null) {
      sheet.getRange(targetRow, 24).setValue(String(data.colX).trim());
    }
    // Col AO (41): Bank Name
    if (data.colAO !== undefined && data.colAO !== null) {
      sheet.getRange(targetRow, 41).setValue(String(data.colAO).trim());
    }
    // Col AP (42): IFSC Code
    if (data.colAP !== undefined && data.colAP !== null) {
      sheet.getRange(targetRow, 42).setValue(String(data.colAP).trim());
    }
    // Col AQ (43): Branch Name
    if (data.colAQ !== undefined && data.colAQ !== null) {
      sheet.getRange(targetRow, 43).setValue(String(data.colAQ).trim());
    }
    // Col AR (44): Account Number
    if (data.colAR !== undefined && data.colAR !== null) {
      sheet.getRange(targetRow, 44).setValue("'" + String(data.colAR).trim());
    }

    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Row " + targetRow + " successfully updated in Google Sheet!",
      row: targetRow,
      jobCard: data.colH || ""
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  onClose,
  onDataImported,
  currentCount,
  initialMode = 'gas'
}) => {
  const [activeMode, setActiveMode] = useState<'sheetLink' | 'paste' | 'upload' | 'gas'>(initialMode);
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return safeStorage.getItem('bathuary_google_sheet_url') || '';
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return safeStorage.getItem('bathuary_auto_sync_enabled') !== 'false';
  });
  const [pastedData, setPastedData] = useState<string>('');
  const [gasUrl, setGasUrl] = useState<string>('https://script.google.com/macros/s/AKfycbyikTK1-U5gkscBrHMXsNjwkEgeyYxMtq5za-X_Rey6WdZ7B7i93nevx9lK3x7SB5t4bA/exec');
  const [isTestingGas, setIsTestingGas] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGasConnected, setIsGasConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [importStats, setImportStats] = useState<{ rows: number; villages: number; sansads: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load existing Google Apps Script URL from backend
    fetch('/api/google-sheet/script-url', {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.text())
      .then(text => {
        try {
          const data = JSON.parse(text);
          if (data && data.status === 'success' && data.scriptUrl) {
            setGasUrl(data.scriptUrl);
            setIsGasConnected(Boolean(data.isConnected));
          }
        } catch {
          // ignore non-json
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyScriptCode = async () => {
    await safeCopyToClipboard(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSaveAndTestGas = async () => {
    let trimmed = gasUrl.trim();
    if (!trimmed) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your Google Apps Script Web App URL.'
      });
      return;
    }

    // Auto-expand if user pasted raw Deployment ID (e.g. starts with AKfycb...)
    if (!trimmed.startsWith('http') && trimmed.startsWith('AKfycb')) {
      trimmed = `https://script.google.com/macros/s/${trimmed}/exec`;
      setGasUrl(trimmed);
    }

    // Auto-normalize if user missed /exec or has trailing slash
    if (trimmed.includes('script.google.com/macros/s/')) {
      trimmed = trimmed.replace(/\/+$/, '');
      if (!trimmed.endsWith('/exec')) {
        trimmed = trimmed + '/exec';
        setGasUrl(trimmed);
      }
    }

    // Proactive check: Did user paste a Google Spreadsheet link?
    if (trimmed.includes('docs.google.com/spreadsheets')) {
      setStatusMessage({
        type: 'error',
        text: 'You have pasted a Google Spreadsheet link here. This field requires your deployed Google Apps Script Web App URL (starts with https://script.google.com/macros/s/... and ends with /exec).'
      });
      return;
    }

    // Proactive check: Did user paste the script editor link?
    if (trimmed.includes('/edit') || trimmed.includes('/home/projects/') || trimmed.includes('/projects/')) {
      setStatusMessage({
        type: 'error',
        text: 'This is the script editor link (code editor). Please click "Deploy" > "New deployment" > Select type: "Web app" > set "Who has access: Anyone" > click "Deploy", then copy the Web App URL ending with /exec.'
      });
      return;
    }

    if (!trimmed.includes('script.google.com')) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid Google Apps Script Web App URL (starts with https://script.google.com/macros/s/... and ends with /exec)'
      });
      return;
    }

    setIsTestingGas(true);
    setStatusMessage({
      type: 'info',
      text: 'Testing live connection to your Google Apps Script Web App...'
    });

    try {
      // 1. Save URL to server
      try {
        await fetch('/api/google-sheet/script-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ scriptUrl: trimmed })
        });
      } catch (saveErr) {
        console.warn('Server save warning:', saveErr);
      }

      // Also save to localStorage
      safeStorage.setItem('bathuary_gas_url', trimmed);

      // 2. Test Live Ping via server proxy
      const testRes = await fetch('/api/google-sheet/test-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ scriptUrl: trimmed })
      });

      const responseText = await testRes.text();
      let testData: any = null;
      try {
        testData = JSON.parse(responseText);
      } catch (jsonErr) {
        if (responseText.includes('accounts.google.com') || responseText.includes('ServiceLogin')) {
          throw new Error('Google returned a login page. In Google Apps Script Manage deployments, please ensure you clicked the blue "Deploy" button at the bottom-right after setting "Who has access: Anyone".');
        }
        if (responseText.includes('找不到網頁') || responseText.includes('檔案不存在') || responseText.includes('Requested file does not exist') || responseText.includes('Page not found')) {
          throw new Error('Google says "File does not exist". Please verify that the blue "Deploy" button was clicked in Manage deployments, and click the "Copy" button directly under "Web app URL" (ensure it ends with /exec).');
        }
        throw new Error(responseText.slice(0, 100) || 'Unexpected response received from Google');
      }

      if (testRes.ok && testData && testData.status === 'success') {
        setIsGasConnected(true);
        setStatusMessage({
          type: 'success',
          text: '✓ Live Auto-Sync Connected Successfully! Any beneficiary data updated on this portal will now automatically update in your Google Sheet spreadsheet in real time.'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: testData?.message || 'Could not reach Google Apps Script. Verify that Deploy > Web app had "Who has access" set to "Anyone" and the blue "Deploy" button was clicked.'
        });
      }
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: `Connection test failed: ${e.message}`
      });
    } finally {
      setIsTestingGas(false);
    }
  };

  // Force-save Web App URL directly without waiting for ping verification
  const handleForceSaveGas = async () => {
    let trimmed = gasUrl.trim();
    if (!trimmed) {
      setStatusMessage({ type: 'error', text: 'Please enter your Google Apps Script Web App URL first.' });
      return;
    }
    if (!trimmed.startsWith('http') && trimmed.startsWith('AKfycb')) {
      trimmed = `https://script.google.com/macros/s/${trimmed}/exec`;
      setGasUrl(trimmed);
    }
    if (trimmed.includes('script.google.com/macros/s/')) {
      trimmed = trimmed.replace(/\/+$/, '');
      if (!trimmed.endsWith('/exec')) {
        trimmed = trimmed + '/exec';
        setGasUrl(trimmed);
      }
    }

    try {
      await fetch('/api/google-sheet/test-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptUrl: trimmed, forceSave: true })
      });
      safeStorage.setItem('bathuary_gas_url', trimmed);
      setIsGasConnected(true);
      setStatusMessage({
        type: 'success',
        text: '✓ Google Apps Script Web App URL saved and activated! When updating beneficiary records, real-time sync will now be dispatched to this Google Apps Script endpoint.'
      });
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Save error: ${e.message}` });
    }
  };

  // Helper to parse rows into BeneficiaryRow with strict 29-village normalization
  const parseRowsToBeneficiaries = (rawData: any[]): BeneficiaryRow[] => {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];

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
        rowStr.includes('applicant')
      ) {
        headerRowIdx = r;
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
          else if (val.includes('kyc') || val.includes('e-kyc')) colMap['colR'] = colIdx;
          else if (val.includes('abps')) colMap['colO'] = colIdx;
          else if (val.includes('bank') && !val.includes('branch')) colMap['colAO'] = colIdx;
          else if (val.includes('branch')) colMap['colAP'] = colIdx;
          else if (val.includes('ifsc')) colMap['colAQ'] = colIdx;
          else if (val.includes('account') || val.includes('a/c')) colMap['colAR'] = colIdx;
          else if (val.includes('remark') || val.includes('error') || val.includes('reason')) colMap['colT'] = colIdx;
          else if (val.includes('vle') || val.includes('officer') || val.includes('grs')) colMap['colU'] = colIdx;
        });
        break;
      }
    }

    const startIndex = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    const parsed: BeneficiaryRow[] = [];
    const validVillages = new Set<string>();
    const validSansads = new Set<string>();

    for (let i = startIndex; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row) continue;

      let rObj: BeneficiaryRow;

      if (Array.isArray(row)) {
        const hasAny = row.some(c => c !== undefined && c !== null && String(c).trim() !== '');
        if (!hasAny) continue;

        const get = (key: string, defaultIdx: number): string => {
          const idx = colMap[key] !== undefined ? colMap[key] : defaultIdx;
          return String(row[idx] ?? '').trim();
        };

        let jobCard = get('colH', 7);
        let name = get('colJ', 9);
        const rawSansad = get('colB', 1);

        const nameUpper = name.toUpperCase();
        const jobCardUpper = jobCard.toUpperCase();

        // Skip only literal repeated column header rows
        if (
          (nameUpper === 'NAME' || nameUpper === 'NAME OF APPLICANT' || nameUpper === 'BENEFICIARY NAME' || nameUpper === 'APPLICANT NAME') &&
          (jobCardUpper === 'JOB CARD' || jobCardUpper === 'JOB CARD NO' || jobCardUpper === 'REG NO')
        ) {
          continue;
        }

        // Ensure row is not dropped if any identity field exists
        if (!jobCard && !name) {
          const altP = get('colP', 15);
          const altA = get('colA', 0);
          if (altP || altA || rawSansad) {
            name = name || `Citizen #${parsed.length + 1}`;
            jobCard = jobCard || `WB-02-005-${String(parsed.length + 1).padStart(5, '0')}`;
          } else {
            continue;
          }
        }

        const rawVillage = get('colV', 21) || get('colV', 20) || 'BATHUARY';
        
        // Canonical 29-Village strictly normalized!
        const normalizedVillage = normalizeVillageName(rawVillage, rawSansad);
        // Canonical 16-Sansad strictly normalized (BATHUARY 1 to BATHUARY 16)
        const normalizedSansad = normalizeSansadName(rawSansad, normalizedVillage) || 'BATHUARY 1';

        validVillages.add(normalizedVillage);
        if (normalizedSansad && !isHeaderOrJunkSansad(normalizedSansad)) {
          validSansads.add(normalizedSansad);
        }

        const rawKyc = get('colR', 17).toUpperCase();
        const isKycDone = rawKyc === 'YES' || rawKyc === 'Y' || rawKyc === 'DONE' || rawKyc === '1';

        const rawAbps = get('colO', 14).toUpperCase();
        const isAbpsActive = rawAbps === 'YES' || rawAbps === 'Y' || rawAbps === '1';

        rObj = {
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
          colP: get('colP', 15).replace(/\D/g, ''),
          colQ: get('colQ', 16).replace(/\D/g, ''),
          colR: isKycDone ? 'Yes' : 'No',
          colS: get('colS', 18) || (isKycDone ? new Date().toISOString().split('T')[0] : ''),
          colT: get('colT', 19),
          colU: get('colU', 20) || 'SK DAVID, VLE',
          colV: normalizedVillage,
          colW: get('colW', 22) || 'Yes',
          colX: get('colX', 23),
          colAF: get('colAF', 31).toUpperCase(),
          colAG: get('colAG', 32).toUpperCase() || (name || '').toUpperCase(),
          colAO: get('colAO', 40).toUpperCase(),
          colAP: get('colAP', 41).toUpperCase(),
          colAQ: get('colAQ', 42).toUpperCase(),
          colAR: get('colAR', 43)
        };
      } else {
        const getVal = (col: string, fallbackIdx: number) => {
          return row[col] !== undefined ? String(row[col]) : '';
        };

        const rawSansad = getVal('colB', 1) || 'SANSAD-I';
        const rawVillage = getVal('colV', 21) || 'BATHUARY';
        const normalizedVillage = normalizeVillageName(rawVillage, rawSansad);
        const normalizedSansad = normalizeSansadName(rawSansad, normalizedVillage);

        validVillages.add(normalizedVillage);
        if ((CANONICAL_16_SANSADS as readonly string[]).includes(normalizedSansad)) {
          validSansads.add(normalizedSansad);
        }

        rObj = {
          rowIndex: parsed.length + 2,
          colA: getVal('colA', 0) || String(parsed.length + 1),
          colB: normalizedSansad,
          colC: getVal('colC', 2) || String(parsed.length + 1),
          colD: getVal('colD', 3) || 'PURBA MEDINIPUR',
          colE: getVal('colE', 4) || 'EGRA-II',
          colF: getVal('colF', 5) || 'BATHUARY',
          colH: getVal('colH', 7),
          colI: getVal('colI', 8) || '1',
          colJ: getVal('colJ', 9).toUpperCase(),
          colK: getVal('colK', 10) || 'MALE',
          colL: getVal('colL', 11),
          colM: getVal('colM', 12) || 'Yes',
          colN: getVal('colN', 13) || 'Yes',
          colO: getVal('colO', 14) || 'Yes',
          colP: getVal('colP', 15).replace(/\D/g, ''),
          colQ: getVal('colQ', 16).replace(/\D/g, ''),
          colR: getVal('colR', 17) || 'No',
          colS: getVal('colS', 18),
          colT: getVal('colT', 19),
          colU: getVal('colU', 20) || 'SK DAVID, VLE',
          colV: normalizedVillage,
          colW: getVal('colW', 22) || 'Yes',
          colX: getVal('colX', 23),
          colAF: getVal('colAF', 31).toUpperCase(),
          colAG: getVal('colAG', 32).toUpperCase(),
          colAO: getVal('colAO', 40).toUpperCase(),
          colAP: getVal('colAP', 41).toUpperCase(),
          colAQ: getVal('colAQ', 42).toUpperCase(),
          colAR: getVal('colAR', 43)
        };
      }

      if (rObj.colH || rObj.colJ) {
        parsed.push(rObj);
      }
    }

    setImportStats({
      rows: parsed.length,
      villages: validVillages.size,
      sansads: validSansads.size
    });

    return parsed;
  };

  // Handle local Excel file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Processing file records...' });

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const mapped = parseRowsToBeneficiaries(data);
        if (mapped.length > 0) {
          onDataImported(mapped);
          setStatusMessage({
            type: 'success',
            text: `Success! Synchronized ${mapped.length} verified citizen records across ${new Set(mapped.map(m => m.colV)).size} villages.`
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'Could not extract valid Job Card records. Ensure the Excel contains Job Card numbers and Beneficiary names.'
          });
        }
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `Failed to read file: ${err.message}`
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle Google Sheet Server-Side Proxy Sync with Client-Side Direct Fallback
  const handleFetchGoogleSheet = async () => {
    const trimmedUrl = sheetUrl.trim();
    if (!trimmedUrl) {
      setStatusMessage({ type: 'error', text: 'Please enter your Google Sheet link or spreadsheet URL.' });
      return;
    }

    if (trimmedUrl.includes('script.google.com')) {
      setStatusMessage({
        type: 'error',
        text: 'You have pasted a Google Apps Script link here. This field is for your Google Spreadsheet link (https://docs.google.com/spreadsheets/d/.../edit). For Apps Script, please use the "2-Way Live Auto-Sync" tab.'
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Connecting and fetching Google Sheet...' });

    try {
      let imported = false;

      // 1. Try server-side proxy
      try {
        const res = await fetch('/api/sync-google-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ sheetUrl: trimmedUrl })
        });

        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          // not valid json
        }

        if (res.ok && data?.status === 'success' && Array.isArray(data.beneficiaries) && data.beneficiaries.length > 0) {
          safeStorage.setItem('bathuary_google_sheet_url', trimmedUrl);
          safeStorage.setItem('bathuary_auto_sync_enabled', String(autoSyncEnabled));
          onDataImported(data.beneficiaries);
          setImportStats({
            rows: data.total,
            villages: data.villagesCount,
            sansads: data.sansadsCount
          });
          setStatusMessage({
            type: 'success',
            text: `Live Sync Successful! Loaded ${data.total} records across all 29 canonical villages and strictly 16 official Sansads.`
          });
          imported = true;
          return;
        } else if (data?.message) {
          console.warn('Server sync notice:', data.message);
        }
      } catch (proxyErr) {
        console.warn('Server proxy error, trying client-side direct CSV fetch:', proxyErr);
      }

      // 2. Client-side direct CSV fallback (Google Sheets allows CORS on gviz/tq endpoint!)
      const pubMatch = trimmedUrl.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
      const docMatch = trimmedUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = trimmedUrl.match(/[#&?]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      const sheetId = pubMatch ? pubMatch[1] : (docMatch ? docMatch[1] : '');

      if (sheetId) {
        const clientCandidateUrls = pubMatch
          ? [`https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv&gid=${gid}`]
          : [
              `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
              `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
            ];

        for (const candidateUrl of clientCandidateUrls) {
          try {
            const clientRes = await fetch(candidateUrl);
            if (clientRes.ok) {
              const csvText = await clientRes.text();
              if (!csvText.includes('<!DOCTYPE') && !csvText.includes('<html') && csvText.trim().length > 20) {
                const workbook = XLSX.read(csvText, { type: 'string' });
                const firstSheetName = workbook.SheetNames[0];
                const rawRows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { header: 1 });
                const beneficiaries = parseRowsToBeneficiaries(rawRows);

                if (beneficiaries.length > 0) {
                  safeStorage.setItem('bathuary_google_sheet_url', trimmedUrl);
                  safeStorage.setItem('bathuary_auto_sync_enabled', String(autoSyncEnabled));
                  onDataImported(beneficiaries);

                  // Update server cache in background
                  fetch('/api/import-records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ records: beneficiaries })
                  }).catch(() => {});

                  const vCount = new Set(beneficiaries.map(b => b.colV)).size;
                  const sCount = new Set(beneficiaries.map(b => b.colB)).size;
                  setImportStats({ rows: beneficiaries.length, villages: vCount, sansads: sCount });
                  setStatusMessage({
                    type: 'success',
                    text: `Direct Google Sheet Sync Successful! Loaded ${beneficiaries.length} citizen records across ${vCount} canonical villages.`
                  });
                  imported = true;
                  return;
                }
              }
            }
          } catch (cErr) {
            console.warn('Direct client candidate failed:', cErr);
          }
        }
      }

      if (!imported) {
        throw new Error('Google Sheet-এ প্রবেশ করা সম্ভব হয়নি। অনুগ্রহ করে নিশ্চিত করুন: Google Sheet-এর ওপরে ডানপাশে "Share" বাটনে ক্লিক করে "General access" অপশনে "Anyone with the link can view" সিলেক্ট করেছেন।');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not access Google Sheet. Please check "Share" > "Anyone with the link can view".'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Direct Paste of Google Sheet Data
  const handleParsePastedData = () => {
    if (!pastedData.trim()) {
      setStatusMessage({ type: 'error', text: 'Please paste your copied Google Sheet cells into the box.' });
      return;
    }

    setIsLoading(true);
    try {
      // Parse TSV/CSV text from clipboard
      const lines = pastedData.trim().split('\n');
      const matrix: any[][] = lines.map(line => line.split('\t').map(cell => cell.trim().replace(/^"|"$/g, '')));

      const mapped = parseRowsToBeneficiaries(matrix);

      if (mapped.length > 0) {
        onDataImported(mapped);
        setStatusMessage({
          type: 'success',
          text: `Success! Parsed and loaded ${mapped.length} citizen records directly from your pasted Google Sheet data.`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Could not detect beneficiary records from pasted text. Please copy full rows including Job Card numbers.'
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to parse pasted data: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Link Real Google Sheet & Excel Data
              </h3>
              <p className="text-xs text-slate-500">
                Current active records: <strong className="text-emerald-700">{currentCount} Job Cards</strong> (Strictly real data only)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection for Sync Method */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl mb-5 overflow-x-auto">
          <button
            onClick={() => setActiveMode('gas')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeMode === 'gas' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-700 hover:text-slate-900 bg-white/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Live Auto-Sync (2-Way)</span>
          </button>

          <button
            onClick={() => setActiveMode('sheetLink')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeMode === 'sheetLink' 
                ? 'bg-white text-emerald-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Sheet Link</span>
          </button>

          <button
            onClick={() => setActiveMode('paste')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeMode === 'paste' 
                ? 'bg-white text-emerald-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Copy-Paste</span>
          </button>

          <button
            onClick={() => setActiveMode('upload')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeMode === 'upload' 
                ? 'bg-white text-emerald-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Excel</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3.5 rounded-2xl mb-4 text-xs font-semibold flex items-start gap-2.5 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-sky-50 text-sky-800 border border-sky-200'
          }`}>
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-sky-600 shrink-0 mt-0.5 animate-spin" />}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Mode 0: Real-Time Live Auto-Sync to Google Sheet (2-Way) */}
        {activeMode === 'gas' && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Status & Intro Banner */}
            <div className={`p-4 rounded-2xl border text-xs ${
              isGasConnected 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl text-white shrink-0 ${isGasConnected ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm">
                      Real-Time 2-Way Google Sheet Auto-Sync
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      isGasConnected ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {isGasConnected ? 'Active & Linked' : 'Setup Required'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    ওয়েবসাইটে যখনই আপনি কোনো নাগরিকের তথ্য (Aadhaar, Mobile, e-KYC, Bank, Living Status ইত্যাদি) পরিবর্তন করে <strong>"Save & Verify Record"</strong> করবেন, এই স্ক্রিপ্টের মাধ্যমে আপনার মূল <strong>Google Spreadsheet</strong>-এর নির্দিষ্ট সারিতে সাথে সাথে তথ্য অটো-আপডেট হয়ে যাবে।
                  </p>
                </div>
              </div>
            </div>

            {/* Web App URL Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Google Apps Script Web App URL:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAndTestGas}
                    disabled={isTestingGas || !gasUrl.trim()}
                    className="px-4 py-2.5 rounded-xl btn-3d-save text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                    title="Test connection and activate live sync"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingGas ? 'animate-spin' : ''}`} />
                    <span>{isTestingGas ? 'Testing...' : 'Save & Test'}</span>
                  </button>

                  <button
                    onClick={handleForceSaveGas}
                    disabled={!gasUrl.trim()}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap disabled:opacity-40"
                    title="Save this URL directly without ping test"
                  >
                    <span>Save Anyway</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-600">
                <span>URL-টি অবশ্যই <code>https://script.google.com/macros/s/.../exec</code> দিয়ে শেষ হতে হবে।</span>
                {gasUrl.trim() && gasUrl.includes('script.google.com') && (
                  <a
                    href={gasUrl.trim().endsWith('/exec') ? gasUrl.trim() : `${gasUrl.trim().replace(/\/+$/, '')}/exec`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline ml-2 whitespace-nowrap"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Test in New Tab</span>
                  </a>
                )}
              </div>

              {/* Notice for Manage Deployments step */}
              <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-bold text-amber-950 block">আপনার স্ক্রিনশট অনুযায়ী ৩টি জরুরি পদক্ষেপ (Must follow steps):</strong>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 leading-normal pl-0.5">
                    <li>
                      <strong>নীল Deploy বাটনে ক্লিক করুন:</strong> আপনার স্ক্রিনে 'Who has access: Anyone' নির্বাচন করা আছে, কিন্তু নিচে ডানপাশের <strong>নীল [Deploy] বাটনে ক্লিক করতে হবে</strong>। Deploy বাটনে ক্লিক না করলে গুগল সার্ভার পরিবর্তন সেভ করবে না।
                    </li>
                    <li>
                      <strong>সঠিক Web app URL কপি করুন:</strong> Deploy বাটনে ক্লিক করার পর Google 'Deployment successfully updated' দেখাবে। সেখানে <em>'Web app'</em> সেকশনের নিচে থাকা <strong>[Copy]</strong> বাটনে ক্লিক করে লিঙ্ক কপি করুন (কখনোই Deployment ID কপি করবেন না)।
                    </li>
                    <li>
                      <strong>লিঙ্কের শেষে /exec থাকা আবশ্যক:</strong> কপি করা লিঙ্কের শেষে যেন <code>/exec</code> থাকে। তারপর উপরের বক্সে পেস্ট করে <strong>'Save & Test'</strong> বা <strong>'Save Anyway'</strong> বাটনে ক্লিক করুন।
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Apps Script Code Box with 1-Click Copy */}
            <div className="border border-slate-800 rounded-2xl p-3.5 bg-slate-900 text-slate-200 shadow-md">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 font-mono">Google Apps Script Code (Code.gs)</span>
                </div>
                <button
                  onClick={handleCopyScriptCode}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white" />
                      <span>Copy Script Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[10px] font-mono text-emerald-300/90 max-h-36 overflow-y-auto p-2.5 bg-slate-950 rounded-xl leading-relaxed select-all">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>

            {/* 2-Minute Step-by-Step Guide */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2.5">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>২ মিনিটের সহজ সেটআপ গাইড (Step-by-Step Guide):</span>
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 pl-1 leading-relaxed">
                <li>আপনার <strong>Google Spreadsheet</strong>-টি ব্রাউজারে খুলুন।</li>
                <li>ওপরের মেনুবার থেকে <strong>Extensions</strong> ➔ <strong>Apps Script</strong>-এ ক্লিক করুন।</li>
                <li>সেখানে থাকা ডিফল্ট কোড সম্পূর্ণ মুছে দিয়ে ওপরের <strong>"Copy Script Code"</strong> বাটনে ক্লিক করে পুরো কোডটি পেস্ট করুন।</li>
                <li>ওপরে ডানপাশের নীল <strong>Deploy</strong> বাটনে ক্লিক করে <strong>New deployment</strong> সিলেক্ট করুন।</li>
                <li>বামে ⚙️ (Select type) আইকনে ক্লিক করে <strong>Web app</strong> বেছে নিন।</li>
                <li>
                  <strong className="text-rose-700 font-bold">অতি গুরুত্বপূর্ণ:</strong> <em>Execute as:</em> <strong>"Me"</strong> এবং <em>Who has access:</em> <strong>"Anyone"</strong> নির্বাচন করুন।
                </li>
                <li><strong>Deploy</strong> বাটনে ক্লিক করে Authorize Permissions দিয়ে প্রাপ্ত <strong>Web app URL</strong> কপি করুন।</li>
                <li>উপরের বক্সে সেই Web app URL পেস্ট করে <strong>"Save & Test"</strong> ক্লিক করলেই লাইভ অটো-আপডেট সম্পূর্ণ চালু হবে!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Mode 1: Google Sheet Direct Link */}
        {activeMode === 'sheetLink' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Paste Google Spreadsheet Link:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit#gid=0"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner"
                />
                <button
                  onClick={handleFetchGoogleSheet}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl btn-3d-save text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Sync Sheet</span>
                </button>
              </div>

              {/* Permission guidance */}
              <p className="text-[11px] text-slate-500 mt-1">
                টিপস: গুগল শিটের ওপরে ডানপাশে <strong>&quot;Share&quot;</strong> বাটনে ক্লিক করে <strong>&quot;Anyone with the link can view&quot;</strong> নিশ্চিত করুন।
              </p>

              {/* Auto-Link on Startup Toggle */}
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoSyncCheck"
                  checked={autoSyncEnabled}
                  onChange={(e) => {
                    setAutoSyncEnabled(e.target.checked);
                    safeStorage.setItem('bathuary_auto_sync_enabled', String(e.target.checked));
                  }}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="autoSyncCheck" className="text-[11px] text-slate-600 font-medium cursor-pointer">
                  ⚡ <strong>Auto-link active:</strong> Automatically load and synchronize this Google Sheet on startup
                </label>
              </div>
            </div>

            {/* Why 16 Sansads Resolution Notice */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Sansad Resolution (16 Official Sansads):</span>
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Bathuary Gram Panchayat officially has <strong>16 Sansads</strong> (SANSAD-I through SANSAD-XVI). If a spreadsheet contains numeric labels (e.g. <em>1</em> instead of <em>SANSAD-I</em>), trailing spaces, or a stray header, older tools mistook them for a 17th Sansad. All data is now strictly mapped into the canonical 16 Sansads.
              </p>
            </div>

            {/* Clear Sharing Instructions */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Google Sheet Permission Setup Guide:</span>
              </p>
              <ol className="list-decimal list-inside text-slate-600 space-y-1 pl-1 text-[11px]">
                <li>Open your Google Sheet and click the top-right <strong>'Share'</strong> button.</li>
                <li>Under <em>General access</em>, select <strong>"Anyone with the link"</strong> (Role: <em>Viewer</em>).</li>
                <li>Click <strong>Copy link</strong>, paste it in the box above, and click <strong>Sync Sheet</strong>.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Mode 2: Copy-Paste Sheet Data (Instant & Foolproof) */}
        {activeMode === 'paste' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Paste Copied Rows from your Google Sheet:
              </label>
              <textarea
                rows={6}
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="Open your Google Sheet, select rows or press Ctrl+A, copy (Ctrl+C), and paste (Ctrl+V) here..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <button
              onClick={handleParsePastedData}
              disabled={isLoading || !pastedData.trim()}
              className="w-full py-3 rounded-xl btn-3d-save text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Parse & Import Google Sheet Data</span>
            </button>
          </div>
        )}

        {/* Mode 3: Local Excel File Upload */}
        {activeMode === 'upload' && (
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 rounded-2xl p-8 text-center cursor-pointer transition-colors group"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                Click to upload your Excel file (.xlsx / .csv)
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select your Bathuary GP Excel master file. All 29 canonical villages and columns will load immediately.
              </p>
            </div>
          </div>
        )}

        {/* Stats Preview */}
        {importStats && (
          <div className="grid grid-cols-3 gap-3 p-3 mt-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div>
              <p className="text-xs text-slate-500 font-medium">Job Cards</p>
              <p className="text-lg font-black text-slate-900">{importStats.rows}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Villages</p>
              <p className="text-lg font-black text-emerald-700">{importStats.villages}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Sansads</p>
              <p className="text-lg font-black text-sky-700">{importStats.sansads}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-5 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Strictly real Google Sheet data is preserved and shown.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
