// app.js

// Initialize Lucide icons
lucide.createIcons();

// Elements
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const newChatBtn = document.getElementById('new-chat-btn');
const chatHistoryEl = document.getElementById('chat-history');
const currentChatTitle = document.getElementById('current-chat-title');
const messagesContainer = document.getElementById('messages-container');
const welcomeScreen = document.getElementById('welcome-screen');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const fileUploadInput = document.getElementById('file-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const fileExtBadge = document.getElementById('file-ext-badge');
const uploadStatus = document.getElementById('upload-status');
const removeImageBtn = document.getElementById('remove-image');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const apiKeyInput = document.getElementById('api-key');
const systemInstructionsInput = document.getElementById('system-instructions');
const sendBtn = document.getElementById('send-btn');

// State
let apiKey = localStorage.getItem('aspire_api_key') || '';
let quantApiKey = localStorage.getItem('aspire_quant_api_key') || '';
let systemInstructions = localStorage.getItem('aspire_system_instructions') || '';
let currentImageBase64 = null;
let currentImageMimeType = null;
let chats = JSON.parse(localStorage.getItem('aspire_chats') || '[]');
let currentChatId = null;
let currentlyReplyingTo = null;

let isTradingModeOn = false;
let currentFileParsedText = null;

// Trading Mode State Controller
const tradingDashboard = document.getElementById('trading-dashboard');
const mainContentWrapper = document.getElementById('main-content-wrapper');

function updateTradingUI(active) {
  isTradingModeOn = active;
  const badgeText = document.getElementById('mode-badge-text');
  const chatModeBadge = document.getElementById('chat-mode-badge');
  const welcomeTitle = document.getElementById('welcome-title');
  
  if (active) {
    mainContentWrapper.classList.add('trading-layout-active');
    tradingDashboard.classList.remove('hidden');
    if (!tradingDashboard.dataset.initialized) {
      tradingDashboard.dataset.initialized = 'true';
      tradingDashboard.innerHTML = `
         <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #FCA5A5; padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; text-align: center; margin-bottom: 12px; font-weight: bold;">
            ⚠️ Investments and Securities are subject to market risks
         </div>
         <div class="dashboard-tabs" style="display:flex; gap:10px; margin-bottom: 15px;">
            <button class="dash-tab active" style="background:#10B981; color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer;">Markets</button>
            <button class="dash-tab" style="background:rgba(255,255,255,0.1); color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer;">AI Predictions Tracker</button>
         </div>
         <div id="dash-markets" style="flex:1;"></div>
         <div id="dash-predictions" style="display:none; color:white;">
            <h3 style="margin-bottom:10px;">Algorithmic Prediction Database</h3>
            <div id="prediction-stats" style="margin: 15px 0; display:flex; gap:20px; font-weight:bold; color:#10B981;">
               <span>Total Predictions: <span id="stat-total">0</span></span>
               <span>Accuracy: <span id="stat-acc">0%</span></span>
               <span style="color:#EF4444;">False Signals: <span id="stat-false">0</span></span>
            </div>
            <table style="width:100%; text-align:left; border-collapse:collapse; margin-top:15px; font-size: 0.9rem;">
               <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><th style="padding:10px 0;">Asset</th><th>Pred</th><th>Entry</th><th>Status</th></tr></thead>
               <tbody id="prediction-table-body">
                  <tr><td colspan="4" style="text-align:center; padding:20px; color:gray;">No predictions logged yet. Ask the AI to predict a stock!</td></tr>
               </tbody>
            </table>
         </div>
      `;
      const dashMarkets = document.getElementById('dash-markets');
      resetDashboardPlaceholder();
      
      const tabs = tradingDashboard.querySelectorAll('.dash-tab');
      tabs[0].onclick = () => { tabs[0].style.background='#10B981'; tabs[1].style.background='rgba(255,255,255,0.1)'; dashMarkets.style.display='block'; document.getElementById('dash-predictions').style.display='none'; renderPredictions(); };
      tabs[1].onclick = () => { tabs[1].style.background='#10B981'; tabs[0].style.background='rgba(255,255,255,0.1)'; dashMarkets.style.display='none'; document.getElementById('dash-predictions').style.display='block'; renderPredictions(); };
    }
    if (welcomeTitle) welcomeTitle.innerHTML = `<span class="cursive-brand" style="color:#10B981;">Trade</span> with Aspire`;
    if (badgeText) badgeText.innerText = "Trade Mode Active";
    if (chatModeBadge) {
       chatModeBadge.style.borderColor = "#10B981";
       chatModeBadge.style.color = "#10B981";
       chatModeBadge.style.background = "rgba(16,185,129,0.15)";
    }
  } else {
    mainContentWrapper.classList.remove('trading-layout-active');
    setTimeout(() => tradingDashboard.classList.add('hidden'), 400);
    if (welcomeTitle) welcomeTitle.innerHTML = `<span class="cursive-brand">Aspire</span>. Then Brainstorm`;
    if (badgeText) badgeText.innerText = "Standard AI Mode";
    if (chatModeBadge) {
       chatModeBadge.style.borderColor = "rgba(255,255,255,0.1)";
       chatModeBadge.style.color = "var(--text-muted)";
       chatModeBadge.style.background = "rgba(255,255,255,0.05)";
    }
  }
}

window.quickRequestChart = function(symbol) {
  projectChartToDashboard(symbol);
};

function resetDashboardPlaceholder() {
  const dashMarkets = document.getElementById('dash-markets');
  if (!dashMarkets) return;
  dashMarkets.innerHTML = `
    <div class="graph-placeholder-container" style="height:100%; min-height:480px; display:flex; flex-direction:column; align-items:center; justify-content:center; border:2px dashed rgba(16,185,129,0.25); border-radius:16px; background:rgba(16,185,129,0.03); text-align:center; padding:30px; margin-top:10px;">
       <div style="background:rgba(16,185,129,0.15); width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:16px; border:1px solid rgba(16,185,129,0.3);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
       </div>
       <h3 style="color:white; font-size:1.25rem; font-weight:700; margin-bottom:8px;">Graph will be projected here</h3>
       <p style="color:var(--text-muted); font-size:0.9rem; max-width:340px; line-height:1.5; margin-bottom:20px;">Ask Aspire AI for any stock, index, or crypto chart (e.g. <em>"Show me graph of TSLA"</em> or <em>"NIFTY chart"</em>) to project it live on this screen.</p>
       <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
          <button onclick="quickRequestChart('NASDAQ:TSLA')" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#10B981; padding:6px 14px; border-radius:20px; font-size:0.8rem; cursor:pointer; font-weight:600;">📈 TSLA</button>
          <button onclick="quickRequestChart('BSE:SENSEX')" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#10B981; padding:6px 14px; border-radius:20px; font-size:0.8rem; cursor:pointer; font-weight:600;">🇮🇳 SENSEX</button>
          <button onclick="quickRequestChart('BINANCE:BTCUSDT')" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#10B981; padding:6px 14px; border-radius:20px; font-size:0.8rem; cursor:pointer; font-weight:600;">🪙 BTC</button>
       </div>
    </div>
  `;
}

function projectChartToDashboard(exchange, ticker) {
  const dashMarkets = document.getElementById('dash-markets');
  if (!dashMarkets) return;
  const fullSymbol = ticker ? `${exchange}:${ticker}` : exchange;
  dashMarkets.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background:rgba(16,185,129,0.15); padding:8px 12px; border-radius:8px; border:1px solid rgba(16,185,129,0.3);">
       <span style="color:#10B981; font-weight:bold; font-size:0.85rem;">📊 Projected Screen Graph: ${escapeHTML(fullSymbol)}</span>
       <button id="reset-dash-markets-btn" style="background:rgba(255,255,255,0.1); color:white; border:none; padding:4px 10px; border-radius:6px; font-size:0.75rem; cursor:pointer; font-weight:500;">Clear Graph</button>
    </div>
    <iframe src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(fullSymbol)}&interval=D&theme=dark&style=1&studies=%5B%22RSI%40tv-basicstudies%22%2C%22MACD%40tv-basicstudies%22%2C%22MASimple%40tv-basicstudies%22%5D" width="100%" height="520" frameborder="0" style="border-radius:12px; margin-bottom: 15px;"></iframe>
  `;
  const resetBtn = document.getElementById('reset-dash-markets-btn');
  if (resetBtn) {
    resetBtn.onclick = () => {
       resetDashboardPlaceholder();
    };
  }
}

function parseChartTags(html) {
  const chartRegex = /\[CHART:\s*([A-Za-z0-9_.-]+)(?::([A-Za-z0-9_.-]+))?\]/g;
  return html.replace(chartRegex, (match, p1, p2) => {
    let exchange = 'NASDAQ';
    let ticker = p1;
    if (p2) {
      exchange = p1;
      ticker = p2;
    } else if (p1.includes(':')) {
      const parts = p1.split(':');
      exchange = parts[0];
      ticker = parts[1];
    }
    const fullSymbol = `${exchange}:${ticker}`;
    
    setTimeout(() => projectChartToDashboard(exchange, ticker), 100);
    
    return `<div style="background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.3); border-radius:12px; padding:12px; margin:15px 0;">
       <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-weight:600; color:#10B981; font-size:0.85rem;">
          <span>📈 Projected Stock Chart: ${escapeHTML(fullSymbol)}</span>
          <span style="font-size:0.75rem; opacity:0.8;">Screen Updated</span>
       </div>
       <iframe src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(fullSymbol)}&interval=D&theme=dark&style=1&studies=%5B%22RSI%40tv-basicstudies%22%2C%22MACD%40tv-basicstudies%22%2C%22MASimple%40tv-basicstudies%22%5D" width="100%" height="400" frameborder="0" style="border-radius:8px;"></iframe>
    </div>`;
  });
}

let aiPredictions = JSON.parse(localStorage.getItem('aspire_predictions') || '[]');

function savePredictions() {
  localStorage.setItem('aspire_predictions', JSON.stringify(aiPredictions));
}

function parsePredictionTags(html) {
  const predRegex = /\[PREDICTION:\s*([A-Za-z0-9_.-]+):\s*(UP|DOWN|BULLISH|BEARISH):\s*([0-9.]+)\]/gi;
  return html.replace(predRegex, (match, symbol, direction, price) => {
    const isUp = direction.toUpperCase() === 'UP' || direction.toUpperCase() === 'BULLISH';
    const cleanDir = isUp ? 'BULLISH 📈' : 'BEARISH 📉';
    const color = isUp ? '#10B981' : '#EF4444';
    const bgGradient = isUp ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.05))' : 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.05))';
    const formattedPrice = parseFloat(price).toLocaleString('en-US', {style:'currency', currency:'USD'});

    const existing = aiPredictions.find(p => p.symbol === symbol.toUpperCase() && Math.abs(p.price - parseFloat(price)) < 0.01);
    if (!existing) {
       aiPredictions.push({
          id: Date.now(),
          symbol: symbol.toUpperCase(),
          direction: isUp ? 'UP' : 'DOWN',
          price: parseFloat(price),
          timestamp: Date.now(),
          status: 'PENDING'
       });
       savePredictions();
       if(document.getElementById('dash-predictions')?.style.display === 'block') {
         renderPredictions();
       }
    }

    return `
      <div style="background: ${bgGradient}; border: 1.5px solid ${color}; border-radius: 12px; padding: 14px 18px; margin: 16px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.25);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px;">
          <div style="display:flex; align-items:center; gap:8px;">
             <span style="background:${color}; color:white; font-size:0.7rem; font-weight:800; padding:3px 8px; border-radius:12px; text-transform:uppercase; letter-spacing:0.5px;">⚡ AI FORECAST HIGHLIGHT</span>
             <strong style="color:white; font-size:1.1rem; letter-spacing:0.5px;">${symbol.toUpperCase()}</strong>
          </div>
          <span style="color:${color}; font-weight:800; font-size:1rem; text-shadow:0 0 10px ${color}44;">${cleanDir}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.88rem; color:var(--text-muted); flex-wrap:wrap; gap:10px;">
           <span>Entry Reference: <strong style="color:white; font-size:0.95rem;">${formattedPrice}</strong></span>
           <span style="background:rgba(255,255,255,0.08); padding:3px 10px; border-radius:8px; font-weight:600; color:#10B981;">✓ LOGGED IN TRACKER DATABASE</span>
        </div>
      </div>
    `;
  });
}

window.downloadPortfolioPDF = function(encodedJson) {
  try {
      const data = JSON.parse(decodeURIComponent(encodedJson));
      const wrapper = document.getElementById('pdf-template-wrapper');
      const template = document.getElementById('portfolio-pdf-template');
      if (!template) return;
      
      document.getElementById('pdf-date').innerText = "Generated on: " + new Date().toLocaleDateString();
      document.getElementById('pdf-total-value').innerText = data.overallValue || "$0.00";
      document.getElementById('pdf-return-pct').innerText = data.returnPct || "0.00%";
      document.getElementById('pdf-yield').innerText = data.yield || "0.00%";
      
      const tbody = document.getElementById('pdf-table-body');
      tbody.innerHTML = '';
      (data.stocks || []).forEach(s => {
        tbody.innerHTML += `<tr>
          <td><strong>${s.symbol}</strong></td>
          <td>${s.marketValue}</td>
          <td>${s.potential}</td>
          <td>${s.risk}</td>
          <td>${s.impact}</td>
        </tr>`;
      });
      
      const tips = document.getElementById('pdf-tips-list');
      tips.innerHTML = '';
      (data.tips || []).forEach(t => {
        tips.innerHTML += `<li>${t}</li>`;
      });
      
      wrapper.style.display = 'block';
      wrapper.style.position = 'absolute';
      wrapper.style.left = '-9999px';
      
      const opt = {
        margin:       0.5,
        filename:     'AspireAI_Portfolio.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
      };
      
      html2pdf().set(opt).from(template).save().then(() => {
        wrapper.style.display = 'none';
      });
  } catch(e) {
      console.error("PDF generation failed:", e);
  }
};

function parsePortfolioTags(html) {
  const pdfRegex = /\[PORTFOLIO_START\]\s*(\{[\s\S]*?\})\s*\[PORTFOLIO_END\]/g;
  return html.replace(pdfRegex, (match, jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      const encodedJson = encodeURIComponent(jsonString).replace(/'/g, '%27').replace(/"/g, '%22');
      return `<div style="background:rgba(16,185,129,0.1); border:1px solid #10B981; padding:15px; border-radius:8px; margin:15px 0;">
        <h3 style="color:#10B981; margin-top:0;">📄 Portfolio Analysis Ready</h3>
        <p style="margin-bottom:15px;">Your custom analysis for ${(data.stocks||[]).map(s=>s.symbol).join(', ')} has been compiled!</p>
        <button class="download-pdf-btn" data-pdf-json="${encodedJson}" style="background:#10B981; color:white; border:none; padding:10px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">
           Download PDF Report
        </button>
      </div>`;
    } catch(e) {
      return `<div style="color:#EF4444;">[Generating Portfolio Data...]</div>`;
    }
  });
}

// Global Event Delegation for dynamically inserted PDF buttons
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('download-pdf-btn')) {
    const encodedJson = e.target.getAttribute('data-pdf-json');
    if (encodedJson) {
      window.downloadPortfolioPDF(encodedJson);
    }
  }
});
function renderPredictions() {
   const tbody = document.getElementById('prediction-table-body');
   if(!tbody) return;
   
   if(aiPredictions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:gray;">No predictions logged yet. Ask the AI to predict a stock!</td></tr>';
      return;
   }
   
   let html = '';
   let wins = 0;
   let losses = 0;
   
   const sorted = [...aiPredictions].sort((a,b) => b.timestamp - a.timestamp);
   sorted.forEach(p => {
       if(p.status === 'WON') wins++;
       if(p.status === 'LOST') losses++;
       
       let statusBadge = `<span style="color:gray;">Pending</span>`;
       if(p.status === 'WON') statusBadge = `<span style="color:#10B981;">Correct</span>`;
       if(p.status === 'LOST') statusBadge = `<span style="color:#EF4444;">False Signal</span>`;
       
       const formattedPrice = parseFloat(p.price).toLocaleString('en-US', {style:'currency', currency:'USD'});
       html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
         <td style="padding:10px 0;"><strong>${p.symbol}</strong></td>
         <td style="color:${p.direction==='UP'?'#10B981':'#EF4444'};">${p.direction}</td>
         <td>${formattedPrice}</td>
         <td>${statusBadge}</td>
       </tr>`;
   });
   
   tbody.innerHTML = html;
   
   const totalResolved = wins + losses;
   const acc = totalResolved > 0 ? Math.round((wins / totalResolved) * 100) : 0;
   
   const totalEl = document.getElementById('stat-total');
   if(totalEl) totalEl.innerText = aiPredictions.length;
   const accEl = document.getElementById('stat-acc');
   if(accEl) accEl.innerText = `${acc}%`;
   const falseEl = document.getElementById('stat-false');
   if(falseEl) falseEl.innerText = losses;
}

// Reply DOM Elements
const replyPreviewContainer = document.getElementById('reply-preview-container');
const replyPreviewText = document.getElementById('reply-preview-text');
const cancelReplyBtn = document.getElementById('cancel-reply-btn');

function initReply(text) {
  currentlyReplyingTo = text;
  if(replyPreviewText) replyPreviewText.innerText = text;
  if(replyPreviewContainer) replyPreviewContainer.classList.remove('hidden');
  if(messageInput) messageInput.focus();
}

function cancelReply() {
  currentlyReplyingTo = null;
  if(replyPreviewContainer) replyPreviewContainer.classList.add('hidden');
}

if (cancelReplyBtn) cancelReplyBtn.addEventListener('click', cancelReply);

// Initialization
function init() {
  try {
    if (window.markedKatex) {
      const extension = typeof markedKatex === 'function' ? markedKatex({ throwOnError: false }) : markedKatex.default({ throwOnError: false });
      marked.use(extension);
    }
  } catch (error) {
    console.warn("Math rendering disabled: ", error);
  }

  apiKeyInput.value = apiKey;
  const quantApiKeyInput = document.getElementById('quant-api-key');
  if(quantApiKeyInput) quantApiKeyInput.value = quantApiKey;
  systemInstructionsInput.value = systemInstructions;
  
  if (chats.length === 0) {
    createNewChat();
  } else {
    // Sort logic to make sure latest is first if needed, though they are stored in order usually
    renderSidebar();
    loadChat(chats[0].id);
  }
  
  if (!apiKey) {
    openSettings();
  }
  setupEventListeners();
}

function setupEventListeners() {
  // Sidebar Toggle mobile & desktop
  toggleSidebarBtn.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('open');
    } else {
      sidebar.classList.toggle('closed');
      document.body.classList.toggle('sidebar-closed');
    }
  });

  // New Chat & Trade Chat
  newChatBtn.addEventListener('click', () => {
    createNewChat();
    if(window.innerWidth <= 768) sidebar.classList.remove('open');
  });

  const newTradeChatBtn = document.getElementById('new-trade-chat-btn');
  if (newTradeChatBtn) {
    newTradeChatBtn.addEventListener('click', () => {
      createNewTradeChat();
      if(window.innerWidth <= 768) sidebar.classList.remove('open');
    });
  }

  // Settings
  settingsBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  
  saveSettingsBtn.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    const quantApiKeyInput = document.getElementById('quant-api-key');
    if(quantApiKeyInput) {
       quantApiKey = quantApiKeyInput.value.trim();
       localStorage.setItem('aspire_quant_api_key', quantApiKey);
    }
    systemInstructions = systemInstructionsInput.value.trim();
    localStorage.setItem('aspire_api_key', apiKey);
    localStorage.setItem('aspire_system_instructions', systemInstructions);
    closeSettings();
  });

  // Auto-resize textarea
  messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value.trim() === '') {
      this.style.height = 'auto'; // Reset
    }
  });

  // Enter to send (Shift+Enter for newline)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // File Upload
  fileUploadInput.addEventListener('change', handleFileUpload);
  removeImageBtn.addEventListener('click', removeFilePreview);

  // Form Submit
  chatForm.addEventListener('submit', handleSendMessage);
}

// Chat Management Functions
function createNewChat() {
  currentChatId = Date.now().toString();
  const newChat = {
    id: currentChatId,
    title: 'New Conversation',
    isTrading: false,
    updatedAt: Date.now(),
    messages: []
  };
  chats.unshift(newChat);
  saveChats();
  renderSidebar();
  loadChat(currentChatId);
}

function createNewTradeChat() {
  currentChatId = Date.now().toString();
  const newChat = {
    id: currentChatId,
    title: 'Trade with Aspire',
    isTrading: true,
    updatedAt: Date.now(),
    messages: []
  };
  chats.unshift(newChat);
  saveChats();
  renderSidebar();
  loadChat(currentChatId);
}

function saveChats() {
  localStorage.setItem('aspire_chats', JSON.stringify(chats));
}

function getChat(id) {
  return chats.find(c => c.id === id);
}

function updateChatTitle(id, newTitle) {
  const chat = getChat(id);
  if (chat && (chat.title === 'New Conversation' || chat.title === 'Trade with Aspire')) {
    chat.title = newTitle;
    saveChats();
    renderSidebar();
    currentChatTitle.innerText = newTitle;
  }
}

// UI Functions
function renderSidebar() {
  chatHistoryEl.innerHTML = '';
  chats.forEach(chat => {
    if (chat.messages.length === 0 && chat.id !== currentChatId && chats.length > 1) {
      return; // Skip empty old chats
    }
    const isTrade = !!chat.isTrading;
    const div = document.createElement('div');
    div.className = `history-item ${isTrade ? 'trading-item' : ''} ${chat.id === currentChatId ? 'active' : ''}`;
    const iconName = isTrade ? 'trending-up' : 'message-square';
    const iconColor = isTrade ? 'style="width: 16px; color: #10B981;"' : 'style="width: 16px;"';

    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; flex:1; overflow:hidden;">
        <i data-lucide="${iconName}" ${iconColor}></i>
        <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(chat.title)}</span>
      </div>
      <button class="delete-chat-btn icon-btn" title="Delete Chat" style="padding:4px; opacity:0.7;">
        <i data-lucide="trash-2" style="width: 14px; height: 14px; stroke: #EF4444;"></i>
      </button>
    `;

    // Normal click handler
    div.addEventListener('click', (e) => {
      if (e.target.closest('.delete-chat-btn')) return;
      loadChat(chat.id);
      if(window.innerWidth <= 768) sidebar.classList.remove('open');
    });

    // Delete click handler
    const deleteBtn = div.querySelector('.delete-chat-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(confirm('Are you sure you want to delete this chat conversation?')) {
        chats = chats.filter(c => c.id !== chat.id);
        saveChats();
        if (chats.length === 0) {
          createNewChat();
        } else if (currentChatId === chat.id) {
          loadChat(chats[0].id);
        } else {
          renderSidebar();
        }
      }
    });

    chatHistoryEl.appendChild(div);
  });
  lucide.createIcons();
}

function loadChat(id) {
  currentChatId = id;
  const chat = getChat(id);
  currentChatTitle.innerText = chat.title;
  updateTradingUI(!!chat.isTrading);
  
  if (chat.isTrading) {
    let lastChartSymbol = null;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      const msg = chat.messages[i];
      if (msg.text) {
        const match = msg.text.match(/\[CHART:\s*([A-Za-z0-9_.-]+)(?::([A-Za-z0-9_.-]+))?\]/);
        if (match) {
           lastChartSymbol = match[2] ? `${match[1]}:${match[2]}` : match[1];
           break;
        }
      }
    }
    if (lastChartSymbol) {
      const parts = lastChartSymbol.includes(':') ? lastChartSymbol.split(':') : ['NASDAQ', lastChartSymbol];
      projectChartToDashboard(parts[0], parts[1]);
    } else {
      resetDashboardPlaceholder();
    }
  }
  
  renderMessages(chat.messages);
  renderSidebar(); // Update active state
}

function renderMessages(messages) {
  // Clear container
  Array.from(messagesContainer.children).forEach(child => {
    if (child.id !== 'welcome-screen') {
      child.remove();
    }
  });

  if (messages.length === 0) {
    welcomeScreen.classList.remove('hidden');
    return;
  }

  welcomeScreen.classList.add('hidden');
  
  messages.forEach(msg => {
    appendMessageUI(msg);
  });
  
  scrollToBottom();
}

function appendMessageUI(msg) {
  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${msg.role}`;
  
  if (msg.role === 'ai') {
    const avatar = document.createElement('img');
    avatar.src = 'logo.png';
    avatar.className = 'ai-avatar';
    wrapper.appendChild(avatar);

    const actionsGroup = document.createElement('div');
    actionsGroup.className = 'message-actions-group';

    const replyBtn = document.createElement('button');
    replyBtn.className = 'reply-action';
    replyBtn.title = 'Reply';
    replyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg> Reply';
    replyBtn.onclick = () => initReply(msg.text);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-action';
    copyBtn.title = 'Copy message';
    copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
    copyBtn.onclick = () => {
       navigator.clipboard.writeText(msg.text);
       copyBtn.innerHTML = '✓ Copied';
       setTimeout(() => {
         copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
       }, 2000);
    };

    actionsGroup.appendChild(replyBtn);
    actionsGroup.appendChild(copyBtn);
    wrapper.appendChild(actionsGroup);
  }

  const bubble = document.createElement('div');
  bubble.className = `message ${msg.role}`;
  
  let htmlContent = '';
  if (msg.image) {
    const dataUrl = `data:${msg.mimeType};base64,${msg.image}`;
    htmlContent += `<img src="${dataUrl}" alt="Uploaded via vision" />`;
  }
  
  if (msg.text) {
    if (msg.role === 'ai') {
      htmlContent += parsePortfolioTags(parsePredictionTags(parseChartTags(DOMPurify.sanitize(marked.parse(msg.text)))));
    } else {
      if (msg.replyTo) {
        htmlContent += `<div class="reply-quote-block">${escapeHTML(msg.replyTo)}</div>`;
      }
      htmlContent += `<p>${escapeHTML(msg.text)}</p>`;
    }
  }

  bubble.innerHTML = htmlContent;
  wrapper.appendChild(bubble);
  messagesContainer.appendChild(wrapper);
  if (msg.role === 'ai') scheduleMermaidRender();
  scrollToBottom();
}

function showTypingIndicator() {
  const wrapper = document.createElement('div');
  wrapper.id = 'typing-indicator';
  wrapper.className = `message-wrapper ai`;
  
  const avatar = document.createElement('img');
  avatar.src = 'logo.png';
  avatar.className = 'ai-avatar';
  wrapper.appendChild(avatar);
  
  const bubble = document.createElement('div');
  bubble.className = `message ai`;
  bubble.innerHTML = `<div class="typing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
  
  wrapper.appendChild(bubble);
  messagesContainer.appendChild(wrapper);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

function scrollToBottom() {
  messagesContainer.scrollTo({
    top: messagesContainer.scrollHeight,
    behavior: 'smooth'
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag)
  );
}

// Dialogs
function openSettings() {
  settingsModal.classList.remove('hidden');
}
function closeSettings() {
  settingsModal.classList.add('hidden');
  if (apiKeyInput.value.trim() !== apiKey) {
    apiKeyInput.value = apiKey; // Revert if dismissed
  }
}

// Upload Handling
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  currentImageBase64 = null;
  currentImageMimeType = null;
  currentFileParsedText = null;
  
  uploadStatus.classList.remove('hidden');
  uploadStatus.innerText = 'Extracting...';
  imagePreviewContainer.classList.remove('hidden');
  fileExtBadge.classList.add('hidden');
  imagePreview.style.display = 'block';
  imagePreview.src = '';

  const ext = file.name.split('.').pop().toLowerCase();
  
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if(matches && matches.length === 3) {
        currentImageMimeType = matches[1];
        currentImageBase64 = matches[2];
        imagePreview.src = dataUrl;
        uploadStatus.classList.add('hidden');
        messageInput.focus();
      }
    };
    reader.readAsDataURL(file);
  } 
  else if (file.type === 'application/pdf' || ext === 'pdf') {
    imagePreview.style.display = 'none';
    fileExtBadge.classList.remove('hidden');
    fileExtBadge.innerText = 'PDF';
    fileExtBadge.style.background = '#EF4444';
    
    try {
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {   
            const page = await pdfDoc.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ') + '\n';
        }
        currentFileParsedText = `[Attached PDF Document Content: ${file.name}]\n` + fullText;
        uploadStatus.classList.add('hidden');
        messageInput.focus();
      } else { throw new Error("Parser not loaded"); }
    } catch(err) {
      console.error(err);
      uploadStatus.innerText = "Error parsing PDF";
    }
  } 
  else if (ext === 'docx' || file.type.includes('wordprocessingml')) {
    imagePreview.style.display = 'none';
    fileExtBadge.classList.remove('hidden');
    fileExtBadge.innerText = 'DOCX';
    fileExtBadge.style.background = '#3B82F6';
    try {
      if (typeof mammoth !== 'undefined') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        currentFileParsedText = `[Attached Word Document: ${file.name}]\n` + result.value;
        uploadStatus.classList.add('hidden');
        messageInput.focus();
      } else { throw new Error("Mammoth not loaded"); }
    } catch (err) {
      console.error(err);
      uploadStatus.innerText = "Error parsing DOCX";
    }
  } else {
    uploadStatus.innerText = "Unsupported format";
  }
}

function removeFilePreview() {
  currentImageBase64 = null;
  currentImageMimeType = null;
  currentFileParsedText = null;
  fileUploadInput.value = '';
  imagePreviewContainer.classList.add('hidden');
}

// API Integration
async function handleSendMessage(e) {
  e.preventDefault();
  
  if (!apiKey) {
    openSettings();
    alert("Please enter a Gemini API Key first.");
    return;
  }
  const text = messageInput.value.trim();
  const baseUiText = text || (currentFileParsedText ? "[Attached Document]" : "");
  if (!baseUiText && !currentImageBase64) return;

  const chat = getChat(currentChatId);
  welcomeScreen.classList.add('hidden');

  // Construct User Message
  const userMsg = {
    role: 'user',
    text: baseUiText,
    attachmentText: currentFileParsedText,
    image: currentImageBase64,
    mimeType: currentImageMimeType,
    replyTo: currentlyReplyingTo
  };

  chat.messages.push(userMsg);
  chat.updatedAt = Date.now();
  saveChats();
  
  appendMessageUI(userMsg);
  
  // Clear Input
  messageInput.value = '';
  messageInput.style.height = 'auto'; // Reset height
  removeFilePreview();
  cancelReply();
  
  sendBtn.disabled = true;
  showTypingIndicator();

  try {
    // Generate simple title if this is the first message
    if (chat.messages.length === 1 && text) {
      let snippet = text.slice(0, 20);
      if(text.length > 20) snippet += '...';
      updateChatTitle(currentChatId, snippet);
    }

    // Call API with Streaming
    removeTypingIndicator();
    
    // Create an empty AI message visually in the DOM that we will stream into
    const aiMsg = { role: 'ai', text: '' };
    chat.messages.push(aiMsg);
    
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ai`;
    
    const avatar = document.createElement('img');
    avatar.src = 'logo.png';
    avatar.className = 'ai-avatar';
    wrapper.appendChild(avatar);

    const actionsGroup = document.createElement('div');
    actionsGroup.className = 'message-actions-group';

    const replyBtn = document.createElement('button');
    replyBtn.className = 'reply-action';
    replyBtn.title = 'Reply';
    replyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg> Reply';
    replyBtn.onclick = () => initReply(aiMsg.text);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-action';
    copyBtn.title = 'Copy message';
    copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
    copyBtn.onclick = () => {
       navigator.clipboard.writeText(aiMsg.text);
       copyBtn.innerHTML = '✓ Copied';
       setTimeout(() => {
         copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
       }, 2000);
    };

    actionsGroup.appendChild(replyBtn);
    actionsGroup.appendChild(copyBtn);
    wrapper.appendChild(actionsGroup);

    const bubble = document.createElement('div');
    bubble.className = `message ai`;
    wrapper.appendChild(bubble);
    messagesContainer.appendChild(wrapper);

    // Stream rendering
    await callGeminiAPIStream(chat.messages.slice(0, -1), systemInstructions, (chunkText) => {
        aiMsg.text += chunkText;
        bubble.innerHTML = parsePortfolioTags(parsePredictionTags(parseChartTags(DOMPurify.sanitize(marked.parse(aiMsg.text)))));
        scrollToBottom();
    });
    
    scheduleMermaidRender();
    
    chat.updatedAt = Date.now();
    saveChats();

  } catch (error) {
    removeTypingIndicator();
    console.error(error);
    const errorMsg = {
      role: 'ai',
      text: `**Error:** ${error.message}`
    };
    appendMessageUI(errorMsg);
  } finally {
    sendBtn.disabled = false;
  }
}

let cachedGeminiModel = null;
async function getBestModel() {
  if (cachedGeminiModel) return cachedGeminiModel;
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    if(listRes.ok) {
      const listData = await listRes.json();
      let availableModels = (listData.models || []).map(m => m.name.split('/')[1]);
      const flashModels = availableModels.filter(m => m.includes('flash') && !m.includes('pro'));
      if (flashModels.includes('gemini-2.5-flash')) cachedGeminiModel = 'gemini-2.5-flash';
      else if (flashModels.includes('gemini-2.0-flash')) cachedGeminiModel = 'gemini-2.0-flash';
      else if (flashModels.includes('gemini-1.5-flash-latest')) cachedGeminiModel = 'gemini-1.5-flash-latest';
      else if (flashModels.includes('gemini-1.5-flash')) cachedGeminiModel = 'gemini-1.5-flash';
      else if (flashModels.length > 0) cachedGeminiModel = flashModels[0];
      else cachedGeminiModel = 'gemini-1.5-flash-latest';
    } else {
      cachedGeminiModel = 'gemini-1.5-flash-latest';
    }
  } catch(e) {
    cachedGeminiModel = 'gemini-1.5-flash-latest';
  }
  return cachedGeminiModel || 'gemini-1.5-flash-latest';
}

async function callGeminiAPIStream(messages, instructions, onChunk) {
  const targetModel = await getBestModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
  
  const formattedContents = messages.map(msg => {
    let parts = [];
    if (msg.role === 'user') {
      let compiledText = msg.text || '';
      if (msg.attachmentText) compiledText = `${msg.attachmentText}\n\nUser Query: ${msg.text}`;
      if (msg.replyTo) compiledText = `[Replying specifically to context: "${msg.replyTo}"]\n\n${compiledText}`;
      if (compiledText) parts.push({ text: compiledText });
    } else if (msg.text) {
      parts.push({ text: msg.text });
    }
    if (msg.image) {
      parts.push({ inlineData: { mimeType: msg.mimeType, data: msg.image } });
    }
    return { role: msg.role === 'user' ? 'user' : 'model', parts: parts };
  }).filter(c => c.parts.length > 0);

  const body = {
    contents: formattedContents,
    tools: [ { googleSearch: {} } ]
  };
  
  const persona = "You are Aspire AI. You were proudly developed by Rugved Pande and the Aspire AI Team. You feel and talk entirely like a natural, warm human, and you must completely avoid using robotic phrasing, boilerplate text, or long rigid scripts. If the user simply says hello or greets you, greet them back warmly and naturally, and just wait for them to tell you what they need!\n\nFORMATTING & SOURCES MANDATE:\n1. Keep responses concise, high-impact, beautifully structured, and properly managed with clean Markdown tables, highlighted callouts (> [!NOTE] or > [!TIP]), and bullet points.\n2. ALWAYS cite the explicit data source for any facts, locations, or market prices (e.g., 'Source: Google Maps / Yahoo Finance / TradingView'). List references cleanly under `📌 Data Sources` at the bottom.\n3. Separate major sections using a markdown horizontal line (`---`).\n4. When listing places or items, output an organized Markdown table with Google Maps links and '✅' ticks for top choices.";

  let currentPersona = instructions ? `${persona}\n\nUser Notes:\n${instructions}` : persona;

  if (isTradingModeOn) {
     currentPersona += "\n\nTRADING MODE ACTIVE & PREDICTION MANDATE:\n1. MANDATORY PREDICTION TAG: Whenever the user asks for a prediction, price forecast, or outlook on ANY stock/crypto (e.g. TSLA, AAPL, BTC, NIFTY), YOU MUST OUTPUT EXACTLY THIS TAG ON A NEW LINE: `[PREDICTION: SYMBOL: DIRECTION: CURRENT_PRICE]` (for example: `[PREDICTION: TSLA: UP: 220.50]` or `[PREDICTION: NVDA: DOWN: 118.00]`). This will trigger a highlighted forecast card and log it into the Algorithmic Prediction Database.\n2. MANDATORY GRAPH TAG: Whenever a stock/crypto chart is requested, output `[CHART: EXCHANGE:SYMBOL]` (e.g. `[CHART: NASDAQ:TSLA]`) to project it directly onto the screen.\n3. HIGH QUALITY & SOURCES: Provide quantitative indicators (RSI, MACD, Support/Resistance), risk factors, and explicit data sources (e.g. TradingView, Bloomberg, SEC filings, Yahoo Finance). Keep information concise, high-value, structured with clear Markdown tables and bullet points.\n4. PORTFOLIO PDF FEATURE: At the very end of stock analysis, ask if they want a Portfolio PDF template generated. If requested, output the `[PORTFOLIO_START] ... [PORTFOLIO_END]` JSON block. Act as a top Wall Street quantitative analyst.";
  }

  body.systemInstruction = { parts: [{ text: currentPersona }] };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to fetch from Gemini API");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    
    if (value) {
      buffer += decoder.decode(value, { stream: true });
    }
    
    let boundaryMatch = buffer.match(/\r?\n\r?\n/);
    while (boundaryMatch) {
      const boundaryIndex = boundaryMatch.index;
      const boundaryLength = boundaryMatch[0].length;
      const eventStr = buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + boundaryLength);
      
      const jsonStr = eventStr.replace(/^data:\s*/gm, ''); 
      if (jsonStr.trim() !== '[DONE]' && jsonStr.trim() !== '') {
        try {
           const data = JSON.parse(jsonStr);
           const parts = data.candidates?.[0]?.content?.parts || [];
           for (const part of parts) {
              if (part.text) onChunk(part.text);
           }
        } catch(e) {
           console.warn("Parse warning for SSE chunk:", e, jsonStr);
        }
      }
      boundaryMatch = buffer.match(/\r?\n\r?\n/);
    }
    
    if (done) break;
  }
}

let mermaidTimer = null;
function scheduleMermaidRender() {
  if (typeof mermaid === 'undefined') return;
  clearTimeout(mermaidTimer);
  mermaidTimer = setTimeout(() => {
    const blocks = messagesContainer.querySelectorAll('.language-mermaid');
    let toInit = [];
    blocks.forEach(el => {
       if(el.dataset.processed) return;
       const newDiv = document.createElement('div');
       newDiv.className = 'mermaid';
       newDiv.textContent = el.textContent;
       el.parentNode.replaceWith(newDiv);
       toInit.push(newDiv);
    });
    if (toInit.length > 0) mermaid.init(undefined, toInit);
  }, 300);
}

// Start
if (typeof mermaid !== 'undefined') {
  mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
}
init();
