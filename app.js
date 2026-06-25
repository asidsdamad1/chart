// Default data points representing years 2021 to 2025
// with September points and April-September 2025 detail
const DEFAULT_DATA = [
  { label: '09/2021', supreme: 450, high: 520 },
  { label: '09/2022', supreme: 480, high: 590 },
  { label: '09/2023', supreme: 530, high: 680 },
  { label: '09/2024', supreme: 610, high: 790 },
  { label: '04/2025', supreme: 630, high: 820 },
  { label: '05/2025', supreme: 650, high: 840 },
  { label: '06/2025', supreme: 670, high: 860 },
  { label: '07/2025', supreme: 700, high: 890 },
  { label: '08/2025', supreme: 730, high: 920 },
  { label: '09/2025', supreme: 760, high: 950 }
];

// Active State
let chartLines = JSON.parse(localStorage.getItem('chart_lines')) || [
  { id: 'supreme', name: 'Tối cao', color: 'supreme', style: 'solid', point: 'circle' },
  { id: 'high', name: 'Cấp cao', color: 'high', style: 'dashed', point: 'triangle' }
];

let dataPoints = JSON.parse(localStorage.getItem('chart_data_points')) || [...DEFAULT_DATA];
let chart = null;

// Constants for styles supporting Dark & Light themes
const COLORS = {
  supreme: {
    solid: '#f59e0b',
    lightSolid: '#d97706',
    glow: 'rgba(245, 158, 11, 0.4)'
  },
  high: {
    solid: '#06b6d4',
    lightSolid: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.4)'
  },
  pink: {
    solid: '#ec4899',
    lightSolid: '#db2777',
    glow: 'rgba(236, 72, 153, 0.5)',
    dash: [6, 6]
  },
  orange: {
    solid: '#f59e0b',
    lightSolid: '#d97706',
    glow: 'rgba(245, 158, 11, 0.5)',
    dash: [6, 6]
  },
  cyan: {
    solid: '#06b6d4',
    lightSolid: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.5)',
    dash: [6, 6]
  },
  white: {
    solid: '#ffffff',
    lightSolid: '#334155',
    glow: 'rgba(255, 255, 255, 0.5)',
    dash: [6, 6]
  },
  black: {
    solid: '#64748b',
    lightSolid: '#000000',
    glow: 'rgba(0, 0, 0, 0.15)',
    dash: [6, 6]
  }
};

// Map Dash Style selector to Chart.js dash patterns
const DASH_STYLES = {
  solid: [],
  dashed: [6, 6],
  dotted: [2, 3],
  dashdot: [8, 4, 2, 4]
};

// Map Point Styles to Unicode representations for HTML legends
const SYMBOLS = {
  circle: '●',
  rect: '■',
  triangle: '▲',
  star: '★',
  cross: '✚'
};

// DOM Elements
const yAutoScale = document.getElementById('y-auto-scale');
const yMinInput = document.getElementById('y-min');
const yMaxInput = document.getElementById('y-max');
const yStepInput = document.getElementById('y-step');
const ySuffixInput = document.getElementById('y-suffix');

const linesListContainer = document.getElementById('lines-list-container');
const btnAddLine = document.getElementById('btn-add-line');

const segmentEnabled = document.getElementById('segment-enabled');
const segmentStartSelect = document.getElementById('segment-start');
const segmentEndSelect = document.getElementById('segment-end');
const segmentStyleSelect = document.getElementById('segment-style');
const segmentColorSelect = document.getElementById('segment-color');
const segmentPointSelect = document.getElementById('segment-point');

const dataTableHead = document.getElementById('data-table-head');
const dataTableBody = document.getElementById('data-table-body');
const btnAddRow = document.getElementById('btn-add-row');
const btnResetData = document.getElementById('btn-reset-data');

const btnExportPng = document.getElementById('btn-export-png');
const btnCopyJson = document.getElementById('btn-copy-json');
const btnPrint = document.getElementById('btn-print');
const btnThemeToggle = document.getElementById('btn-theme-toggle');

// Save all axis settings to localStorage
function saveAxisSettings() {
  const settings = {
    autoScale: yAutoScale.checked,
    min: yMinInput.value,
    max: yMaxInput.value,
    step: yStepInput.value,
    suffix: ySuffixInput.value
  };
  localStorage.setItem('chart_axis_settings', JSON.stringify(settings));
}

// Restore axis settings from localStorage and sync disabled state
function restoreAxisSettings() {
  const saved = JSON.parse(localStorage.getItem('chart_axis_settings'));
  if (!saved) return;

  yAutoScale.checked = saved.autoScale !== false; // default true
  if (saved.min !== undefined)    yMinInput.value  = saved.min;
  if (saved.max !== undefined)    yMaxInput.value  = saved.max;
  if (saved.step !== undefined)   yStepInput.value = saved.step;
  if (saved.suffix !== undefined) ySuffixInput.value = saved.suffix;

  // Sync disabled state with saved autoScale
  const manual = !yAutoScale.checked;
  yMinInput.disabled  = !manual;
  yMaxInput.disabled  = !manual;
  yStepInput.disabled = !manual;
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Restore Theme preference
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeUI();
  }

  restoreAxisSettings();
  renderLinesManager();
  renderTable();
  updateDropdowns();
  
  // Set default segment options from active state
  setSelectValueIfContains(segmentStartSelect, '09/2024');
  setSelectValueIfContains(segmentEndSelect, '09/2025');
  
  initChart();
  setupEventListeners();
  updateChart();
});

// Helper to select default option if it exists
function setSelectValueIfContains(selectElem, val) {
  for (let i = 0; i < selectElem.options.length; i++) {
    if (selectElem.options[i].value === val) {
      selectElem.selectedIndex = i;
      break;
    }
  }
}

// Render dynamic Lines Manager list in sidebar
function renderLinesManager() {
  if (!linesListContainer) return;
  linesListContainer.innerHTML = '';
  
  chartLines.forEach((line) => {
    const div = document.createElement('div');
    div.className = 'line-config-item';
    div.setAttribute('data-line-id', line.id);
    div.style.border = '1px solid var(--border-color)';
    div.style.borderRadius = '6px';
    div.style.padding = '8px 10px';
    div.style.background = 'rgba(255, 255, 255, 0.015)';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '6px';
    
    // Disable deletion if only one line exists
    const deleteDisabled = chartLines.length <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : '';
    
    div.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <input type="text" class="line-name-input table-input" data-line-id="${line.id}" value="${line.name}" style="flex: 1; font-weight: 600; padding: 4px 8px; font-size: 0.8rem;" placeholder="Tên đường...">
        <button class="btn btn-danger btn-delete-line" data-line-id="${line.id}" ${deleteDisabled} style="padding: 4px 6px; font-size: 0.75rem;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
        <div>
          <label style="font-size: 0.7rem; margin-bottom: 2px; display: block; color: var(--text-secondary);">Màu sắc</label>
          <select class="line-color-select" data-line-id="${line.id}" style="width: 100%; padding: 2px 4px; font-size: 0.7rem; border-radius: 4px;">
            <option value="supreme" ${line.color === 'supreme' ? 'selected' : ''}>Cam</option>
            <option value="high" ${line.color === 'high' ? 'selected' : ''}>Xanh lam</option>
            <option value="pink" ${line.color === 'pink' ? 'selected' : ''}>Hồng</option>
            <option value="orange" ${line.color === 'orange' ? 'selected' : ''}>Vàng cam</option>
            <option value="cyan" ${line.color === 'cyan' ? 'selected' : ''}>Cyan</option>
            <option value="white" ${line.color === 'white' ? 'selected' : ''}>Trắng/Xám</option>
          </select>
        </div>
        <div>
          <label style="font-size: 0.7rem; margin-bottom: 2px; display: block; color: var(--text-secondary);">Kiểu nét</label>
          <select class="line-style-select" data-line-id="${line.id}" style="width: 100%; padding: 2px 4px; font-size: 0.7rem; border-radius: 4px;">
            <option value="solid" ${line.style === 'solid' ? 'selected' : ''}>Nét liền</option>
            <option value="dashed" ${line.style === 'dashed' ? 'selected' : ''}>Nét đứt</option>
            <option value="dotted" ${line.style === 'dotted' ? 'selected' : ''}>Nhỏ giọt</option>
            <option value="dashdot" ${line.style === 'dashdot' ? 'selected' : ''}>Gạch-đứt</option>
          </select>
        </div>
        <div>
          <label style="font-size: 0.7rem; margin-bottom: 2px; display: block; color: var(--text-secondary);">Điểm mốc</label>
          <select class="line-point-select" data-line-id="${line.id}" style="width: 100%; padding: 2px 4px; font-size: 0.7rem; border-radius: 4px;">
            <option value="circle" ${line.point === 'circle' ? 'selected' : ''}>Tròn ●</option>
            <option value="rect" ${line.point === 'rect' ? 'selected' : ''}>Vuông ■</option>
            <option value="triangle" ${line.point === 'triangle' ? 'selected' : ''}>Tam giác ▲</option>
            <option value="star" ${line.point === 'star' ? 'selected' : ''}>Sao ★</option>
            <option value="cross" ${line.point === 'cross' ? 'selected' : ''}>Chữ thập +</option>
          </select>
        </div>
      </div>
    `;
    linesListContainer.appendChild(div);
  });
}

// Render dynamic inputs in table based on customized datasets
function renderTable() {
  // 1. Render Table Head
  if (dataTableHead) {
    let tr = document.createElement('tr');
    tr.innerHTML = `<th style="min-width: 90px; max-width: 120px;">Thời gian</th>`;
    chartLines.forEach(line => {
      tr.innerHTML += `<th style="text-align: center; font-size: 0.82rem;">${line.name}</th>`;
    });
    tr.innerHTML += `<th style="min-width: 45px; text-align: center;">Xóa</th>`;
    dataTableHead.innerHTML = '';
    dataTableHead.appendChild(tr);
  }

  // 2. Render Table Body
  dataTableBody.innerHTML = '';
  dataPoints.forEach((pt, index) => {
    const row = document.createElement('tr');
    
    let cellsHtml = `
      <td>
        <input type="text" class="table-input col-label" data-index="${index}" value="${pt.label}">
      </td>
    `;
    
    chartLines.forEach(line => {
      const val = pt[line.id] !== undefined ? pt[line.id] : 0;
      cellsHtml += `
        <td>
          <input type="number" class="table-input col-value" data-index="${index}" data-line-id="${line.id}" value="${val === null ? '' : val}" placeholder="-">
        </td>
      `;
    });
    
    cellsHtml += `
      <td>
        <button class="btn btn-danger btn-delete-row" data-index="${index}" style="padding: 4px 8px; font-size: 0.75rem;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;
    row.innerHTML = cellsHtml;
    dataTableBody.appendChild(row);
  });
}

// Update segment selection dropdowns
function updateDropdowns() {
  const startVal = segmentStartSelect.value;
  const endVal = segmentEndSelect.value;
  
  segmentStartSelect.innerHTML = '';
  segmentEndSelect.innerHTML = '';
  
  dataPoints.forEach((pt) => {
    const optStart = document.createElement('option');
    optStart.value = pt.label;
    optStart.textContent = pt.label;
    segmentStartSelect.appendChild(optStart);
    
    const optEnd = document.createElement('option');
    optEnd.value = pt.label;
    optEnd.textContent = pt.label;
    segmentEndSelect.appendChild(optEnd);
  });

  // Try to preserve previous selections
  if (startVal) segmentStartSelect.value = startVal;
  if (endVal) segmentEndSelect.value = endVal;
  
  // Default fallbacks if empty or invalid
  if (!segmentStartSelect.value && dataPoints.length > 3) {
    segmentStartSelect.value = dataPoints[dataPoints.length - 7].label; // approx 2024
  }
  if (!segmentEndSelect.value && dataPoints.length > 0) {
    segmentEndSelect.value = dataPoints[dataPoints.length - 1].label; // last point
  }
}

// Generate background gradients for chart fills
function createGradient(ctx, area, colorStart, colorEnd) {
  if (!ctx || !area) return null;
  const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
}

// Helper to get active color for either theme
function getThemeColor(key, styleType = 'solid') {
  const isLight = document.body.classList.contains('light-theme');
  const palette = COLORS[key];
  if (!palette) return '#94a3b8';
  if (isLight && styleType === 'solid') {
    return palette.lightSolid || palette.solid;
  }
  return palette[styleType] || palette.solid;
}

// Custom plugin to add shadow/glow effect on lines (disabled automatically in print/light view)
const lineShadowPlugin = {
  id: 'lineShadow',
  beforeDatasetDraw: (chart, args) => {
    const isLight = document.body.classList.contains('light-theme');
    const { ctx } = chart;
    const { meta } = args;
    
    ctx.save();
    
    if (isLight) {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      return;
    }
    
    const datasetIndex = meta.index;
    const lineConfig = chartLines[datasetIndex];
    if (lineConfig) {
      ctx.shadowColor = COLORS[lineConfig.color] ? COLORS[lineConfig.color].solid : 'transparent';
    } else {
      ctx.shadowColor = 'transparent';
    }
    
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  },
  afterDatasetDraw: (chart) => {
    chart.ctx.restore();
  }
};

// Plugin vẽ nhãn điểm cuối trục X luôn hiển thị, kể cả khi bị autoSkip bỏ qua
const lastXTickPlugin = {
  id: 'lastXTick',
  afterDraw: (chartInstance) => {
    const xScale = chartInstance.scales.x;
    if (!xScale || xScale.type !== 'time') return;

    const lastPoint = dataPoints[dataPoints.length - 1];
    if (!lastPoint) return;
    const lastDate = parseLabelToDate(lastPoint.label);
    if (!lastDate) return;

    // Tính toán vị trí pixel X của điểm dữ liệu cuối cùng
    const xPixel = xScale.getPixelForValue(lastDate.valueOf());
    const yPixel = xScale.bottom; // Đáy của trục X

    // Kiểm tra xem tick cuối đã có label hiển thị tại vị trí này chưa
    const THRESHOLD = 20; // px — nếu đã có tick trong vòng 20px thì không vẽ thêm
    const alreadyVisible = xScale.ticks.some(tick => {
      const tickPx = xScale.getPixelForValue(tick.value);
      return Math.abs(tickPx - xPixel) < THRESHOLD;
    });
    if (alreadyVisible) return;

    // Vẽ nhãn cuối bằng canvas 2D API
    const { ctx } = chartInstance;
    ctx.save();

    const isLight = document.body.classList.contains('light-theme');
    const labelColor = isLight ? '#475569' : '#94a3b8';

    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Padding nhỏ từ đáy axis
    ctx.fillText(lastPoint.label, xPixel, yPixel + 4);

    // Vẽ tick mark nhỏ
    ctx.strokeStyle = labelColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xPixel, xScale.top);
    ctx.lineTo(xPixel, yPixel);
    ctx.stroke();

    ctx.restore();
  }
};

// Parse label "MM/YYYY" → JS Date (ngày 01 của tháng đó)
function parseLabelToDate(label) {
  if (!label) return null;
  const parts = label.split('/');
  if (parts.length === 2) {
    // MM/YYYY format
    const month = parseInt(parts[0], 10) - 1; // 0-indexed
    const year  = parseInt(parts[1], 10);
    if (!isNaN(month) && !isNaN(year)) return new Date(year, month, 1);
  }
  if (parts.length === 3) {
    // DD/MM/YYYY format
    const day   = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year  = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return new Date(year, month, day);
  }
  // Fallback: thử parse trực tiếp
  const d = new Date(label);
  return isNaN(d.getTime()) ? null : d;
}

// Kiểm tra xem toàn bộ labels có parse được thành Date không
function allLabelsAreTime() {
  return dataPoints.every(p => parseLabelToDate(p.label) !== null);
}

// Initialize Chart.js Instance
function initChart() {
  if (chart) {
    chart.destroy();
  }

  const canvas = document.getElementById('mainChart');
  const ctx = canvas.getContext('2d');
  const isLight = document.body.classList.contains('light-theme');
  
  // Set responsive defaults based on theme
  const textColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)';
  
  Chart.defaults.color = textColor;
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 12;
  
  // Segment configuration logic for "Cấp cao" line (id === 'high')
  const segmentConfig = {
    borderColor: (ctxSegment) => {
      if (!segmentEnabled.checked) return undefined;
      
      const startIndex = dataPoints.findIndex(p => p.label === segmentStartSelect.value);
      const endIndex = dataPoints.findIndex(p => p.label === segmentEndSelect.value);
      const idx = ctxSegment.p0DataIndex;
      
      if (startIndex !== -1 && endIndex !== -1 && idx >= startIndex && idx < endIndex) {
        return getThemeColor(segmentColorSelect.value);
      }
      return undefined;
    },
    borderDash: (ctxSegment) => {
      if (!segmentEnabled.checked) return undefined;
      
      const startIndex = dataPoints.findIndex(p => p.label === segmentStartSelect.value);
      const endIndex = dataPoints.findIndex(p => p.label === segmentEndSelect.value);
      const idx = ctxSegment.p0DataIndex;
      
      if (startIndex !== -1 && endIndex !== -1 && idx >= startIndex && idx < endIndex) {
        const pattern = DASH_STYLES[segmentStyleSelect.value];
        return pattern;
      }
      return undefined;
    }
  };

  // Dùng time scale nếu toàn bộ labels parse được thành Date
  const useTimeScale = allLabelsAreTime();

  // Re-build datasets list dynamically
  const datasets = chartLines.map((line) => {
    const baseColor = getThemeColor(line.color);
    
    return {
      label: line.name,
      data: dataPoints.map(p => {
        const val = p[line.id];
        const y = (val === undefined || val === '') ? null : val;
        return useTimeScale ? { x: parseLabelToDate(p.label), y } : y;
      }),
      borderColor: baseColor,
      borderDash: DASH_STYLES[line.style] || [],
      backgroundColor: (context) => {
        const chartArea = context.chart.chartArea;
        const startAlpha = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.02)';
        return createGradient(context.chart.ctx, chartArea, startAlpha, 'rgba(0, 0, 0, 0.0)');
      },
      borderWidth: 3.5,
      tension: 0, // Đường thẳng tuyệt đối, không có độ cong, không bao giờ võng qua số 0
      fill: true,
      spanGaps: true, // Connect gaps smoothly
      
      // Dynamic point style (supports segment point overriding)
      pointStyle: (ctxPoint) => {
        if (ctxPoint.type !== 'data') return line.point;
        if (line.id === 'high' && segmentEnabled.checked) {
          const idx = ctxPoint.dataIndex;
          const startIndex = dataPoints.findIndex(p => p.label === segmentStartSelect.value);
          const endIndex = dataPoints.findIndex(p => p.label === segmentEndSelect.value);
          if (startIndex !== -1 && endIndex !== -1 && idx >= startIndex && idx <= endIndex) {
            return segmentPointSelect.value;
          }
        }
        return line.point;
      },
      pointBackgroundColor: (ctxPoint) => {
        if (ctxPoint.type !== 'data') return baseColor;
        if (line.id === 'high' && segmentEnabled.checked) {
          const idx = ctxPoint.dataIndex;
          const startIndex = dataPoints.findIndex(p => p.label === segmentStartSelect.value);
          const endIndex = dataPoints.findIndex(p => p.label === segmentEndSelect.value);
          if (startIndex !== -1 && endIndex !== -1 && idx >= startIndex && idx <= endIndex) {
            return getThemeColor(segmentColorSelect.value);
          }
        }
        return baseColor;
      },
      pointBorderColor: '#000000',
      pointBorderWidth: 2,
      
      // HIDE point marker completely if value is 0 or null
      pointRadius: (ctxPoint) => {
        if (ctxPoint.type !== 'data') return 5;
        const raw = ctxPoint.dataset.data[ctxPoint.dataIndex];
        const val = (raw && typeof raw === 'object') ? raw.y : raw;
        if (val === 0 || val === null || val === undefined) return 0;
        return 5;
      },
      pointHoverRadius: (ctxPoint) => {
        if (ctxPoint.type !== 'data') return 7;
        const raw = ctxPoint.dataset.data[ctxPoint.dataIndex];
        const val = (raw && typeof raw === 'object') ? raw.y : raw;
        if (val === 0 || val === null || val === undefined) return 0;
        return 7;
      },
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: (ctxPoint) => {
        if (line.id === 'high' && segmentEnabled.checked) {
          const idx = ctxPoint.dataIndex;
          const startIndex = dataPoints.findIndex(p => p.label === segmentStartSelect.value);
          const endIndex = dataPoints.findIndex(p => p.label === segmentEndSelect.value);
          if (startIndex !== -1 && endIndex !== -1 && idx >= startIndex && idx <= endIndex) {
            return getThemeColor(segmentColorSelect.value);
          }
        }
        return baseColor;
      },
      pointHoverBorderWidth: 3,
      
      // Attach segment configuration to "Cấp cao" line
      segment: line.id === 'high' ? segmentConfig : undefined
    };
  });

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      // labels chỉ dùng khi KHÔNG dùng time scale
      labels: useTimeScale ? undefined : dataPoints.map(p => p.label),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Custom legends rendered dynamically in HTML
        },
        tooltip: {
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 20, 34, 0.95)',
          titleColor: isLight ? '#0f172a' : '#fff',
          bodyColor: isLight ? '#334155' : '#e2e8f0',
          borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          callbacks: {
            title: function(items) {
              // Hiển thị label gốc (MM/YYYY) thay vì timestamp tự động
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              return dataPoints[idx] ? dataPoints[idx].label : items[0].label;
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) { label += ': '; }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toLocaleString() + ySuffixInput.value;
              }
              const idx = context.dataIndex;
              const startIndex = dataPoints.findIndex(p => p.label === segmentStartSelect.value);
              const endIndex = dataPoints.findIndex(p => p.label === segmentEndSelect.value);
              if (context.dataset.label === 'Cấp cao' && segmentEnabled.checked &&
                  startIndex !== -1 && endIndex !== -1 && idx >= startIndex && idx <= endIndex) {
                label += ' (Phân đoạn đặc biệt)';
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: useTimeScale ? {
          type: 'time',
          time: {
            // Hiển thị nhãn theo tháng/năm
            displayFormats: {
              month: 'MM/yyyy',
              quarter: 'MM/yyyy',
              year: 'yyyy'
            },
            tooltipFormat: 'MM/yyyy'
          },
          // Chart.js sẽ tự chọn đơn vị phù hợp (month / quarter / year)
          grid: { color: gridColor, borderColor: borderColor },
          ticks: {
            color: textColor,
            font: { size: 11 },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12,
            includeBounds: true  // Cố gắng hiển thị điểm đầu và điểm cuối
          }
          // Nhãn điểm cuối được đảm bảo bởi lastXTickPlugin
        } : {
          grid: { color: gridColor, borderColor: borderColor },
          ticks: { color: textColor, font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: gridColor,
            borderColor: borderColor
          },
          ticks: {
            color: textColor,
            font: {
              size: 11
            },
            callback: function(value) {
              return value.toLocaleString() + ySuffixInput.value;
            }
          }
        }
      }
    },
    plugins: [lineShadowPlugin, lastXTickPlugin]
  });
}

// Update the chart elements dynamically
function updateChart() {
  if (!chart) return;
  
  const isLight = document.body.classList.contains('light-theme');
  
  // Save state to localStorage
  localStorage.setItem('chart_data_points', JSON.stringify(dataPoints));
  localStorage.setItem('chart_lines', JSON.stringify(chartLines));
  saveAxisSettings();
  
  // Update labels/data — dùng {x,y} nếu time scale
  const useTimeScale = allLabelsAreTime();
  chart.data.labels = useTimeScale ? undefined : dataPoints.map(p => p.label);
  
  // Update data values and custom styling for each active line
  chartLines.forEach((line, index) => {
    const dataset = chart.data.datasets[index];
    if (!dataset) return;
    
    // Update data array
    dataset.data = dataPoints.map(p => {
      const val = p[line.id];
      const y = (val === undefined || val === '') ? null : val;
      return useTimeScale ? { x: parseLabelToDate(p.label), y } : y;
    });
    
    // Update active theme colors
    const baseColor = getThemeColor(line.color);
    dataset.borderColor = baseColor;
    dataset.pointBackgroundColor = baseColor;
    dataset.pointBorderColor = '#000000';
    dataset.pointHoverBorderColor = baseColor;
    
    // Update custom styles
    dataset.borderDash = DASH_STYLES[line.style] || [];
  });
  
  // Re-render Gradient Fills
  const chartArea = chart.chartArea;
  if (chartArea) {
    chartLines.forEach((line, index) => {
      const dataset = chart.data.datasets[index];
      if (!dataset) return;
      const startAlpha = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.02)';
      dataset.backgroundColor = createGradient(chart.ctx, chartArea, startAlpha, 'rgba(0, 0, 0, 0.0)');
    });
  }
  
  // Y-axis Scale configuration
  if (!yAutoScale.checked) {
    chart.options.scales.y.min = parseFloat(yMinInput.value) || 0;
    chart.options.scales.y.max = parseFloat(yMaxInput.value) || 1000;
    chart.options.scales.y.ticks.stepSize = parseFloat(yStepInput.value) || 100;
  } else {
    delete chart.options.scales.y.max;
    delete chart.options.scales.y.ticks.stepSize;
    chart.options.scales.y.min = 0; // Ép buộc trục Y tuyệt đối bắt đầu từ 0
  }
  
  chart.update();
  updateLegendStylesUI();
}

// Generate CSS repeating gradients for line styles in legend indicator boxes
function getLegendBackground(style, color) {
  if (style === 'solid') {
    return color;
  }
  if (style === 'dotted') {
    return `repeating-linear-gradient(90deg, ${color}, ${color} 2px, transparent 2px, transparent 4px)`;
  }
  if (style === 'dashdot') {
    return `repeating-linear-gradient(90deg, ${color}, ${color} 5px, transparent 5px, transparent 7px, ${color} 7px, ${color} 9px, transparent 9px, transparent 11px)`;
  }
  // dashed
  return `repeating-linear-gradient(90deg, ${color}, ${color} 4px, transparent 4px, transparent 8px)`;
}

// Update the visual representation of custom legends dynamically
function updateLegendStylesUI() {
  const legendContainer = document.getElementById('chart-legend-container');
  if (!legendContainer) return;
  legendContainer.innerHTML = '';
  
  const isLight = document.body.classList.contains('light-theme');
  const symbolColor = isLight ? '#000000' : '#ffffff';
  
  // 1. Render Legend for each dynamic line
  chartLines.forEach(line => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    
    const colorSpan = document.createElement('span');
    colorSpan.className = 'legend-color';
    const activeColor = getThemeColor(line.color);
    colorSpan.style.background = getLegendBackground(line.style, activeColor);
    colorSpan.textContent = SYMBOLS[line.point] || '●';
    colorSpan.style.color = symbolColor;
    
    const labelSpan = document.createElement('span');
    labelSpan.style.fontSize = '0.85rem';
    labelSpan.textContent = line.name;
    
    item.appendChild(colorSpan);
    item.appendChild(labelSpan);
    legendContainer.appendChild(item);
  });
  
  // 2. Render special segment legend if Cấp cao (high) is present and segment is active
  const highExists = chartLines.some(l => l.id === 'high');
  if (segmentEnabled.checked && highExists) {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.id = 'legend-dashed-item';
    
    const colorSpan = document.createElement('span');
    colorSpan.className = 'legend-color';
    const segmentColor = getThemeColor(segmentColorSelect.value);
    colorSpan.style.background = getLegendBackground(segmentStyleSelect.value, segmentColor);
    colorSpan.textContent = SYMBOLS[segmentPointSelect.value] || '★';
    colorSpan.style.color = symbolColor;
    
    const labelSpan = document.createElement('span');
    labelSpan.style.fontSize = '0.85rem';
    labelSpan.textContent = 'Cấp cao (Phân đoạn đặc biệt)';
    
    item.appendChild(colorSpan);
    item.appendChild(labelSpan);
    legendContainer.appendChild(item);
  }
}

// Toggle Theme (Light <-> Dark)
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  
  updateThemeUI();
  
  // Update Chart configuration theme elements
  if (chart) {
    const textColor = isLight ? '#475569' : '#94a3b8';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)';
    const borderColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)';
    
    Chart.defaults.color = textColor;
    chart.options.scales.x.grid.color = gridColor;
    chart.options.scales.x.grid.borderColor = borderColor;
    chart.options.scales.x.ticks.color = textColor;
    
    chart.options.scales.y.grid.color = gridColor;
    chart.options.scales.y.grid.borderColor = borderColor;
    chart.options.scales.y.ticks.color = textColor;
    
    chart.options.plugins.tooltip.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 20, 34, 0.95)';
    chart.options.plugins.tooltip.titleColor = isLight ? '#0f172a' : '#fff';
    chart.options.plugins.tooltip.bodyColor = isLight ? '#334155' : '#e2e8f0';
    chart.options.plugins.tooltip.borderColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
  }
  
  updateChart();
}

// Update the Theme Toggle Icon & Text in header
function updateThemeUI() {
  const isLight = document.body.classList.contains('light-theme');
  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');
  
  if (isLight) {
    themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    themeText.textContent = 'Giao diện Tối';
  } else {
    themeIcon.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
    themeText.textContent = 'Giao diện Sáng';
  }
}

// Setup all DOM interaction events
function setupEventListeners() {
  // Panel Collapse/Minimize logic
  document.querySelectorAll('.control-sidebar .glass-panel').forEach(panel => {
    const title = panel.querySelector('.panel-title');
    if (title) {
      title.style.cursor = 'pointer';
      title.title = 'Nhấp để thu gọn/mở rộng';
      
      const iconWrap = document.createElement('div');
      iconWrap.innerHTML = `<svg class="minimize-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.3s; margin-left: auto; color: var(--text-secondary);"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
      title.appendChild(iconWrap.firstChild);
      
      title.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        const icon = title.querySelector('.minimize-icon');
        if (panel.classList.contains('collapsed')) {
          icon.style.transform = 'rotate(180deg)';
        } else {
          icon.style.transform = 'rotate(0deg)';
        }
      });
    }
  });

  // Sidebar Resizer logic
  const sidebar = document.querySelector('.control-sidebar');
  const contentArea = document.querySelector('.content-area');
  
  if (sidebar && contentArea) {
    const resizer = document.createElement('div');
    resizer.className = 'sidebar-resizer';
    // Insert resizer right between sidebar and contentArea
    sidebar.parentNode.insertBefore(resizer, contentArea);
    
    let isResizing = false;
    
    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizer.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const sidebarRect = sidebar.getBoundingClientRect();
      let newWidth = e.clientX - sidebarRect.left;
      
      // Enforce bounds
      if (newWidth < 320) newWidth = 320;
      const maxWidth = window.innerWidth * 0.5; // Max 50% of screen
      if (newWidth > maxWidth) newWidth = maxWidth;
      
      sidebar.style.width = newWidth + 'px';
      
      // Update chart canvas dynamically to prevent distortion
      if (chart) chart.resize();
    });
    
    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizer.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (chart) chart.resize();
      }
    });
  }

  // Theme Toggle click event
  btnThemeToggle.addEventListener('click', toggleTheme);

  // Y-Axis Auto scale checkbox toggle
  yAutoScale.addEventListener('change', () => {
    const isManual = !yAutoScale.checked;
    yMinInput.disabled  = !isManual;
    yMaxInput.disabled  = !isManual;
    yStepInput.disabled = !isManual;
    updateChart();
  });

  // 'Sửa tất cả' button — unlocks all manual axis fields at once
  const btnEditAllAxis = document.getElementById('btn-edit-all-axis');
  if (btnEditAllAxis) {
    btnEditAllAxis.addEventListener('click', () => {
      yAutoScale.checked  = false;   // switch to manual mode
      yMinInput.disabled  = false;
      yMaxInput.disabled  = false;
      yStepInput.disabled = false;
      yMinInput.focus();             // put cursor straight into Y-Min
      updateChart();
    });
  }
  
  // Y-Axis input fields changes
  [yMinInput, yMaxInput, yStepInput, ySuffixInput].forEach(elem => {
    elem.addEventListener('input', updateChart);
  });
  
  // Segment configuration changes
  [segmentEnabled, segmentStartSelect, segmentEndSelect, segmentStyleSelect, segmentColorSelect, segmentPointSelect].forEach(elem => {
    elem.addEventListener('change', updateChart);
  });
  
  // Dynamic line manager events
  if (linesListContainer) {
    // 1. Rename line
    linesListContainer.addEventListener('input', (e) => {
      const target = e.target;
      if (target.classList.contains('line-name-input')) {
        const lineId = target.getAttribute('data-line-id');
        const line = chartLines.find(l => l.id === lineId);
        if (line) {
          line.name = target.value;
          localStorage.setItem('chart_lines', JSON.stringify(chartLines));
          renderTable();
          if (chart) {
            const idx = chartLines.findIndex(l => l.id === lineId);
            if (idx !== -1) {
              chart.data.datasets[idx].label = target.value;
              chart.update();
            }
          }
          updateLegendStylesUI();
        }
      }
    });

    // 2. Change styling values (color, line style, point style)
    linesListContainer.addEventListener('change', (e) => {
      const target = e.target;
      const lineId = target.getAttribute('data-line-id');
      const line = chartLines.find(l => l.id === lineId);
      if (!line) return;
      
      if (target.classList.contains('line-color-select')) {
        line.color = target.value;
      } else if (target.classList.contains('line-style-select')) {
        line.style = target.value;
      } else if (target.classList.contains('line-point-select')) {
        line.point = target.value;
      }
      
      localStorage.setItem('chart_lines', JSON.stringify(chartLines));
      updateChart();
    });

    // 3. Delete Line dataset
    linesListContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-delete-line');
      if (!btn) return;
      const lineId = btn.getAttribute('data-line-id');
      
      if (chartLines.length <= 1) {
        alert('Phải giữ tối thiểu 1 đường vẽ.');
        return;
      }
      
      if (confirm('Bạn có chắc muốn xóa đường vẽ này? Tất cả số liệu thuộc đường vẽ này cũng sẽ bị xóa.')) {
        const idx = chartLines.findIndex(l => l.id === lineId);
        if (idx !== -1) {
          chartLines.splice(idx, 1);
          localStorage.setItem('chart_lines', JSON.stringify(chartLines));
          
          // Clean up old values
          dataPoints.forEach(pt => {
            delete pt[lineId];
          });
          
          renderLinesManager();
          renderTable();
          initChart();
          updateChart();
        }
      }
    });
  }

  // Add a new dataset line
  if (btnAddLine) {
    btnAddLine.addEventListener('click', () => {
      const newId = 'line_' + Date.now();
      const colorsPool = ['pink', 'orange', 'cyan', 'white', 'supreme', 'high'];
      const color = colorsPool[chartLines.length % colorsPool.length];
      const stylesPool = ['solid', 'dashed', 'dotted', 'dashdot'];
      const style = stylesPool[chartLines.length % stylesPool.length];
      const pointsPool = ['rect', 'triangle', 'star', 'cross', 'circle'];
      const point = pointsPool[chartLines.length % pointsPool.length];
      
      chartLines.push({
        id: newId,
        name: `Đường mới ${chartLines.length + 1}`,
        color: color,
        style: style,
        point: point
      });
      
      dataPoints.forEach(pt => {
        pt[newId] = 0; // default value
      });
      
      localStorage.setItem('chart_lines', JSON.stringify(chartLines));
      renderLinesManager();
      renderTable();
      initChart();
      updateChart();
    });
  }
  
  // Listening table inputs edits
  dataTableBody.addEventListener('input', (e) => {
    const target = e.target;
    if (!target.classList.contains('table-input')) return;
    
    const index = parseInt(target.getAttribute('data-index'));
    if (isNaN(index)) return;
    
    if (target.classList.contains('col-label')) {
      dataPoints[index].label = target.value;
      updateDropdowns();
    } else if (target.classList.contains('col-value')) {
      const lineId = target.getAttribute('data-line-id');
      // Set to null if input is empty so that it breaks/skips rendering in Chart.js
      dataPoints[index][lineId] = target.value === '' ? null : parseFloat(target.value);
    }
    updateChart();
  });
  
  // Add Row (Data Point)
  btnAddRow.addEventListener('click', () => {
    const lastPt = dataPoints[dataPoints.length - 1] || { label: '10/2025' };
    let newLabel = 'New';
    
    const dateParts = lastPt.label.split('/');
    if (dateParts.length === 2) {
      let month = parseInt(dateParts[0]);
      let year = parseInt(dateParts[1]);
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
      newLabel = `${month.toString().padStart(2, '0')}/${year}`;
    }
    
    const newPt = { label: newLabel };
    chartLines.forEach(line => {
      const lastVal = lastPt[line.id] !== undefined ? lastPt[line.id] : 500;
      newPt[line.id] = lastVal === null ? null : Math.round(lastVal * 1.05);
    });
    
    dataPoints.push(newPt);
    renderTable();
    updateDropdowns();
    updateChart();
  });
  
  // Delete Row (Data Point)
  dataTableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-delete-row');
    if (!btn) return;
    
    const index = parseInt(btn.getAttribute('data-index'));
    if (dataPoints.length <= 2) {
      alert('Phải giữ tối thiểu 2 điểm dữ liệu để vẽ biểu đồ.');
      return;
    }
    
    dataPoints.splice(index, 1);
    renderTable();
    updateDropdowns();
    updateChart();
  });
  
  // Reset Data to Defaults
  btnResetData.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn khôi phục số liệu gốc ban đầu và đặt lại 2 đường Tối cao & Cấp cao?')) {
      chartLines = [
        { id: 'supreme', name: 'Tối cao', color: 'supreme', style: 'solid', point: 'circle' },
        { id: 'high', name: 'Cấp cao', color: 'high', style: 'dashed', point: 'triangle' }
      ];
      dataPoints = [...DEFAULT_DATA.map(d => ({ ...d }))];
      
      localStorage.setItem('chart_lines', JSON.stringify(chartLines));
      renderLinesManager();
      renderTable();
      updateDropdowns();
      setSelectValueIfContains(segmentStartSelect, '09/2024');
      setSelectValueIfContains(segmentEndSelect, '09/2025');
      initChart();
      updateChart();
    }
  });
  
  const exportTitleInput = document.getElementById('export-title-input');
  
  // ─── Shared offscreen render ────────────────────────────────────────────────
  // Returns a Promise<string> (data URL). Không chạm vào biểu đồ thật.
  function buildExportDataUrl() {
    return new Promise((resolve) => {
      const EXPORT_WIDTH  = 1200;
      const EXPORT_HEIGHT = 700;

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width  = EXPORT_WIDTH;
      offscreenCanvas.height = EXPORT_HEIGHT;
      offscreenCanvas.style.display = 'none';
      document.body.appendChild(offscreenCanvas);

      const textColor   = '#000000';
      const gridColor   = 'rgba(0,0,0,0.1)';
      const borderClr   = 'rgba(0,0,0,0.2)';

      // ── Tính index phân đoạn (dùng cho cả dataset lẫn legend) ──
      const segIsActive = segmentEnabled.checked;
      const segStartIdx = dataPoints.findIndex(p => p.label === segmentStartSelect.value);
      const segEndIdx   = dataPoints.findIndex(p => p.label === segmentEndSelect.value);
      const segColor    = getThemeColor(segmentColorSelect.value);
      const segDash     = DASH_STYLES[segmentStyleSelect.value] || [];
      const segPoint    = segmentPointSelect.value;

      const exportDatasets = chartLines.map((line) => {
        const baseColor = getThemeColor(line.color);
        const isHighLine = line.id === 'high';

        const dataset = {
          label: line.name,
          data: dataPoints.map(p => {
            const val = p[line.id];
            return (val === undefined || val === '') ? null : val;
          }),
          borderColor: baseColor,
          borderDash: DASH_STYLES[line.style] || [],
          backgroundColor: 'rgba(0,0,0,0)',
          borderWidth: 3.5,
          tension: 0,
          fill: false,
          spanGaps: true,
          pointBorderColor: '#000000',
          pointBorderWidth: 2,
          pointRadius: 5,
          // Point style & color — với phân đoạn dùng màu/hình riêng
          pointStyle: (ctx) => {
            if (isHighLine && segIsActive && segStartIdx !== -1 && segEndIdx !== -1
                && ctx.dataIndex >= segStartIdx && ctx.dataIndex <= segEndIdx) {
              return segPoint;
            }
            return line.point;
          },
          pointBackgroundColor: (ctx) => {
            if (isHighLine && segIsActive && segStartIdx !== -1 && segEndIdx !== -1
                && ctx.dataIndex >= segStartIdx && ctx.dataIndex <= segEndIdx) {
              return segColor;
            }
            return baseColor;
          },
        };

        // Thêm segment coloring cho đường "Cấp cao"
        if (isHighLine && segIsActive && segStartIdx !== -1 && segEndIdx !== -1) {
          dataset.segment = {
            borderColor: (ctx) => {
              const idx = ctx.p0DataIndex;
              return (idx >= segStartIdx && idx < segEndIdx) ? segColor : undefined;
            },
            borderDash: (ctx) => {
              const idx = ctx.p0DataIndex;
              return (idx >= segStartIdx && idx < segEndIdx) ? segDash : undefined;
            }
          };
        }

        return dataset;
      });

      const exportTitle = exportTitleInput ? exportTitleInput.value.trim() || 'Biểu đồ' : 'Biểu đồ';

      // Plugin tùy chỉnh legend — thêm chú thích phân đoạn nếu đang bật
      const customLegendLabels = {
        color: textColor,
        usePointStyle: true,
        padding: 24,
        font: { size: 13, family: "'Inter', sans-serif" },
        generateLabels: (c) => {
          // Labels mặc định từ datasets
          const base = Chart.defaults.plugins.legend.labels.generateLabels(c);
          // Thêm entry chú thích phân đoạn nếu có
          const highExists = chartLines.some(l => l.id === 'high');
          if (segIsActive && highExists && segStartIdx !== -1 && segEndIdx !== -1) {
            base.push({
              text: `Cấp cao (Phân đoạn: ${segmentStartSelect.value} – ${segmentEndSelect.value})`,
              fillStyle: segColor,
              strokeStyle: segColor,
              pointStyle: segPoint,
              lineWidth: 2,
              hidden: false,
              datasetIndex: -1
            });
          }
          return base;
        }
      };

      const useTimeScale = allLabelsAreTime();

      const tempChart = new Chart(offscreenCanvas.getContext('2d'), {
        type: 'line',
        data: {
          // Dùng {x,y} khi time scale, giống chart thật
          labels: useTimeScale ? undefined : dataPoints.map(p => p.label),
          datasets: exportDatasets.map((ds, i) => ({
            ...ds,
            data: dataPoints.map(p => {
              const line = chartLines[i];
              const val = p[line.id];
              const y = (val === undefined || val === '') ? null : val;
              return useTimeScale ? { x: parseLabelToDate(p.label), y } : y;
            })
          }))
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            title: {
              display: true,
              text: exportTitle,
              font: { size: 20, family: "'Inter', sans-serif", weight: 'bold' },
              color: textColor,
              padding: { top: 16, bottom: 24 }
            },
            legend: {
              display: true,
              position: 'bottom',
              labels: customLegendLabels
            },
            tooltip: { enabled: false }
          },
          scales: {
            // ── Trục X: đồng bộ với chart thật ──────────────────────────────
            x: useTimeScale ? {
              type: 'time',
              time: {
                displayFormats: { month: 'MM/yyyy', quarter: 'MM/yyyy', year: 'yyyy' },
                tooltipFormat: 'MM/yyyy'
              },
              grid: { color: gridColor, borderColor: borderClr },
              ticks: {
                color: textColor,
                font: { size: 12 },
                maxRotation: 45,
                autoSkip: true,
                maxTicksLimit: 12,
                includeBounds: true
              }
              // Nhãn điểm cuối được đảm bảo bởi lastXTickPlugin bên dưới
            } : {
              grid: { color: gridColor, borderColor: borderClr },
              ticks: { color: textColor, font: { size: 12 } }
            },
            // ── Trục Y: đồng bộ với chart thật (manual hoặc auto) ──────────
            y: (() => {
              const base = {
                grid: { color: gridColor, borderColor: borderClr },
                ticks: {
                  color: textColor,
                  font: { size: 12 },
                  callback: (value) => value.toLocaleString() + (ySuffixInput ? ySuffixInput.value : '')
                }
              };
              if (!yAutoScale.checked) {
                base.min = parseFloat(yMinInput.value) || 0;
                base.max = parseFloat(yMaxInput.value) || 1000;
                base.ticks.stepSize = parseFloat(yStepInput.value) || 100;
              } else {
                base.min = 0;
              }
              return base;
            })()
          }
        },
        // Plugin vẽ nhãn cuối trục X cho offscreen chart
        plugins: [{
          id: 'exportLastXTick',
          afterDraw: (c) => {
            const xScale = c.scales.x;
            if (!xScale || xScale.type !== 'time') return;
            const lastPoint = dataPoints[dataPoints.length - 1];
            if (!lastPoint) return;
            const lastDate = parseLabelToDate(lastPoint.label);
            if (!lastDate) return;
            const xPixel = xScale.getPixelForValue(lastDate.valueOf());
            const yPixel = xScale.bottom;
            const THRESHOLD = 20;
            const already = xScale.ticks.some(t => Math.abs(xScale.getPixelForValue(t.value) - xPixel) < THRESHOLD);
            if (already) return;
            const { ctx: ct } = c;
            ct.save();
            ct.font = '12px Inter, sans-serif';
            ct.fillStyle = '#000000';
            ct.textAlign = 'center';
            ct.textBaseline = 'top';
            ct.fillText(lastPoint.label, xPixel, yPixel + 4);
            ct.strokeStyle = 'rgba(0,0,0,0.3)';
            ct.lineWidth = 1;
            ct.beginPath();
            ct.moveTo(xPixel, xScale.top);
            ct.lineTo(xPixel, yPixel);
            ct.stroke();
            ct.restore();
          }
        }]
      });

      requestAnimationFrame(() => {
        setTimeout(() => {
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width  = EXPORT_WIDTH;
          finalCanvas.height = EXPORT_HEIGHT;
          const finalCtx = finalCanvas.getContext('2d');
          finalCtx.fillStyle = '#ffffff';
          finalCtx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
          finalCtx.drawImage(offscreenCanvas, 0, 0);

          const dataUrl = finalCanvas.toDataURL('image/png', 1.0);
          tempChart.destroy();
          document.body.removeChild(offscreenCanvas);
          resolve(dataUrl);
        }, 120);
      });
    });
  }

  // ─── Preview modal wiring ────────────────────────────────────────────────────
  const exportModal      = document.getElementById('export-modal');
  const previewImg       = document.getElementById('export-preview-img');
  const previewLoading   = document.getElementById('preview-loading');
  const btnCloseModal    = document.getElementById('btn-close-modal');
  const btnCancelExport  = document.getElementById('btn-cancel-export');
  const btnConfirmExport = document.getElementById('btn-confirm-export');
  let   cachedDataUrl    = null;

  function triggerDownload(dataUrl) {
    const link = document.createElement('a');
    link.download = 'bieu_do_da_chi_so.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function openPreviewModal() {
    // Reset state
    previewImg.style.display = 'none';
    previewLoading.style.display = 'inline';
    cachedDataUrl = null;
    btnConfirmExport.disabled = true;
    exportModal.style.display = 'flex';

    buildExportDataUrl().then((dataUrl) => {
      cachedDataUrl = dataUrl;
      previewImg.src = dataUrl;
      previewImg.style.display = 'block';
      previewLoading.style.display = 'none';
      btnConfirmExport.disabled = false;
    });
  }

  function closePreviewModal() {
    exportModal.style.display = 'none';
  }

  // Khi đổi tên biểu đồ — cập nhật lại preview
  if (exportTitleInput) {
    exportTitleInput.addEventListener('input', () => {
      if (exportModal.style.display !== 'none') {
        previewImg.style.display = 'none';
        previewLoading.style.display = 'inline';
        cachedDataUrl = null;
        btnConfirmExport.disabled = true;
        clearTimeout(window._previewTimer);
        window._previewTimer = setTimeout(() => {
          buildExportDataUrl().then((dataUrl) => {
            cachedDataUrl = dataUrl;
            previewImg.src = dataUrl;
            previewImg.style.display = 'block';
            previewLoading.style.display = 'none';
            btnConfirmExport.disabled = false;
          });
        }, 600);
      }
    });
  }

  btnExportPng.addEventListener('click', openPreviewModal);
  btnCloseModal.addEventListener('click', closePreviewModal);
  btnCancelExport.addEventListener('click', closePreviewModal);
  exportModal.addEventListener('click', (e) => { if (e.target === exportModal) closePreviewModal(); });

  btnConfirmExport.addEventListener('click', () => {
    if (cachedDataUrl) {
      triggerDownload(cachedDataUrl);
      closePreviewModal();
    }
  });
  
  // Copy data as JSON
  btnCopyJson.addEventListener('click', () => {
    const jsonStr = JSON.stringify(dataPoints, null, 2);
    navigator.clipboard.writeText(jsonStr)
      .then(() => {
        alert('Đã sao chép dữ liệu dạng JSON vào bộ nhớ đệm!');
      })
      .catch(err => {
        console.error('Không thể sao chép dữ liệu: ', err);
      });
  });

  // Print chart trigger
  btnPrint.addEventListener('click', () => {
    window.print();
  });
}

// Hook into beforeprint and afterprint to force print-friendly Light Theme
window.addEventListener('beforeprint', () => {
  window.wasDarkMode = !document.body.classList.contains('light-theme');
  if (window.wasDarkMode) {
    document.body.classList.add('light-theme');
    updateThemeUI();
  }
  updateChartThemeForPrint(true);
});

window.addEventListener('afterprint', () => {
  if (window.wasDarkMode) {
    document.body.classList.remove('light-theme');
    updateThemeUI();
  }
  updateChartThemeForPrint(false);
});

// Dedicated high-contrast chart updater for print lifecycle
function updateChartThemeForPrint(isPrinting) {
  if (!chart) return;
  
  const isLight = isPrinting || document.body.classList.contains('light-theme');
  
  const textColor = isLight ? '#000000' : '#94a3b8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.04)';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.08)';
  
  Chart.defaults.color = textColor;
  chart.options.scales.x.grid.color = gridColor;
  chart.options.scales.x.grid.borderColor = borderColor;
  chart.options.scales.x.ticks.color = textColor;
  
  chart.options.scales.y.grid.color = gridColor;
  chart.options.scales.y.grid.borderColor = borderColor;
  chart.options.scales.y.ticks.color = textColor;
  
  // High contrast monochrome styling for physical black and white prints
  chartLines.forEach((line, index) => {
    const dataset = chart.data.datasets[index];
    if (!dataset) return;
    
    if (isPrinting) {
      // Rotate high contrast print shades of grey/black
      const printColors = ['#000000', '#555555', '#888888', '#aaaaaa'];
      const activeColor = printColors[index % printColors.length];
      dataset.borderColor = activeColor;
      dataset.pointBackgroundColor = activeColor;
      dataset.pointBorderColor = '#ffffff';
    } else {
      const activeColor = getThemeColor(line.color);
      dataset.borderColor = activeColor;
      dataset.pointBackgroundColor = activeColor;
      dataset.pointBorderColor = isLight ? '#ffffff' : '#080b11';
    }
    
    // Disable fills on printing to conserve printer ink and print clear lines
    dataset.fill = !isPrinting;
  });
  
  chart.update('none'); // Update without animation
  updateLegendStylesUI();
}
