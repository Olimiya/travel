var currentScheme = 1;
var map = null;
var routeLayer = null;
var markerLayer = null;

// ===== 地图初始化 =====
function initMap() {
  map = L.map('map', { zoomControl: true }).setView([26.5, 100.0], 7);

  var normalLayer = L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1','2','3','4'], maxZoom: 18, attribution: '高德地图'
  });
  normalLayer.addTo(map);

  var satLayer = L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
    subdomains: ['1','2','3','4'], maxZoom: 18, attribution: '高德卫星'
  });

  L.control.layers({ '标准地图': normalLayer, '卫星地图': satLayer }, null, { position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

  routeLayer = L.layerGroup().addTo(map);
  markerLayer = L.layerGroup().addTo(map);

  renderMapScheme(1);
}

function renderMapScheme(scheme) {
  routeLayer.clearLayers();
  markerLayer.clearLayers();
  var days = scheme === 1 ? days1 : days2;
  var colors = scheme === 1 ? colors1 : colors2;

var allCoords = [];

  // 绘制真实道路轨迹（替代直线连接）
  if (typeof routeTracks !== 'undefined' && routeTracks[scheme]) {
    routeTracks[scheme].forEach(function(rt) {
      if (rt.alt) {
        L.polyline(rt.track, { color: rt.color, weight: 3, opacity: 0.45, dashArray: '8,6' }).addTo(routeLayer);
      } else {
        L.polyline(rt.track, { color: rt.color, weight: 4, opacity: 0.8 }).addTo(routeLayer);
      }
      rt.track.forEach(function(c) { allCoords.push(c); });
    });
  } else {
    var routeCoords = [];
    days.forEach(function(d) {
      if (d.coords2) { routeCoords.push(d.coords, d.coords2); }
      else { routeCoords.push(d.coords); }
    });
    L.polyline(routeCoords, { color: scheme === 1 ? '#4A90D9' : '#00897B', weight: 4, opacity: 0.55 }).addTo(routeLayer);
    allCoords = routeCoords;
  }

  days.forEach(function(d) {
    var c = d.coords2 || d.coords;
    var popup = '<b>'+d.title+'</b><br>'+d.route+' · 驾驶'+d.drive+'<br><br>'+(d.summary||'');

    var icon = L.divIcon({
      className: '',
      html: '<div style="background:'+colors[d.day]+';width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">D'+d.day+'</div>',
      iconSize: [30, 30], iconAnchor: [15, 15]
    });
    L.marker(c, { icon: icon }).addTo(markerLayer).bindPopup(popup);

    var lblName = d.coords2 ? d.name2 : d.name;
    var label = L.divIcon({ className:'', html: '<div class="marker-label" style="margin-left:20px;margin-top:-4px;">'+lblName+'</div>', iconSize:[0,0] });
    L.marker(c, { icon: label, interactive: false, zIndexOffset: -100 }).addTo(markerLayer);

    if (d.coords2) {
      var icon2 = L.divIcon({
        className: '',
        html: '<div style="background:'+colors[d.day]+';width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);">●</div>',
        iconSize: [22, 22], iconAnchor: [11, 11]
      });
      L.marker(d.coords, { icon: icon2 }).addTo(markerLayer).bindPopup('<b>'+d.name1+'</b><br>'+d.title+' 途经点');
      var label2 = L.divIcon({ className:'', html: '<div class="marker-label" style="margin-left:16px;margin-top:-4px;">'+d.name1+'</div>', iconSize:[0,0] });
      L.marker(d.coords, { icon: label2, interactive: false, zIndexOffset: -100 }).addTo(markerLayer);
    }
  });

  // 绘制途经导航点（路线细化新增）
  if (typeof routeWaypoints !== 'undefined') {
    var wpColors = { scenic:'#E53935', nav:'#FF6F00', supply:'#43A047', pass:'#7E57C2' };
    var wpIcons = { scenic:'景', nav:'导', supply:'油', pass:'隧' };
    Object.keys(routeWaypoints).forEach(function(key) {
      var wp = routeWaypoints[key];
      var wpSchemes = Array.isArray(wp.scheme) ? wp.scheme : [wp.scheme];
      if (wpSchemes.indexOf(scheme) < 0) return;
      var bg = wpColors[wp.type] || '#666';
      var label = wpIcons[wp.type] || '·';
      var wicon = L.divIcon({ className:'', html: '<div style="background:'+bg+';width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);">'+label+'</div>', iconSize:[20,20], iconAnchor:[10,10] });
      L.marker(wp.coords, { icon: wicon }).addTo(markerLayer).bindPopup('<b>'+wp.name+'</b><br>'+wp.note);
      var wlabel = L.divIcon({ className:'', html: '<div class="marker-label" style="margin-left:14px;margin-top:-4px;font-size:10px;">'+wp.name+'</div>', iconSize:[0,0] });
      L.marker(wp.coords, { icon: wlabel, interactive: false, zIndexOffset: -100 }).addTo(markerLayer);
    });
  }

  map.fitBounds(allCoords.length ? allCoords : [[26.5,100.0]], { padding: [50, 50] });
}

// ===== 视图切换 =====
function switchView(view) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.getElementById('view-'+view).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  document.querySelector('.nav-item[data-view="'+view+'"]').classList.add('active');

  var titles = { map:'路线地图', itinerary:'逐日行程', knowledge:'知识库', general:'通用知识', checklist:'待办清单', budget:'预算对比', spots:'景点清单', backup:'备选支线' };
  document.getElementById('topbarTitle').textContent = titles[view] || '';

  if (view === 'map' && map) {
    setTimeout(function(){ map.invalidateSize(); }, 100);
  }

  if (window.innerWidth <= 768) {
    document.querySelector('.sidebar').classList.remove('open');
    var ov = document.getElementById('sidebarOverlay');
    if (ov) ov.classList.remove('show');
  }
}

// ===== 方案切换 =====
function switchScheme(scheme) {
  currentScheme = scheme;
  document.getElementById('btnScheme1').classList.toggle('active', scheme === 1);
  document.getElementById('btnScheme2').classList.toggle('active', scheme === 2);
  document.getElementById('schemeHint').textContent = schemeHints[scheme];

  if (map) renderMapScheme(scheme);
  renderItinerary(scheme);
  renderBudget(scheme);
  renderSpots(scheme);
  updateTopbarMeta(scheme);
}

function updateTopbarMeta(scheme) {
  var meta = document.getElementById('topbarMeta');
  if (scheme === 1) {
    meta.textContent = '方案一 · 最长D5 4.6h · 约14700-16200';
  } else {
    meta.textContent = '方案二 · 最长D5 5.5-6.5h(限速40) · 约14800-16400';
  }
}

// ===== 逐日行程渲染 =====
function renderItinerary(scheme) {
  var days = scheme === 1 ? days1 : days2;
  var colors = scheme === 1 ? colors1 : colors2;
  var container = document.getElementById('itineraryContainer');

  var driveTable = scheme === 1 ? driveTable1 : driveTable2;
  var driveHTML = '<div class="tbl-wrap"><table><thead><tr><th>天</th><th>路段</th><th>距离</th><th>高德驾驶</th><th>含停留</th><th>强度</th></tr></thead><tbody>';
  driveTable.forEach(function(r) {
    var strengthClass = r[5] === '高' ? 'tag-warn' : (r[5] === '中高' ? 'tag-opt' : (r[5] === '中' ? 'tag-must' : ''));
    driveHTML += '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td><td>'+(r[5]==='—'?'—':'<span class="tag '+strengthClass+'">'+r[5]+'</span>')+'</td></tr>';
  });
  driveHTML += '</tbody></table></div>';

  var html = '<h2>'+(scheme===1?'方案一·跳过梅里':'方案二·德贡公路')+'</h2>';
  html += '<p class="lead">'+schemeHints[scheme]+'</p>';
  html += '<h3>逐日行程</h3>';

  days.forEach(function(d) {
    var itemsHTML = '';
    if (d.items) {
      itemsHTML = '<ul>';
      d.items.forEach(function(it) {
        var processed = it.replace(/【必去】/g, '<span class="tag tag-must">必去</span>')
          .replace(/【备选】/g, '<span class="tag tag-opt">备选</span>')
          .replace(/【途经】/g, '<span class="tag tag-pass">途经</span>');
        itemsHTML += '<li>'+processed+'</li>';
      });
      itemsHTML += '</ul>';
    }
    var stayHTML = d.stay ? '<div class="day-stay"><b>住宿：</b>'+d.stay+'</div>' : '';

    html += '<div class="day-card">'+
      '<div class="day-card-head" onclick="this.parentElement.classList.toggle(\'open\')">'+
        '<div class="day-badge" style="background:'+colors[d.day]+'">D'+d.day+'</div>'+
        '<div><div class="day-card-title">'+d.title+'</div><div class="day-card-route">'+d.route+'</div></div>'+
        '<div class="day-card-drive">驾驶 '+d.drive+'</div>'+
      '</div>'+
      '<div class="day-card-body">'+
        '<p>'+d.summary+'</p>'+
        itemsHTML+
        stayHTML+
      '</div>'+
    '</div>';
  });

  html += '<h3>驾驶强度表</h3>'+driveHTML;

  if (scheme === 2) {
    html += '<div class="note"><b>方案二风险提示：</b><br>• 德贡公路雨季（7月）可能有落石、雾、临时管制，出发前必查高德实时路况<br>• 219国道怒江段限速低、隧道多、山路弯多，切勿赶夜路<br>• 如德贡公路封路，退回方案一（飞来寺→香格里拉→大理→腾冲，但会多1天）<br>• 梅里7月雨季，日照金山看到概率约30-40%，做好看不到的准备<br>• 丙中洛、泸水住宿条件一般，提前预订</div>';
  }

  container.innerHTML = html;
}

// ===== 知识库渲染 =====
function renderKnowledge() {
  var container = document.getElementById('knowledgeContainer');
  var html = '<h2>小红书搜索知识库</h2>';
  html += '<p class="lead">所有推荐均标注来源笔记，点击可跳转原文。更新于2026-07-05。</p>';

  knowledgeSections.forEach(function(sec, i) {
    html += '<div class="know-section'+(i===0?' open':'')+'">';
    html += '<div class="know-head" onclick="this.parentElement.classList.toggle(\'open\')"><span>'+sec.title+'</span><span class="chev">▶</span></div>';
    html += '<div class="know-body">';
    sec.items.forEach(function(item) {
      html += '<div class="know-item">';
      html += '<div class="know-item-title">'+item[0]+'</div>';
      html += '<div class="know-item-desc">'+item[1]+'</div>';
      if (item[2] && item[2].length > 0) {
        html += '<div class="know-notes">';
        item[2].forEach(function(noteKey) {
          var note = xhsNotes[noteKey];
          if (note) {
            html += '<a href="'+note.url+'" target="_blank" rel="noopener" class="know-note-link" title="'+note.title+' - '+note.author+'">';
            html += '<span class="know-note-title">'+note.title+'</span>';
            html += '<span class="know-note-meta">'+note.author+' · '+note.likes+'赞</span>';
            html += '</a>';
          }
        });
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div></div>';
  });

  // 来源原文库
  html += '<h2 style="margin-top:32px">来源原文库</h2>';
  html += '<p class="lead">以下为本站引用的全部小红书笔记，按主题分类。点击标题可跳转原文。</p>';

  xhsNoteGroups.forEach(function(group, gi) {
    html += '<div class="know-section'+(gi===0?' open':'')+'">';
    html += '<div class="know-head" onclick="this.parentElement.classList.toggle(\'open\')"><span>'+group.title+' ('+group.keys.length+')</span><span class="chev">▶</span></div>';
    html += '<div class="know-body">';
    group.keys.forEach(function(key) {
      var note = xhsNotes[key];
      if (note) {
        html += '<div class="xhs-note-card">';
        html += '<a href="'+note.url+'" target="_blank" rel="noopener" class="xhs-note-title">'+note.title+'</a>';
        html += '<div class="xhs-note-author">'+note.author+' · '+note.likes+'赞</div>';
        html += '<div class="xhs-note-summary">'+note.summary+'</div>';
        html += '</div>';
      }
    });
    html += '</div></div>';
  });

  container.innerHTML = html;
}

// ===== 通用知识库渲染 =====
function renderGeneralKnowledge() {
  var container = document.getElementById('generalContainer');
  var html = '<h2>通用旅行知识库</h2>';
  html += '<p class="lead">航班、高铁、自驾、高原、雨季、安全等通用旅行知识，独立于具体行程，可迁移复用。</p>';

  generalKnowledge.forEach(function(sec, i) {
    html += '<div class="know-section'+(i===0?' open':'')+'">';
    html += '<div class="know-head" onclick="this.parentElement.classList.toggle(\'open\')"><span>'+sec.title+'</span><span class="chev">▶</span></div>';
    html += '<div class="know-body">';
    sec.items.forEach(function(item) {
      html += '<div class="know-item">';
      html += '<div class="know-item-title">'+item.q+'</div>';
      html += '<div class="know-item-desc">'+item.a+'</div>';
      html += '</div>';
    });
    html += '</div></div>';
  });

  container.innerHTML = html;
}
function renderChecklist() {
  var container = document.getElementById('checklistContainer');
  var html = '<h2>行程前待办清单</h2>';
  html += '<p class="lead">只列必须重点关注的项目，按时间顺序+优先级排列。勾选状态保存在本地。</p>';

  checklist.forEach(function(group) {
    html += '<div class="check-group">';
    html += '<div class="check-group-title">'+group.group+'</div>';
    group.items.forEach(function(item, idx) {
      var id = 'chk_'+group.group.replace(/\s/g,'')+'_'+idx;
      var deadlineHTML = item.deadline ? '<span class="check-deadline">'+item.deadline+'</span>' : '';
      html += '<div class="check-item">'+
        '<input type="checkbox" id="'+id+'" onchange="saveCheck(\''+id+'\')">'+
        '<div class="check-text">'+item.text+'</div>'+
        deadlineHTML+
      '</div>';
    });
    html += '</div>';
  });

  html += '<h3>关键时间节点速查</h3>';
  html += '<div class="tbl-wrap"><table><thead><tr><th>节点</th><th>动作</th><th>最晚期限</th></tr></thead><tbody>';
  timeline.forEach(function(r) {
    html += '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td><b style="color:var(--accent)">'+r[2]+'</b></td></tr>';
  });
  html += '</tbody></table></div>';

  container.innerHTML = html;

  // 恢复勾选状态
  checklist.forEach(function(group) {
    group.items.forEach(function(item, idx) {
      var id = 'chk_'+group.group.replace(/\s/g,'')+'_'+idx;
      var cb = document.getElementById(id);
      if (cb && localStorage.getItem(id) === '1') {
        cb.checked = true;
      }
    });
  });
}

function saveCheck(id) {
  var cb = document.getElementById(id);
  localStorage.setItem(id, cb.checked ? '1' : '0');
}

// ===== 预算渲染 =====
function renderBudget(scheme) {
  var container = document.getElementById('budgetContainer');
  var budget = scheme === 1 ? budget1 : budget2;
  var schemeName = scheme === 1 ? '方案一·跳过梅里' : '方案二·德贡公路';

  var html = '<h2>预算估算（两人合计）</h2>';
  html += '<p class="lead">当前显示：'+schemeName+'。切换左侧方案可对比。</p>';

  html += '<div class="budget-grid">';
  // 当前方案
  html += '<div class="budget-card"><h4>'+schemeName+'</h4>';
  budget.forEach(function(r, i) {
    var isTotal = r[0].indexOf('合计') >= 0;
    html += '<div style="display:flex;justify-content:space-between;padding:5px 0;'+(isTotal?'':'border-bottom:1px solid #f5f5f5;')+'">';
    html += '<span style="color:'+(isTotal?'var(--primary)':'var(--text-2)')+';font-weight:'+(isTotal?'700':'400')+'">'+r[0]+'</span>';
    html += '<span style="color:'+(isTotal?'var(--primary)':'var(--text)')+';font-weight:'+(isTotal?'700':'600')+'">'+r[1]+'</span>';
    html += '</div>';
  });
  html += '</div>';

  // 另一方案对比
  var otherBudget = scheme === 1 ? budget2 : budget1;
  var otherName = scheme === 1 ? '方案二·德贡公路' : '方案一·跳过梅里';
  html += '<div class="budget-card"><h4>'+otherName+'（对比）</h4>';
  otherBudget.forEach(function(r, i) {
    var isTotal = r[0].indexOf('合计') >= 0;
    html += '<div style="display:flex;justify-content:space-between;padding:5px 0;'+(isTotal?'':'border-bottom:1px solid #f5f5f5;')+'">';
    html += '<span style="color:'+(isTotal?'var(--text-3)':'var(--text-3)')+';font-weight:'+(isTotal?'700':'400')+'">'+r[0]+'</span>';
    html += '<span style="color:'+(isTotal?'var(--text-3)':'var(--text-3)')+';font-weight:'+(isTotal?'700':'600')+'">'+r[1]+'</span>';
    html += '</div>';
  });
  html += '</div></div>';

  // 两方案对比表
  html += '<h3>两方案对比</h3>';
  html += '<div class="tbl-wrap"><table><thead><tr><th>维度</th><th>方案一（跳过梅里）</th><th>方案二（德贡公路+怒江）</th></tr></thead><tbody>';
  compareTable.forEach(function(r) {
    html += '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>';
  });
  html += '</tbody></table></div>';

  html += '<div class="note"><b>选择建议：</b><br>• 7月雨季，如果出发前看梅里天气不好（云量高、连阴雨），选方案一<br>• 如果出发前梅里天气窗口明确（天文通APP云量<30%），选方案二<br>• 方案二出发当天如德贡公路封路，立即切换为方案一<br>• 想体验芒市缅式洗头+活螃蟹选方案一，想走怒江大峡谷绝版风景选方案二</div>';

  container.innerHTML = html;
}

// ===== 景点清单渲染 =====
function renderSpots(scheme) {
  var container = document.getElementById('spotsContainer');
  var spots = scheme === 1 ? spots1 : spots2;
  var schemeName = scheme === 1 ? '方案一' : '方案二';

  var html = '<h2>关键景点清单 · '+schemeName+'</h2>';
  html += '<p class="lead">必去景点为核心体验，备选可按时间删减，途经为路上经过。</p>';

  // 按类型分组
  var mustHave = spots.filter(function(s){ return s[1].indexOf('必去')>=0; });
  var optional = spots.filter(function(s){ return s[1].indexOf('备选')>=0; });
  var passBy = spots.filter(function(s){ return s[1].indexOf('途经')>=0 || s[1].indexOf('全程')>=0; });

  html += '<h3>必去景点 ('+mustHave.length+')</h3>';
  html += '<div class="spot-grid">';
  mustHave.forEach(function(s) {
    html += '<div class="spot-card"><span class="tag tag-must">必去</span> <span class="spot-name">'+s[0]+'</span> <span style="color:var(--text-3);font-size:11px">'+s[2]+'</span><div class="spot-note">'+s[3]+'</div></div>';
  });
  html += '</div>';

  html += '<h3>备选景点 ('+optional.length+')</h3>';
  html += '<div class="spot-grid">';
  optional.forEach(function(s) {
    html += '<div class="spot-card"><span class="tag tag-opt">备选</span> <span class="spot-name">'+s[0]+'</span> <span style="color:var(--text-3);font-size:11px">'+s[2]+'</span><div class="spot-note">'+s[3]+'</div></div>';
  });
  html += '</div>';

  html += '<h3>途经景点 ('+passBy.length+')</h3>';
  html += '<div class="spot-grid">';
  passBy.forEach(function(s) {
    var tagClass = s[1].indexOf('全程')>=0 ? 'tag-pass' : 'tag-pass';
    var tagText = s[1].indexOf('全程')>=0 ? '全程' : '途经';
    html += '<div class="spot-card"><span class="tag '+tagClass+'">'+tagText+'</span> <span class="spot-name">'+s[0]+'</span> <span style="color:var(--text-3);font-size:11px">'+s[2]+'</span><div class="spot-note">'+s[3]+'</div></div>';
  });
  html += '</div>';

  container.innerHTML = html;
}

// ===== 侧边栏切换（移动端） =====
function toggleSidebar() {
  var sb = document.querySelector('.sidebar');
  var ov = document.getElementById('sidebarOverlay');
  sb.classList.toggle('open');
  if (ov) ov.classList.toggle('show', sb.classList.contains('open'));
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
  initMap();

  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      switchView(this.getAttribute('data-view'));
    });
  });

  renderItinerary(1);
  renderKnowledge();
  renderGeneralKnowledge();
  renderChecklist();
  renderBudget(1);
  renderSpots(1);
  renderBackup();
  updateTopbarMeta(1);
});

// ===== 备选方案与支线库渲染 =====
function renderBackup() {
  var container = document.getElementById('backupContainer');
  var html = '<h2>备选方案与支线库</h2>';
  html += '<p class="lead">独立于主方案，不干扰主方案节奏。提供丰富的备选景点候选库、分叉支线、应急方案，供不同情况人工决策切换。更新于2026-07-11。</p>';

  // 触发场景总览
  html += '<h3>备选触发场景总览</h3>';
  html += '<div class="tbl-wrap"><table><thead><tr><th>场景</th><th>触发条件</th><th>影响范围</th><th>切换方向</th></tr></thead><tbody>';
  backupScenarios.forEach(function(s) {
    var dirClass = s.id === 'A' ? 'tag-warn' : (s.id === 'I' ? 'tag-opt' : 'tag-must');
    html += '<tr><td><b>'+s.id+'. '+s.trigger+'</b></td><td>'+s.condition+'</td><td>'+s.scope+'</td><td><span class="tag '+dirClass+'">'+s.direction+'</span></td></tr>';
  });
  html += '</tbody></table></div>';

  // 备选景点候选库
  html += '<h3>备选景点候选库</h3>';
  html += '<p class="lead">按城市分层：主方案已含 -> 备选替换 -> 雨天适用 -> 小众补充。</p>';
  backupCitySpots.forEach(function(city) {
    html += '<div class="know-section">';
    html += '<div class="know-head" onclick="this.parentElement.classList.toggle(\'open\')"><span>'+city.city+' ('+city.spots.length+')</span><span class="chev">▶</span></div>';
    html += '<div class="know-body">';
    html += '<div class="tbl-wrap"><table><thead><tr><th>景点</th><th>类型</th><th>门票</th><th>特色</th><th>雨天</th><th>来源</th></tr></thead><tbody>';
    city.spots.forEach(function(s) {
      var rainTag = s.rain === '是' ? '<span class="tag tag-must">是</span>' : (s.rain === '否' ? '<span class="tag tag-warn">否</span>' : '<span class="tag tag-opt">一般</span>');
      html += '<tr><td><b>'+s.name+'</b></td><td>'+s.type+'</td><td>'+s.ticket+'</td><td>'+s.feature+'</td><td>'+rainTag+'</td><td style="font-size:11px;color:var(--text-3)">'+s.src+'</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '</div></div>';
  });

  // 道路封路绕行决策树
  html += '<h3>道路封路绕行决策树</h3>';
  html += '<p class="lead">2026年7月雨季，滇西北多条道路有封路/塌方真实案例。以下为每个关键路段的绕行方案。</p>';
  backupDetours.forEach(function(d) {
    html += '<div class="detour-card">';
    html += '<div class="detour-head" onclick="this.parentElement.classList.toggle(\'open\')">';
    html += '<div><div class="detour-title">'+d.title+'</div>';
    html += '<div class="detour-date">'+d.date+'</div></div>';
    html += '<span class="chev">▶</span></div>';
    html += '<div class="detour-body">';
    html += '<div class="detour-tree">';
    d.tree.forEach(function(t) {
      html += '<div class="tree-node">';
      html += '<div class="tree-q">'+t.q+'</div>';
      html += '<div class="tree-a">'+t.a+'</div>';
      html += '</div>';
    });
    html += '</div>';
    if (d.note) html += '<div class="note">'+d.note+'</div>';
    html += '<div class="detour-srcs"><b>信源：</b> '+d.srcs.join('；')+'</div>';
    html += '</div></div>';
  });

  // 高反应对方案
  html += '<h3>高反应对方案与低海拔备选路线</h3>';
  html += '<p class="lead">7月滇西北行程涉及海拔2400m->3300m->3400m->4292m。高反风险真实存在。</p>';
  html += '<h4>预防与监测</h4>';
  html += '<div class="spot-grid">';
  backupAltitude.prevention.forEach(function(p) {
    html += '<div class="spot-card"><span class="spot-name">'+p.item+'</span><div class="spot-note">'+p.desc+'</div></div>';
  });
  html += '</div>';
  html += '<h4>三级降级路线</h4>';
  html += '<div class="tbl-wrap"><table><thead><tr><th>级别</th><th>海拔</th><th>行动</th></tr></thead><tbody>';
  backupAltitude.routes.forEach(function(r) {
    html += '<tr><td><b>'+r.level+'</b></td><td>'+r.altitude+'</td><td>'+r.action+'</td></tr>';
  });
  html += '</tbody></table></div>';

  // 雨季天气判断工具
  html += '<h3>雨季天气判断工具</h3>';
  html += '<p class="lead">7月滇西北雨季，但并非整天大雨。掌握判断方法可大幅减少"看预报全是雨"的焦虑。</p>';
  html += '<h4>假雨判断法</h4>';
  html += '<div class="tbl-wrap"><table><thead><tr><th>条件</th><th>判断</th></tr></thead><tbody>';
  backupWeather.rules.forEach(function(r) {
    html += '<tr><td><b>'+r.condition+'</b></td><td>'+r.action+'</td></tr>';
  });
  html += '</tbody></table></div>';
  html += '<h4>各城市雨天模式</h4>';
  html += '<div class="spot-grid">';
  backupWeather.rainyMode.forEach(function(r) {
    html += '<div class="spot-card"><span class="spot-name">'+r.city+'</span><div class="spot-note">'+r.spots+'</div></div>';
  });
  html += '</div>';

  // 途经景点扩展库
  html += '<h3>途经景点扩展库</h3>';
  html += '<p class="lead">主方案各驾驶路段沿途可停留的景点，供灵活增减。</p>';
  backupTransit.forEach(function(route) {
    html += '<div class="know-section">';
    html += '<div class="know-head" onclick="this.parentElement.classList.toggle(\'open\')"><span>'+route.route+'</span><span class="chev">▶</span></div>';
    html += '<div class="know-body">';
    html += '<div class="tbl-wrap"><table><thead><tr><th>途经景点</th><th>停留</th><th>特色</th></tr></thead><tbody>';
    route.spots.forEach(function(s) {
      html += '<tr><td><b>'+s.name+'</b></td><td>'+s.stop+'</td><td>'+s.feature+'</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '</div></div>';
  });

  // 沙溪古镇支线
  html += '<h3>沙溪古镇支线</h3>';
  html += '<div class="shaxi-card">';
  html += '<p>'+backupShaxi.overview+'</p>';
  html += '<div class="shaxi-meta"><span class="tag tag-must">免费</span> 海拔'+backupShaxi.altitude+' | 交通：'+backupShaxi.transport+'</div>';
  html += '<h4>游览路线</h4>';
  html += '<div class="shaxi-route">'+backupShaxi.route.join(' -> ')+'</div>';
  html += '<h4>美食推荐</h4>';
  html += '<div class="spot-grid">';
  backupShaxi.foods.forEach(function(f) {
    var tagClass = f.rating === '5星' ? 'tag-must' : 'tag-opt';
    html += '<div class="spot-card"><span class="tag '+tagClass+'">'+f.rating+'</span> <span class="spot-name">'+f.name+'</span><div class="spot-note">'+f.desc+'</div></div>';
  });
  html += '</div>';
  html += '<h4>触发条件</h4>';
  html += '<p>'+backupShaxi.trigger+'</p>';
  html += '<h4>使用方式</h4>';
  html += '<div class="note">'+backupShaxi.usage+'</div>';
  html += '</div>';

  container.innerHTML = html;
}