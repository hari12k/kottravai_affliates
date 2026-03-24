/**
 * ================================================================
 *  KOTTRAVAI ANALYTICS — PRODUCTION v10 (V2 Migration)
 *  Google Apps Script · Clean Schema Migration
 * ================================================================
 *
 *  ACTIVE SHEET: MASTER_EVENT_LOG_V2
 *    Row 1 = Headers (22 columns, frozen schema v1.0)
 *    Row 2+ = Data rows
 *    NO decorative title row. NO merged cells.
 *
 *  LEGACY SHEET: MASTER_EVENT_LOG (untouched archive)
 *    DO NOT read from it. DO NOT write to it. DO NOT delete it.
 *
 *  COLUMN MAP (v1.0):
 *    A=timestamp  B=visitor_id  C=session_id  D=ip_address
 *    E=geo_country  F=geo_state  G=device_type  H=browser
 *    I=traffic_source  J=utm_source  K=utm_medium  L=utm_campaign
 *    M=event_name  N=page_url  O=page_title  P=product_name
 *    Q=time_on_page  R=scroll_depth  S=interaction_count
 *    T=conversion_flag  U=conversion_value  V=engagement_score
 * ================================================================
 */

// ── CONFIG ───────────────────────────────────────────────────────

var SPREADSHEET_ID = '1X523buY6IyXyhGRVLw5adObUbjswyFgFT72XJ_FjoGI';

var SCHEMA_VERSION = '1.0';

// The active V2 sheet name — all reads and writes go here
var V2_SHEET = 'MASTER_EVENT_LOG_V2';

var SCHEMA_COLUMNS_V1 = [
    'timestamp',
    'visitor_id',
    'session_id',
    'ip_address',
    'geo_country',
    'geo_state',
    'device_type',
    'browser',
    'traffic_source',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'event_name',
    'page_url',
    'page_title',
    'product_name',
    'time_on_page',
    'scroll_depth',
    'interaction_count',
    'conversion_flag',
    'conversion_value',
    'engagement_score'
];

var SCHEMA_COL_COUNT = SCHEMA_COLUMNS_V1.length; // 22

// Sheets this script manages — legacy MEL is NOT in this list
var ALLOWED_SHEETS = [
    'MASTER_EVENT_LOG_V2',
    'PAGE_METRICS',
    'TOP_REPEAT_IP_RANKING',
    'DASHBOARD_SUMMARY',
    'ALLIANCE_APPLICATIONS'
];

// Sheets to delete if found — legacy MEL is NOT in this list
var LEGACY_SHEETS = [
    'TOP_3_PRODUCTS', 'PREMIUM_VISITOR_RANKING',
    'PRODUCT_ANALYSIS', 'VISITOR_ANALYSIS', 'IP_ANALYSIS', 'SESSION_ANALYSIS',
    'FUNNEL_ANALYSIS', 'TOP_REPEAT_IP_ANALYSIS', 'MOST_VIEWED_PRODUCTS',
    'AVG_TIME_SUMMARY', 'ANALYTICS_DASHBOARD', 'DASHBOARD_SUMMARY_OLD',
    'PAGE_ANALYTICS', 'LOCATION_METRICS', 'DEVICE_SUMMARY',
    'DAILY_REPORTS', 'WEEKLY_REPORTS',
    '📊 KOTTRAVAI_DASHBOARD'
];


// ================================================================
//  SCHEMA VALIDATION — targets MASTER_EVENT_LOG_V2 only
// ================================================================

/**
 * Validates that MASTER_EVENT_LOG_V2 row 1 matches SCHEMA_COLUMNS_V1.
 * Ignores legacy MASTER_EVENT_LOG entirely.
 * Returns { valid: bool, errors: string[], headerRow: number }.
 */
function validateSchema(ss) {
    var result = { valid: true, errors: [], headerRow: -1 };
    var sheet = ss.getSheetByName(V2_SHEET);

    if (!sheet) {
        result.valid = false;
        result.errors.push(V2_SHEET + ' does not exist.');
        Logger.log('VALIDATE: FAIL — ' + V2_SHEET + ' missing');
        return result;
    }

    var lastCol = sheet.getLastColumn();
    var lastRow = sheet.getLastRow();
    Logger.log('VALIDATE: ' + V2_SHEET + ' exists, lastCol=' + lastCol + ', lastRow=' + lastRow);

    if (lastRow < 1) {
        result.valid = false;
        result.errors.push(V2_SHEET + ' is completely empty — no header row.');
        Logger.log('VALIDATE: FAIL — sheet empty');
        return result;
    }

    // Read row 1 — this MUST be the header row
    var row1 = sheet.getRange(1, 1, 1, Math.max(lastCol, SCHEMA_COL_COUNT))
        .getValues()[0]
        .map(function (h) { return String(h).trim().toLowerCase(); });

    Logger.log('VALIDATE: row1 detected cols = ' + lastCol);
    Logger.log('VALIDATE: row1 = [' + row1.slice(0, SCHEMA_COL_COUNT).join(', ') + ']');

    // Row 1 must be the header — no decorative row detection needed for V2
    var mismatchCount = 0;
    for (var i = 0; i < SCHEMA_COL_COUNT; i++) {
        var expected = SCHEMA_COLUMNS_V1[i];
        var actual = row1[i] || '';
        if (actual !== expected) {
            result.valid = false;
            mismatchCount++;
            result.errors.push(
                'Col ' + String.fromCharCode(65 + i) + ' (pos ' + (i + 1) + '): expected "' +
                expected + '", got "' + actual + '"'
            );
        }
    }

    if (mismatchCount > 0) {
        Logger.log('VALIDATE: FAIL — ' + mismatchCount + ' column mismatches in row 1');
    } else {
        result.headerRow = 1;
        Logger.log('VALIDATE: PASS — all ' + SCHEMA_COL_COUNT + ' columns correct in row 1');
    }

    // Check for extra columns beyond V
    if (lastCol > SCHEMA_COL_COUNT) {
        Logger.log('VALIDATE: WARNING — ' + (lastCol - SCHEMA_COL_COUNT) + ' extra columns detected beyond V');
    }

    return result;
}


// ================================================================
//  HTTP HANDLERS
// ================================================================

function doGet(e) {
    return ContentService
        .createTextOutput('Kottravai Analytics v10 — Schema v' + SCHEMA_VERSION + ' — ' + V2_SHEET)
        .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
    try {
        if (!e || !e.postData || !e.postData.contents) {
            return jsonResponse('error', 'Empty request body.');
        }

        var data;
        try {
            data = JSON.parse(e.postData.contents);
        } catch (jsonErr) {
            return jsonResponse('error', 'Invalid JSON: ' + jsonErr.message);
        }

        // Validate required fields
        var required = ['visitor_id', 'session_id', 'event_name', 'page_url'];
        var missing = [];
        for (var r = 0; r < required.length; r++) {
            if (!data[required[r]] || String(data[required[r]]).trim() === '') {
                missing.push(required[r]);
            }
        }
        if (missing.length > 0) {
            return jsonResponse('error', 'Missing required: ' + missing.join(', '));
        }

        var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

        // Validate V2 schema before writing
        var check = validateSchema(ss);
        if (!check.valid) {
            Logger.log('doPost: ' + V2_SHEET + ' schema invalid — event rejected');
            return jsonResponse('error', 'Schema validation failed. Run setupSystem() first.');
        }

        // Determine target sheet
        var targetSheetName = data.sheet_name || V2_SHEET;
        
        // Safety check
        if (ALLOWED_SHEETS.indexOf(targetSheetName) === -1) {
            // If not in allowed list, but we want to allow it? For now, rejection is safer.
            // UNLESS it is specifically ALLIANCE_APPLICATIONS
            if (targetSheetName !== 'ALLIANCE_APPLICATIONS') {
                return jsonResponse('error', 'Target sheet not allowed: ' + targetSheetName);
            }
        }

        // Append to Target Sheet
        appendToSheet(ss, data, targetSheetName);

        return jsonResponse('success', 'Event captured in ' + targetSheetName + '.');

    } catch (err) {
        Logger.log('doPost ERROR: ' + err.toString());
        return jsonResponse('error', err.toString());
    }
}


// ================================================================
//  SETUP — Run once from Apps Script editor
// ================================================================

/**
 * Deterministic setup flow:
 * 1. Delete legacy sheets (NOT MASTER_EVENT_LOG — it is preserved)
 * 2. Create MASTER_EVENT_LOG_V2 if missing
 * 3. Validate V2 schema — STOP if invalid
 * 4. Rebuild aggregation tables (referencing V2)
 * 5. Rebuild dashboard (referencing V2)
 * 6. Order sheets
 */
function setupSystem() {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('═══ SETUP START — v10 (V2 Migration) ═══');

    // Step 1: Delete legacy (preserves MASTER_EVENT_LOG)
    deleteLegacySheets(ss);
    Logger.log('SETUP: legacy sheets cleaned (MASTER_EVENT_LOG preserved)');

    // Step 2: Ensure V2 exists
    ensureMasterEventLogV2(ss);
    Logger.log('SETUP: ' + V2_SHEET + ' ensured');

    // Step 3: Validate
    var check = validateSchema(ss);
    if (!check.valid) {
        Logger.log('SETUP: FATAL — ' + V2_SHEET + ' schema validation failed. STOPPING.');
        for (var i = 0; i < check.errors.length; i++) {
            Logger.log('  ERROR: ' + check.errors[i]);
        }
        return;
    }
    Logger.log('SETUP: schema validated — headers in row 1, ' + SCHEMA_COL_COUNT + ' columns');

    // Step 4: Rebuild aggregation (all QUERYs point to V2)
    rebuildPageMetrics(ss);
    rebuildTopRepeatIPRanking(ss);
    Logger.log('SETUP: aggregation tables rebuilt (referencing ' + V2_SHEET + ')');

    // Step 5: Rebuild dashboard (all formulas point to V2)
    rebuildDashboardSummary(ss);
    Logger.log('SETUP: dashboard rebuilt');

    // Step 6: Order sheets
    orderSheets(ss);

    // Report legacy status
    var legacySheet = ss.getSheetByName('MASTER_EVENT_LOG');
    if (legacySheet) {
        Logger.log('SETUP: legacy MASTER_EVENT_LOG exists with ' + legacySheet.getLastRow() + ' rows (archived, untouched)');
    } else {
        Logger.log('SETUP: legacy MASTER_EVENT_LOG not present');
    }

    Logger.log('═══ SETUP COMPLETE — v10 ═══');
}


// ================================================================
//  MASTER_EVENT_LOG_V2 — Create / Append
// ================================================================

/**
 * Creates MASTER_EVENT_LOG_V2 if missing.
 * Row 1 = headers. No title row. No merging. Frozen row 1.
 * If sheet exists, does NOT modify it.
 */
function ensureMasterEventLogV2(ss) {
    var sheet = ss.getSheetByName(V2_SHEET);

    if (sheet) {
        Logger.log('ENSURE-V2: ' + V2_SHEET + ' already exists, lastRow=' + sheet.getLastRow() + ', lastCol=' + sheet.getLastColumn());
        return sheet;
    }

    // Create fresh V2 sheet
    Logger.log('ENSURE-V2: creating ' + V2_SHEET);
    sheet = ss.insertSheet(V2_SHEET);

    // Row 1: 22 headers — no decorative row, no merging
    sheet.getRange(1, 1, 1, SCHEMA_COL_COUNT)
        .setValues([SCHEMA_COLUMNS_V1])
        .setFontWeight('bold')
        .setFontSize(10)
        .setBackground('#1e293b')
        .setFontColor('#ffffff')
        .setHorizontalAlignment('center');

    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 180); // timestamp column

    Logger.log('ENSURE-V2: created with ' + SCHEMA_COL_COUNT + ' headers in row 1');
    return sheet;
}


/**
 * Appends one row to the specified sheet.
 * If targetSheetName is V2_SHEET, uses the fixed 22-column schema.
 * If targetSheetName is ALLIANCE_APPLICATIONS, uses a specific Alliance schema.
 * Otherwise, falls back to a generic metadata dump.
 */
function appendToSheet(ss, data, targetSheetName) {
    var sheet = ss.getSheetByName(targetSheetName);
    
    // Auto-create Alliance Applications sheet if it doesn't exist
    if (!sheet && targetSheetName === 'ALLIANCE_APPLICATIONS') {
        sheet = ss.insertSheet(targetSheetName);
        var headers = ['Timestamp', 'Name', 'Phone', 'Address', 'Instagram ID', 'Facebook ID', 'LinkedIn ID', 'Visitor ID', 'Session ID', 'Raw Metadata'];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
        sheet.setFrozenRows(1);
    }

    if (!sheet) {
        Logger.log('APPEND: ' + targetSheetName + ' missing — cannot append');
        return;
    }

    var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    var meta = safeParseJSON(data.metadata);

    if (targetSheetName === V2_SHEET) {
        // --- STICKY MASTER_EVENT_LOG_V2 SCHEMA (22 cols) ---
        var eventName = String(data.event_name || '').trim().toLowerCase();
        var utmSource = String(data.utm_source || meta.utm_source || '').trim().toLowerCase();
        var utmMedium = String(data.utm_medium || meta.utm_medium || '').trim().toLowerCase();
        var utmCampaign = String(data.utm_campaign || meta.utm_campaign || '').trim().toLowerCase();
        var convFlag = toBoolean(data.conversion_flag || meta.conversion_flag);
        var timeOnPage = toNumber(data.time_on_page || meta.time_on_page);
        var scrollDepth = toNumber(data.scroll_depth || meta.scroll_depth);
        var interactionCount = toNumber(data.interaction_count || meta.interaction_count);
        var convValue = toNumber(data.conversion_value || meta.conversion_value);
        var engScore = toNumber(data.engagement_score || meta.engagement_score);

        var ip = String(data.ip_address || '').trim();
        var geo = resolveGeo(ip);
        var trafficSrc = String(data.traffic_source || meta.traffic_source || meta.source || '').trim();

        var rowV2 = [
            timestamp,                                                   // 0  A timestamp
            String(data.visitor_id || '').trim(),                        // 1  B visitor_id
            String(data.session_id || '').trim(),                        // 2  C session_id
            ip,                                                          // 3  D ip_address
            geo.country,                                                 // 4  E geo_country
            geo.state,                                                   // 5  F geo_state
            String(data.device_type || '').trim(),                       // 6  G device_type
            String(data.browser_type || data.browser || '').trim(),      // 7  H browser
            trafficSrc,                                                  // 8  I traffic_source
            utmSource,                                                   // 9  J utm_source
            utmMedium,                                                   // 10 K utm_medium
            utmCampaign,                                                 // 11 L utm_campaign
            eventName,                                                   // 12 M event_name
            String(data.page_url || '').trim(),                          // 13 N page_url
            String(data.page_title || meta.page_title || '').trim(),     // 14 O page_title
            String(meta.product_name || data.product_name || '').trim(), // 15 P product_name
            timeOnPage,                                                  // 16 Q time_on_page
            scrollDepth,                                                 // 17 R scroll_depth
            interactionCount,                                            // 18 S interaction_count
            convFlag,                                                    // 19 T conversion_flag
            convValue,                                                   // 20 U conversion_value
            engScore                                                     // 21 V engagement_score
        ];
        sheet.appendRow(rowV2);
    } 
    else if (targetSheetName === 'ALLIANCE_APPLICATIONS') {
        // --- ALLIANCE SCHEMA ---
        var rowAlliance = [
            timestamp,
            meta.name || '',
            meta.phone || '',
            meta.address || '',
            meta.instaId || '',
            meta.facebookId || '',
            meta.linkedinId || '',
            data.visitor_id || '',
            data.session_id || '',
            JSON.stringify(meta)
        ];
        sheet.appendRow(rowAlliance);
    }
    else {
        // --- GENERIC FALLBACK ---
        sheet.appendRow([timestamp, data.event_name, JSON.stringify(data)]);
    }

    Logger.log('APPEND: row added to ' + targetSheetName + ', new lastRow=' + sheet.getLastRow());
}


// ================================================================
//  AGGREGATION — PAGE_METRICS
// ================================================================

/**
 * Rebuilds PAGE_METRICS. Row 1 = headers. Row 2 = QUERY formula.
 * QUERY references MASTER_EVENT_LOG_V2!A:V (header-aware, trailing 1).
 * Column letters: N=page_url, M=event_name, B=visitor_id, C=session_id.
 */
function rebuildPageMetrics(ss) {
    var sheetName = 'PAGE_METRICS';
    var sheet = ss.getSheetByName(sheetName);

    if (sheet) {
        sheet.clear();
        Logger.log('AGG-PM: cleared existing ' + sheetName);
    } else {
        sheet = ss.insertSheet(sheetName);
        Logger.log('AGG-PM: created ' + sheetName);
    }

    // Row 1: headers
    var headers = ['page_url', 'total_views', 'unique_visitors', 'total_sessions'];
    sheet.getRange(1, 1, 1, headers.length)
        .setValues([headers])
        .setFontWeight('bold')
        .setFontSize(10)
        .setBackground('#1e293b')
        .setFontColor('#ffffff')
        .setHorizontalAlignment('center');

    sheet.setFrozenRows(1);

    // Row 2: QUERY referencing V2
    sheet.getRange(2, 1).setFormula(
        '=QUERY(' + V2_SHEET + '!A:V,' +
        '"SELECT N, COUNT(N), COUNT(DISTINCT B), COUNT(DISTINCT C)' +
        ' WHERE M = \'page_view\' AND N IS NOT NULL' +
        ' GROUP BY N' +
        ' ORDER BY COUNT(N) DESC' +
        ' LABEL COUNT(N) \'total_views\',' +
        ' COUNT(DISTINCT B) \'unique_visitors\',' +
        ' COUNT(DISTINCT C) \'total_sessions\'",' +
        '1)'
    );

    SpreadsheetApp.flush();
    Logger.log('AGG-PM: formula in A2 referencing ' + V2_SHEET + '. Rows: ' + sheet.getLastRow());
}


// ================================================================
//  AGGREGATION — TOP_REPEAT_IP_RANKING
// ================================================================

/**
 * Rebuilds TOP_REPEAT_IP_RANKING. Row 1 = headers. Row 2 = QUERY.
 * Column letters: D=ip_address, B=visitor_id, A=timestamp.
 */
function rebuildTopRepeatIPRanking(ss) {
    var sheetName = 'TOP_REPEAT_IP_RANKING';
    var sheet = ss.getSheetByName(sheetName);

    if (sheet) {
        sheet.clear();
        Logger.log('AGG-IP: cleared existing ' + sheetName);
    } else {
        sheet = ss.insertSheet(sheetName);
        Logger.log('AGG-IP: created ' + sheetName);
    }

    // Row 1: headers
    var headers = ['ip_address', 'total_visits', 'unique_visitors', 'last_visit_time'];
    sheet.getRange(1, 1, 1, headers.length)
        .setValues([headers])
        .setFontWeight('bold')
        .setFontSize(10)
        .setBackground('#1e293b')
        .setFontColor('#ffffff')
        .setHorizontalAlignment('center');

    sheet.setFrozenRows(1);

    // Row 2: QUERY referencing V2
    sheet.getRange(2, 1).setFormula(
        '=QUERY(' + V2_SHEET + '!A:V,' +
        '"SELECT D, COUNT(D), COUNT(DISTINCT B), MAX(A)' +
        ' WHERE D IS NOT NULL AND D <> \'\'' +
        ' GROUP BY D' +
        ' ORDER BY COUNT(D) DESC' +
        ' LIMIT 10' +
        ' LABEL COUNT(D) \'total_visits\',' +
        ' COUNT(DISTINCT B) \'unique_visitors\',' +
        ' MAX(A) \'last_visit_time\'",' +
        '1)'
    );

    SpreadsheetApp.flush();
    Logger.log('AGG-IP: formula in A2 referencing ' + V2_SHEET + '. Rows: ' + sheet.getLastRow());
}


// ================================================================
//  DASHBOARD_SUMMARY
// ================================================================

/**
 * Rebuilds DASHBOARD_SUMMARY with KPI formulas referencing V2.
 * Column references: C=session_id, B=visitor_id, M=event_name.
 * Data starts at row 2 in V2 (row 1 = headers).
 */
function rebuildDashboardSummary(ss) {
    var sheetName = 'DASHBOARD_SUMMARY';
    var COLS = 7;
    var sheet = ss.getSheetByName(sheetName);

    if (sheet) {
        sheet.getCharts().forEach(function (c) { sheet.removeChart(c); });
        sheet.clear();
        Logger.log('DASH: cleared existing ' + sheetName);
    } else {
        sheet = ss.insertSheet(sheetName);
        Logger.log('DASH: created ' + sheetName);
    }

    for (var c = 1; c <= COLS; c++) sheet.setColumnWidth(c, 155);

    // Row 1: Title
    sheet.getRange(1, 1, 1, COLS).merge()
        .setValue('KOTTRAVAI — DASHBOARD SUMMARY')
        .setFontWeight('bold').setFontSize(16).setFontFamily('Google Sans')
        .setBackground('#0f172a').setFontColor('#f8fafc')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.setRowHeight(1, 52);

    // Row 3: KPI Labels
    sheet.getRange(3, 1, 1, COLS).setValues([[
        'Total Sessions', 'Unique Visitors', 'Total Page Views',
        'Top Page', 'Top IP', '', 'Last Updated'
    ]])
        .setFontWeight('bold').setFontSize(9).setFontFamily('Google Sans')
        .setBackground('#1e293b').setFontColor('#94a3b8')
        .setHorizontalAlignment('center');
    sheet.getRange(3, 5, 1, 2).merge();

    // Row 4: KPI Values — all reference V2, data from row 2
    sheet.getRange(4, 1).setFormula('=IFERROR(COUNTUNIQUE(' + V2_SHEET + '!C2:C),0)');
    sheet.getRange(4, 2).setFormula('=IFERROR(COUNTUNIQUE(' + V2_SHEET + '!B2:B),0)');
    sheet.getRange(4, 3).setFormula('=IFERROR(COUNTIF(' + V2_SHEET + '!M2:M,"page_view"),0)');
    sheet.getRange(4, 4).setFormula('=IFERROR(INDEX(PAGE_METRICS!A2:A,1),"")');
    sheet.getRange(4, 5, 1, 2).merge();
    sheet.getRange(4, 5).setFormula('=IFERROR(INDEX(TOP_REPEAT_IP_RANKING!A2:A,1),"")');
    sheet.getRange(4, 7).setFormula('=NOW()');

    // Style KPI numeric
    sheet.getRange(4, 1, 1, 3)
        .setFontWeight('bold').setFontSize(18).setFontFamily('Google Sans')
        .setBackground('#1e3a5f').setFontColor('#38bdf8')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
    // Style KPI text
    sheet.getRange(4, 4, 1, 3)
        .setFontWeight('bold').setFontSize(11).setFontFamily('Google Sans')
        .setBackground('#1e3a5f').setFontColor('#e0f2fe')
        .setHorizontalAlignment('center').setVerticalAlignment('middle')
        .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    // Style timestamp
    sheet.getRange(4, 7)
        .setFontSize(9).setFontFamily('Google Sans')
        .setBackground('#1e3a5f').setFontColor('#64748b')
        .setHorizontalAlignment('center')
        .setNumberFormat('dd-MMM-yyyy HH:mm');
    sheet.setRowHeight(4, 50);

    sheet.getRange(5, 1, 1, COLS).setBackground('#f1f5f9');
    sheet.setRowHeight(5, 6);
    sheet.getRange(6, 1, 40, COLS).setBackground('#f8fafc');

    SpreadsheetApp.flush();

    // Charts
    var pm = ss.getSheetByName('PAGE_METRICS');
    var ip = ss.getSheetByName('TOP_REPEAT_IP_RANKING');

    if (pm && pm.getLastRow() > 1) {
        try {
            var pgRows = Math.min(pm.getLastRow(), 11);
            var c1 = sheet.newChart()
                .setChartType(Charts.ChartType.BAR)
                .addRange(pm.getRange(1, 1, pgRows, 2))
                .setPosition(7, 1, 0, 0)
                .setOption('title', 'Top Pages by Views')
                .setOption('titleTextStyle', { color: '#0f172a', fontSize: 13, bold: true })
                .setOption('legend', { position: 'none' })
                .setOption('colors', ['#3b82f6'])
                .setOption('backgroundColor', { fill: '#ffffff' })
                .setOption('width', 520).setOption('height', 320)
                .build();
            sheet.insertChart(c1);
            Logger.log('DASH: chart 1 inserted (pages)');
        } catch (e) { Logger.log('DASH: chart 1 error — ' + e.message); }
    }

    if (ip && ip.getLastRow() > 1) {
        try {
            var ipRows = Math.min(ip.getLastRow(), 11);
            var c2 = sheet.newChart()
                .setChartType(Charts.ChartType.BAR)
                .addRange(ip.getRange(1, 1, ipRows, 2))
                .setPosition(7, 4, 0, 0)
                .setOption('title', 'Top Repeat IPs')
                .setOption('titleTextStyle', { color: '#0f172a', fontSize: 13, bold: true })
                .setOption('legend', { position: 'none' })
                .setOption('colors', ['#f59e0b'])
                .setOption('backgroundColor', { fill: '#ffffff' })
                .setOption('width', 520).setOption('height', 320)
                .build();
            sheet.insertChart(c2);
            Logger.log('DASH: chart 2 inserted (IPs)');
        } catch (e) { Logger.log('DASH: chart 2 error — ' + e.message); }
    }

    Logger.log('DASH: rebuild complete');
}


// ================================================================
//  SHEET MANAGEMENT
// ================================================================

/**
 * Deletes legacy sheets. Does NOT delete MASTER_EVENT_LOG.
 * Legacy MEL is preserved as an archive.
 */
function deleteLegacySheets(ss) {
    for (var i = 0; i < LEGACY_SHEETS.length; i++) {
        var s = ss.getSheetByName(LEGACY_SHEETS[i]);
        if (s) {
            ss.deleteSheet(s);
            Logger.log('LEGACY: deleted "' + LEGACY_SHEETS[i] + '"');
        }
    }
    // Explicitly confirm legacy MEL is NOT touched
    var legacyMEL = ss.getSheetByName('MASTER_EVENT_LOG');
    if (legacyMEL) {
        Logger.log('LEGACY: MASTER_EVENT_LOG preserved (archive, ' + legacyMEL.getLastRow() + ' rows)');
    }
}

function orderSheets(ss) {
    var order = ['DASHBOARD_SUMMARY', 'PAGE_METRICS', 'TOP_REPEAT_IP_RANKING', 'MASTER_EVENT_LOG_V2'];
    for (var i = 0; i < order.length; i++) {
        var s = ss.getSheetByName(order[i]);
        if (s) {
            s.activate();
            ss.moveActiveSheet(i + 1);
        }
    }
    Logger.log('ORDER: sheets reordered');
}


// ================================================================
//  UTILITIES
// ================================================================

function safeParseJSON(str) {
    try { return JSON.parse(str || '{}') || {}; }
    catch (_) { return {}; }
}

function resolveGeo(ip) {
    if (!ip || ip === 'Unknown' || ip === 'Pending' || ip === '127.0.0.1' || ip === '::1') {
        return { country: 'Local', state: '' };
    }
    try {
        var resp = UrlFetchApp.fetch(
            'http://ip-api.com/json/' + ip + '?fields=status,country,regionName',
            { muteHttpExceptions: true }
        );
        var json = JSON.parse(resp.getContentText());
        if (json.status === 'success') {
            return { country: json.country || 'N/A', state: json.regionName || 'N/A' };
        }
        return { country: 'Unknown', state: '' };
    } catch (_) {
        return { country: 'N/A', state: '' };
    }
}

function toBoolean(val) {
    if (val === true || val === 'true' || val === '1' || val === 1) return true;
    return false;
}

function toNumber(val) {
    if (val === undefined || val === null || val === '') return 0;
    var n = Number(val);
    return isNaN(n) ? 0 : n;
}

function jsonResponse(status, message) {
    return ContentService
        .createTextOutput(JSON.stringify({ status: status, message: message }))
        .setMimeType(ContentService.MimeType.JSON);
}


// ================================================================
//  MANUAL TOOLS — Run from Apps Script editor
// ================================================================

/**
 * Full maintenance — same deterministic flow as setupSystem.
 */
function runMaintenance() {
    Logger.log('═══ MAINTENANCE START — v10 ═══');
    setupSystem();
    Logger.log('═══ MAINTENANCE COMPLETE ═══');
}

/**
 * Schema audit — validates and reports. Does not modify anything.
 */
function auditSchema() {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('═══ SCHEMA AUDIT — v' + SCHEMA_VERSION + ' (' + V2_SHEET + ') ═══');

    var check = validateSchema(ss);

    Logger.log('AUDIT: target sheet = ' + V2_SHEET);
    Logger.log('AUDIT: valid = ' + check.valid);
    Logger.log('AUDIT: headerRow = ' + check.headerRow);
    Logger.log('AUDIT: errors = ' + check.errors.length);

    for (var i = 0; i < check.errors.length; i++) {
        Logger.log('AUDIT ERROR: ' + check.errors[i]);
    }

    if (check.valid && check.headerRow === 1) {
        Logger.log('AUDIT: ✅ ' + V2_SHEET + ' is structurally sound.');
        Logger.log('AUDIT: schema version = ' + SCHEMA_VERSION);
        Logger.log('AUDIT: column count = ' + SCHEMA_COL_COUNT);
    }

    // Report legacy status
    var legacyMEL = ss.getSheetByName('MASTER_EVENT_LOG');
    if (legacyMEL) {
        Logger.log('AUDIT: legacy MASTER_EVENT_LOG exists (' + legacyMEL.getLastRow() + ' rows, untouched)');
    }
}

/**
 * Debug — logs the actual state of MASTER_EVENT_LOG_V2.
 */
function debugV2() {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(V2_SHEET);

    if (!sheet) {
        Logger.log('DEBUG: ' + V2_SHEET + ' does not exist');
        return;
    }

    Logger.log('DEBUG: target = ' + V2_SHEET);
    Logger.log('DEBUG: lastRow = ' + sheet.getLastRow());
    Logger.log('DEBUG: lastCol = ' + sheet.getLastColumn());
    Logger.log('DEBUG: frozenRows = ' + sheet.getFrozenRows());

    if (sheet.getLastRow() >= 1) {
        var row1 = sheet.getRange(1, 1, 1, Math.min(sheet.getLastColumn(), 22)).getValues()[0];
        Logger.log('DEBUG: row1 = [' + row1.join(' | ') + ']');
    }
    if (sheet.getLastRow() >= 2) {
        var row2 = sheet.getRange(2, 1, 1, Math.min(sheet.getLastColumn(), 22)).getValues()[0];
        Logger.log('DEBUG: row2 = [' + row2.join(' | ') + ']');
    }

    // Legacy status
    var legacy = ss.getSheetByName('MASTER_EVENT_LOG');
    if (legacy) {
        Logger.log('DEBUG: legacy MASTER_EVENT_LOG rows = ' + legacy.getLastRow());
    }
}
