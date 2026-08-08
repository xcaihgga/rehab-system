// ===== route-handlers.js auto-generated =====
function renderErrorPage(err,path){
  _lastError={err:String(err&&err.message||err),stack:String(err&&err.stack||''),path:String(path||''),t:Date.now(),ua:navigator.userAgent,schema:getStoredSchemaVersion(),codeVer:SCHEMA_VERSION};
  console.error('[route] error:',err);
  try{audit('error.route',{path:String(path||'').slice(0,40),msg:String(err&&err.message||err).slice(0,80)})}catch(_){}
  var app=document.getElementById('app');
  if(!app)return;
  app.innerHTML='<div class="page"><div class="page-header" style="background:linear-gradient(135deg,#e53e3e,#c53030)"><h2>页面出错</h2><p>路由：'+escapeHtml(path||'')+'</p></div>'+
    '<div class="card"><div class="card-title">错误信息</div><div style="font-family:monospace;font-size:12px;color:#c53030;background:#fff5f5;padding:8px;border-radius:4px;word-break:break-all;white-space:pre-wrap">'+escapeHtml(_lastError.err)+'\n\n'+escapeHtml(_lastError.stack)+'</div></div>'+
    '<div class="card"><div class="card-title">操作建议</div>'+
    '<p style="font-size:13px;color:#555;margin-bottom:8px">1. 尝试刷新页面；若反复出现请导出诊断包反馈开发者。</p>'+
    '<p style="font-size:13px;color:#555;margin-bottom:8px">2. 业务数据仍保存在本地，可导出备份后清理浏览器存储。</p>'+
    '<p style="font-size:13px;color:#555">3. schema 版本：'+_lastError.schema+' / 代码版本：'+_lastError.codeVer+'</p></div>'+
    '<button class="btn" id="err_diag" style="margin-bottom:8px">📤 导出诊断包</button>'+
    '<button class="btn btn-ghost" id="err_home">返回首页</button>'+
    '<button class="btn btn-ghost" id="err_backup" style="margin-top:8px">先导出数据备份</button>'+
  '</div>';
  var dBtn=document.getElementById('err_diag');
  if(dBtn)dBtn.onclick=function(){exportDiagnosticBundle()};
  var hBtn=document.getElementById('err_home');
  if(hBtn)hBtn.onclick=function(){location.hash='';location.reload()};
  var bBtn=document.getElementById('err_backup');
  if(bBtn)bBtn.onclick=function(){try{exportFullBackup()}catch(e){toast('备份失败：'+e.message)}};
}

// 诊断包：错误信息 + localStorage 快照 + schema 信息 + 审计日志最近 50 条
function exportDiagnosticBundle(){
  var snap={};
  try{
    DATA_KEYS.forEach(function(k){
      try{snap[k]=LS.get(k)}catch(e){snap[k]='[read error: '+e.message+']'}
    });
  }catch(e){snap._error='snapshot failed: '+e.message}
  var pkg={
    exportTime:new Date().toISOString(),
    appVersion:'v2.0',
    schemaVersion:getStoredSchemaVersion(),
    codeSchemaVersion:SCHEMA_VERSION,
    userAgent:navigator.userAgent,
    lastError:_lastError,
    localStorageSnapshot:snap,
    auditLogRecent:(getAuditLog()||[]).slice(0,50),
    recordsCount:getRecords().length,
    patientsCount:getPatients().length
  };
  var blob=new Blob([JSON.stringify(pkg,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='rehab_diagnostic_'+todayStr()+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_){}},5000);
  toast('诊断包已下载');
}

// 全局未捕获异常：同步 throw / 资源加载失败
window.addEventListener('error',function(e){
  // 过滤跨域脚本错误（仅有 'Script error.'）
  var msg=String(e.message||'');
  if(msg==='Script error.'&&!e.filename)return;
  try{audit('error.global',{msg:msg.slice(0,80),src:String(e.filename||'').slice(0,40)+':'+(e.lineno||0)})}catch(_){}
  console.error('[global error]',e);
});
// 未处理的 Promise rejection
window.addEventListener('unhandledrejection',function(e){
  var reason=e&&e.reason;
  var msg=String((reason&&reason.message)||reason||'');
  try{audit('error.promise',{msg:msg.slice(0,80)})}catch(_){}
  console.error('[unhandledrejection]',reason);
});

function route(path){
  // path like /camera or /record/:id or /camera?type=...
  var qIdx=path.indexOf('?');
  var query={};
  var pure=path;
  if(qIdx>=0){
    pure=path.slice(0,qIdx);
    var qs=path.slice(qIdx+1).split('&');
    qs.forEach(function(p){var kv=p.split('=');query[kv[0]]=decodeURIComponent(kv[1]||'')});
  }
  var parts=pure.split('/').filter(Boolean);
  var key='/'+(parts[0]||'home');
  if(parts[1]){key+='/:id'}
  var fn=routes[key]||routes['/home'];
  renderTabbar(key);
  var param=parts[1]?decodeURIComponent(parts[1]):null;
  clearDirty();
  // 错误边界：路由 handler 异常不白屏，渲染错误页并提供诊断导出
  try{
    fn(param,query);
  }catch(e){
    renderErrorPage(e,path);
    return;
  }
  // add back button to sub-pages
  var hdr=document.querySelector('.page-header');
  if(hdr && parts[1]){
    var backBtn=document.createElement('div');
    backBtn.style.cssText='position:absolute;top:14px;left:10px;font-size:18px;cursor:pointer;color:#fff;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.2)';
    backBtn.innerHTML='‹';
    backBtn.onclick=function(){history.back()};
    hdr.style.position='relative';
    hdr.style.paddingLeft='48px';
    hdr.appendChild(backBtn);
  }
  // generic in-page navigation links (more / all / quick links)
  var goLinks=document.querySelectorAll('#app [data-go]');
  for(var m=0;m<goLinks.length;m++){
    (function(el){
      el.addEventListener('click',function(e){
        if(isDirty()&&!confirm(_dirtyMsg)){e.preventDefault();e.stopPropagation();return}
        e.stopPropagation();go(el.getAttribute('data-go'));
      });
    })(goLinks[m]);
  }
  window.scrollTo(0,0);
}
// _navConfirmed: go() 已通过 dirty 检查，hashchange 无需再 confirm
var _navConfirmed=false;
function go(path){
  if(location.hash==='#'+path)return;
  if(isDirty()&&!confirm(_dirtyMsg))return;
  _navConfirmed=true;
  clearDirty();
  location.hash='#'+path;
}
window.addEventListener('beforeunload',function(e){
  if(isDirty()){e.preventDefault();e.returnValue=_dirtyMsg;return _dirtyMsg}
});
window.addEventListener('hashchange',function(e){
  // go() 发起的导航已通过 dirty 检查，直接渲染
  if(_navConfirmed){
    _navConfirmed=false;
    var h=location.hash.slice(1)||'/home';
    route(h);
    return;
  }
  // 浏览器后退/前进：检查 dirty
  if(isDirty()){
    if(!confirm(_dirtyMsg)){
      // 用户取消，恢复旧 URL（replaceState 不触发 hashchange）
      var oldHash=e.oldURL&&e.oldURL.indexOf('#')>=0?e.oldURL.slice(e.oldURL.indexOf('#')):'#/home';
      history.replaceState(null,'',oldHash);
      return;
    }
    clearDirty();
  }
  var h2=location.hash.slice(1)||'/home';
  route(h2);
});

/* ========================= Tabbar ========================= */
function renderTabbar(activeKey){
  var tabs=[
    {key:'/home',icon:'🏠',name:'首页',match:['/home']},
    {key:'/patients',icon:'👥',name:'患者',match:['/patients','/patient']},
    {key:'/assessment',icon:'📝',name:'评估',match:['/assessment','/special-exam','/scales']},
    {key:'/plan',icon:'📋',name:'方案',match:['/plan']},
    {key:'/report',icon:'📊',name:'报告',match:['/report','/records','/record','/stats']},
    {key:'/settings',icon:'⚙️',name:'设置',match:['/settings']}
  ];
  // derive first segment of activeKey (e.g. '/patient/:id' -> '/patient')
  var seg=activeKey||'/home';
  var segParts=seg.split('/:'); // '/patient/:id' -> ['/patient','id']
  var baseSeg=segParts[0];
  var html='<div id="tabbar">';
  for(var i=0;i<tabs.length;i++){
    var t=tabs[i];
    var on='';
    for(var m=0;m<t.match.length;m++){
      if(baseSeg===t.match[m]){on='on';break}
    }
    html+='<div class="tab '+on+'" data-go="'+t.key+'"><span class="ic">'+t.icon+'</span><span>'+t.name+'</span></div>';
  }
  html+='</div>';
  document.getElementById('tabbar').outerHTML=html;
  // bind
  var els=document.querySelectorAll('#tabbar .tab');
  for(var j=0;j<els.length;j++){
    (function(el){
      el.onclick=function(){go(el.getAttribute('data-go'))};
    })(els[j]);
  }
}

/* ========================= Page Renderers ========================= */
var app=document.getElementById('app');

routes['/home']=function(){
  var t=getTherapist();
  var profiles=getProfiles();
  var patients=getPatients();
  var records=getRecords();
  var today=todayStr();
  var todayCount=records.filter(function(r){return fmtDate(r.timestamp)===today}).length;
  // pending assessment: patients without assessment record
  var assessments=getAssessments();
  var pendingCount=patients.filter(function(p){return !assessments[p.id]}).length;
  var recentPatients=patients.slice(-4).reverse();
  var recentRecords=records.slice(-3).reverse();
  var role=getUserRole();

  var rpHtml='';
  if(recentPatients.length===0){rpHtml='<div class="empty"><div class="ei">👥</div>暂无患者，去添加</div>'}
  else{recentPatients.forEach(function(p){
    rpHtml+='<div class="patient-card" data-pid="'+p.id+'"><div class="avatar">'+escapeHtml((p.name||'?').slice(0,1))+'</div><div class="patient-info"><div class="pn">'+escapeHtml(p.name)+'</div><div class="pm"><span>'+escapeHtml(p.gender||'')+'</span><span>'+escapeHtml(p.age||'')+'岁</span><span>'+escapeHtml(p.diagnosis||'')+'</span></div></div><div class="row-actions"><button class="btn-mini" data-cam="'+p.id+'">拍照</button></div></div>';
  })}

  var rrHtml='';
  if(recentRecords.length===0){rrHtml='<div class="empty"><div class="ei">📋</div>暂无记录</div>'}
  else{recentRecords.forEach(function(r){
    rrHtml+='<div class="record-card" data-rid="'+r.id+'"><div class="record-info"><div class="rn">'+escapeHtml(r.recordNo)+'</div><div class="rm">'+escapeHtml(r.patientName)+' · '+escapeHtml(r.treatmentType)+'</div><div class="rt">'+fmtTime(r.timestamp)+'</div></div></div>';
  })}

  var identitySub=(t.department?escapeHtml(t.department):'未设置科室')+(t.role?' · '+escapeHtml(t.role):'')+' · <span class="role-badge '+role+'">'+getRoleName(role)+'</span>'+(profiles.length>1?' · 共'+profiles.length+'个身份 ›':' ›');

  app.innerHTML=
    '<div class="page">'+
    '<div class="page-header" id="home_header"><h2>'+(t.name?escapeHtml(t.name):'点击设置姓名')+'</h2><p>'+identitySub+'</p></div>'+
    '<div class="stat-grid"><div class="stat-box"><div class="num">'+todayCount+'</div><div class="lbl">今日记录</div></div><div class="stat-box"><div class="num">'+patients.length+'</div><div class="lbl">患者总数</div></div><div class="stat-box"><div class="num">'+pendingCount+'</div><div class="lbl">待评估</div></div></div>'+
    '<div class="card"><div class="card-title">快捷入口</div><div class="func-grid">'+
      '<div class="func-item" data-go="/patients"><div class="fic">👥</div><div class="fname">新增患者</div></div>'+
      '<div class="func-item" data-go="/assessment"><div class="fic">📝</div><div class="fname">快速评估</div></div>'+
      '<div class="func-item" data-go="/report"><div class="fic">📄</div><div class="fname">生成报告</div></div>'+
      '<div class="func-item" data-go="/records"><div class="fic">📋</div><div class="fname">记录归档</div></div>'+
      '<div class="func-item" data-go="/stats"><div class="fic">📊</div><div class="fname">统计分析</div></div>'+
      '<div class="func-item" data-go="/settings"><div class="fic">⚙️</div><div class="fname">系统设置</div></div>'+
    '</div></div>'+
    '<div class="card"><div class="card-title">最近患者 <span class="more" data-go="/patients">全部 ›</span></div>'+rpHtml+'</div>'+
    '<div class="card"><div class="card-title">最近记录 <span class="more" data-go="/records">全部 ›</span></div>'+rrHtml+'</div>'+
    '</div>';

  // bind header to switch identity (or go to settings if no profiles)
  var hdr=document.querySelector('.page-header');
  if(hdr)hdr.onclick=function(){
    if(profiles.length===0){go('/settings');return}
    showProfileSwitcher();
  };
  // patient card click -> detail; cam button -> camera
  var pc=document.querySelectorAll('[data-cam]');
  for(var j=0;j<pc.length;j++){(function(el){el.onclick=function(e){e.stopPropagation();go('/camera?pid='+el.getAttribute('data-cam'))}})(pc[j])}
  var pcards=document.querySelectorAll('.patient-card[data-pid]');
  for(var m=0;m<pcards.length;m++){(function(el){el.onclick=function(){go('/patient/'+el.getAttribute('data-pid'))}})(pcards[m])}
  // recent records
  var rcr=document.querySelectorAll('[data-rid]');
  for(var k=0;k<rcr.length;k++){(function(el){el.onclick=function(){go('/record/'+el.getAttribute('data-rid'))}})(rcr[k])}
};

/* profile switcher modal (used on home header click) */
function showProfileSwitcher(){
  var profiles=getProfiles();
  var aid=getActiveProfileId();
  if(profiles.length===0){go('/settings');return}
  var mask=document.createElement('div');
  mask.className='modal-mask';
  var listHtml='';
  profiles.forEach(function(p){
    var on=p.id===aid;
    listHtml+='<div class="list-link" data-pid="'+p.id+'" style="cursor:pointer;'+(on?'border-color:var(--primary);background:#ebf8ff':'')+'">'+
      '<div><div style="font-weight:600">'+escapeHtml(p.name||'(未命名)')+'</div>'+
      '<div style="font-size:12px;color:#888">'+escapeHtml(p.department||'未设置科室')+(p.role?' · '+escapeHtml(p.role):'')+'</div></div>'+
      '<span class="link-arrow">'+(on?'✓ 当前':'切换')+'</span></div>';
  });
  mask.innerHTML='<div class="modal"><div class="modal-hd"><span>切换身份</span><span class="close">&times;</span></div>'+
    '<div class="modal-bd">'+listHtml+
    '<button class="btn btn-ghost" id="sp_manage" style="margin-top:10px">⚙ 前往身份管理</button></div></div>';
  document.body.appendChild(mask);
  mask.querySelector('.close').onclick=function(){mask.remove()};
  mask.onclick=function(e){if(e.target===mask)mask.remove()};
  mask.querySelector('#sp_manage').onclick=function(){mask.remove();go('/settings')};
  var items=mask.querySelectorAll('[data-pid]');
  for(var i=0;i<items.length;i++){(function(el){
    el.onclick=function(){
      setActiveProfileId(el.getAttribute('data-pid'));
      mask.remove();toast('已切换身份');route('/home');
    };
  })(items[i])}
}

routes['/patients']=function(param,query){
  var role=getUserRole();
  var allPatients=getPatients();
  // filter by role (therapists see only own patients)
  var patients=allPatients.filter(function(p){return canViewPatient(p)});
  var roleBadge='<span class="role-badge '+role+'">'+getRoleName(role)+'</span>';
  var list='';
  if(patients.length===0){list='<div class="empty"><div class="ei">👥</div>暂无患者<br>点击右上角添加</div>'}
  else{
    list='<div id="pat_list">';
    patients.forEach(function(p){
      var canDel=canDeletePatient(p);
      var canEdit=canEditPatient(p);
      list+='<div class="patient-card" data-pid="'+p.id+'"><div class="avatar">'+escapeHtml((p.name||'?').slice(0,1))+'</div><div class="patient-info"><div class="pn">'+escapeHtml(p.name)+'</div><div class="pm"><span>'+escapeHtml(p.gender||'')+'</span><span>'+escapeHtml(p.age||'')+'岁</span><span>'+escapeHtml(p.diagnosis||'')+'</span>'+(p.patientId?'<span style="font-family:monospace;font-size:11px;color:#aaa">'+escapeHtml(p.patientId)+'</span>':'')+'</div></div><div class="row-actions">'+
        (canEdit?'<button class="btn-mini" data-edit="'+p.id+'">编辑</button>':'')+
        (canDel?'<button class="btn-mini danger" data-del="'+p.id+'">删除</button>':'')+
        '</div></div>';
    });
    list+='</div>';
  }
  app.innerHTML='<div class="page"><div class="page-header"><h2>患者管理</h2><p>共 '+patients.length+' 位患者 '+roleBadge+'</p></div>'+
    '<div class="search-box"><span class="ic">🔍</span><input id="pat_search" placeholder="按姓名或患者ID搜索"></div>'+
    '<div class="card" style="padding:10px;margin-bottom:10px"><div style="font-size:13px;font-weight:600;margin-bottom:6px">📋 按患者ID直接加载</div><div style="display:flex;gap:8px"><input id="pat_id_input" placeholder="输入患者ID（如P-20250731-1234）" style="flex:1;padding:8px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px"><button class="btn" id="pat_id_load" style="white-space:nowrap">加载</button></div></div>'+
    '<div class="card"><div class="card-title">患者列表 <button class="btn-mini" id="addPatient">+ 新增</button></div>'+list+'</div></div>';

  document.getElementById('addPatient').onclick=function(){showPatientForm(null)};
  // search
  var searchInput=document.getElementById('pat_search');
  if(searchInput){
    searchInput.oninput=function(){
      var kw=this.value.trim().toLowerCase();
      var cards=document.querySelectorAll('#pat_list .patient-card');
      cards.forEach(function(el){
        if(!kw){el.style.display='';return}
        var pid=el.getAttribute('data-pid');
        var p=getPatient(pid);
        if(!p){el.style.display='none';return}
        var match=(p.name||'').toLowerCase().indexOf(kw)>=0||
                  (p.patientId||'').toLowerCase().indexOf(kw)>=0;
        el.style.display=match?'':'none';
      });
    };
  }
  // load by patient ID
  var idLoadBtn=document.getElementById('pat_id_load');
  var idInput=document.getElementById('pat_id_input');
  if(idLoadBtn&&idInput){
    function loadByPatientId(){
      var pid=(idInput.value||'').trim();
      if(!pid){toast('请输入患者ID');return}
      var matched=null;
      var allP=getPatients();
      for(var i=0;i<allP.length;i++){
        if(allP[i].patientId===pid||allP[i].patientId.toUpperCase()===pid.toUpperCase()){matched=allP[i];break}
      }
      if(!matched){toast('未找到患者ID：'+pid);return}
      go('/patient/'+matched.id);
    }
    idLoadBtn.onclick=loadByPatientId;
    idInput.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();loadByPatientId()}};
  }
  var edits=document.querySelectorAll('[data-edit]');
  for(var i=0;i<edits.length;i++){(function(el){el.onclick=function(e){e.stopPropagation();showPatientForm(el.getAttribute('data-edit'))}})(edits[i])}
  var dels=document.querySelectorAll('[data-del]');
  for(var j=0;j<dels.length;j++){(function(el){el.onclick=function(e){e.stopPropagation();confirmDialog('确定删除该患者？将同时删除其所有评估、检查、量表、方案和拍照记录',function(){
    var id=el.getAttribute('data-del');
    if(deletePatientData(id)){
      toast('已删除患者及关联数据');route('/patients');
    }else{
      toast('删除失败：存储空间不足，已回滚');
    }
  })}})(dels[j])}
  var cards=document.querySelectorAll('[data-pid]');
  for(var k=0;k<cards.length;k++){(function(el){el.onclick=function(){go('/patient/'+el.getAttribute('data-pid'))}})(cards[k])}
};

function showPatientForm(id){
  var p={name:'',gender:'男',age:'',diagnosis:'',phone:'',address:'',note:''};
  if(id){var arr=getPatients();for(var i=0;i<arr.length;i++){if(arr[i].id===id){p=arr[i];break}}}
  var mask=document.createElement('div');
  mask.className='modal-mask';
  mask.innerHTML='<div class="modal"><div class="modal-hd"><span>'+(id?'编辑患者':'新增患者')+'</span><span class="close">&times;</span></div>'+
    '<div class="modal-bd">'+
    (p.patientId?'<div class="info-row" style="margin-bottom:8px"><div class="k">患者ID</div><div class="v" style="font-family:monospace">'+escapeHtml(p.patientId)+'</div></div>':'')+
    '<div class="form-group"><label>姓名</label><input id="pf_name" value="'+escapeHtml(p.name)+'" placeholder="请输入姓名"></div>'+
    '<div class="form-group"><label>性别</label><select id="pf_gender"><option value="男"'+(p.gender==='男'?' selected':'')+'>男</option><option value="女"'+(p.gender==='女'?' selected':'')+'>女</option><option value="其他"'+(p.gender==='其他'?' selected':'')+'>其他</option></select></div>'+
    '<div class="form-group"><label>年龄</label><input id="pf_age" type="number" value="'+escapeHtml(p.age)+'" placeholder="年龄"></div>'+
    '<div class="form-group"><label>诊断</label><input id="pf_diag" value="'+escapeHtml(p.diagnosis)+'" placeholder="诊断结果"></div>'+
    '<div class="form-group"><label>联系电话</label><input id="pf_phone" value="'+escapeHtml(p.phone||'')+'" placeholder="联系电话"></div>'+
    '<div class="form-group"><label>地址</label><input id="pf_addr" value="'+escapeHtml(p.address||'')+'" placeholder="地址"></div>'+
    '<div class="form-group"><label>备注</label><textarea id="pf_note" placeholder="备注">'+escapeHtml(p.note||'')+'</textarea></div>'+
    '</div><div class="modal-ft"><button class="btn btn-ghost" id="pf_cancel">取消</button><button class="btn" id="pf_save">保存</button></div></div>';
  document.body.appendChild(mask);
  mask.querySelector('.close').onclick=function(){mask.remove()};
  document.getElementById('pf_cancel').onclick=function(){mask.remove()};
  document.getElementById('pf_save').onclick=function(){
    var name=document.getElementById('pf_name').value.trim();
    if(!name){toast('请输入姓名');return}
    var gender=document.getElementById('pf_gender').value;
    var age=document.getElementById('pf_age').value.trim();
    var diag=document.getElementById('pf_diag').value.trim();
    var phone=document.getElementById('pf_phone').value.trim();
    var addr=document.getElementById('pf_addr').value.trim();
    var note=document.getElementById('pf_note').value.trim();
    var arr=getPatients();
    var ap=getActiveProfile();
    if(id){
      for(var i=0;i<arr.length;i++){if(arr[i].id===id){arr[i].name=name;arr[i].gender=gender;arr[i].age=age;arr[i].diagnosis=diag;arr[i].phone=phone;arr[i].address=addr;arr[i].note=note;break}}
    }else{
      var newP={id:uid(),patientId:genPatientId(),name:name,gender:gender,age:age,diagnosis:diag,phone:phone,address:addr,note:note,createdAt:Date.now()};
      if(ap)newP.createdBy=ap.id;
      arr.push(newP);
    }
    if(!setPatients(arr)){toast('⚠️ 保存失败：存储空间不足');return}
    mask.remove();toast('已保存');route('/patients');
  };
  wrapSave('pf_save');
  mask.onclick=function(e){if(e.target===mask)mask.remove()};
}

/* ---- Patient Detail Page ---- */
routes['/patient/:id']=function(id){
  var p=getPatient(id);
  if(!p){app.innerHTML='<div class="page"><div class="empty"><div class="ei">❓</div>患者不存在</div><button class="btn" data-go="/patients">返回患者列表</button></div>';return}
  var role=getUserRole();
  var canEdit=canEditPatient(p);
  // patient's records
  var recs=getRecords().filter(function(r){return r.patientId===id}).sort(function(a,b){return b.timestamp-a.timestamp});
  var recHtml='';
  if(recs.length===0){recHtml='<div class="empty" style="padding:20px"><div class="ei">📷</div>暂无拍照记录</div>'}
  else{
    recs.forEach(function(r){
      recHtml+='<div class="record-card" data-rid="'+r.id+'"><img class="record-thumb" id="thumb_'+r.id+'"><div class="record-info"><div class="rn">'+escapeHtml(r.recordNo)+'</div><div class="rm">'+escapeHtml(r.treatmentType)+'</div><div class="rt">'+fmtTime(r.timestamp)+'</div></div></div>';
    });
  }

  app.innerHTML='<div class="page">'+
    '<div class="patient-detail-hd">'+
      '<div class="pname">'+escapeHtml(p.name)+'</div>'+
      '<div class="pmeta">'+
        '<span>'+escapeHtml(p.gender||'-')+'</span>'+
        '<span>'+escapeHtml(p.age||'-')+'岁</span>'+
        '<span>'+escapeHtml(p.diagnosis||'未诊断')+'</span>'+
      '</div>'+
      (p.patientId?'<div class="pid">ID: '+escapeHtml(p.patientId)+'</div>':'')+
    '</div>'+
    '<div class="card"><div class="card-title">基本信息'+(canEdit?'<button class="btn-mini" id="pd_edit">编辑</button>':'')+'</div>'+
      '<div class="info-row"><div class="k">姓名</div><div class="v">'+escapeHtml(p.name)+'</div></div>'+
      '<div class="info-row"><div class="k">性别</div><div class="v">'+escapeHtml(p.gender||'-')+'</div></div>'+
      '<div class="info-row"><div class="k">年龄</div><div class="v">'+escapeHtml(p.age||'-')+'</div></div>'+
      '<div class="info-row"><div class="k">诊断</div><div class="v">'+escapeHtml(p.diagnosis||'-')+'</div></div>'+
      '<div class="info-row"><div class="k">联系电话</div><div class="v">'+escapeHtml(p.phone||'-')+'</div></div>'+
      '<div class="info-row"><div class="k">地址</div><div class="v">'+escapeHtml(p.address||'-')+'</div></div>'+
      (p.note?'<div class="info-row" style="border:none"><div class="k">备注</div><div class="v">'+escapeHtml(p.note)+'</div></div>':'')+
    '</div>'+
    '<div class="func-grid">'+
      '<div class="func-item" data-go="/camera?pid='+id+'"><div class="fic">📷</div><div class="fname">拍照记录</div></div>'+
      '<div class="func-item" data-go="/assessment/'+id+'"><div class="fic">📝</div><div class="fname">主诉评估</div></div>'+
      '<div class="func-item" data-go="/special-exam/'+id+'"><div class="fic">🔬</div><div class="fname">特殊检查</div></div>'+
      '<div class="func-item" data-go="/scales/'+id+'"><div class="fic">📊</div><div class="fname">量表评估</div></div>'+
      '<div class="func-item" data-go="/plan/'+id+'"><div class="fic">📋</div><div class="fname">康复方案</div></div>'+
      '<div class="func-item" data-go="/report/'+id+'"><div class="fic">📄</div><div class="fname">生成报告</div></div>'+
    '</div>'+
    '<div class="card"><div class="card-title">拍照记录 <span class="more" data-go="/camera?pid='+id+'">+ 新增 ›</span></div>'+recHtml+'</div>'+
    '</div>';

  // bind edit
  var eb=document.getElementById('pd_edit');
  if(eb)eb.onclick=function(){showPatientForm(id)};
  // load thumbnails
  var cards=document.querySelectorAll('[data-rid]');
  cards.forEach(function(el){
    el.onclick=function(){go('/record/'+el.getAttribute('data-rid'))};
    var rid=el.getAttribute('data-rid');
    var r=getRecord(rid);
    if(r&&r.photoId){
      DB.getPhoto(r.photoId).then(function(blob){
        if(blob){
          var url=URL.createObjectURL(blob);
          var img=document.getElementById('thumb_'+rid);
          if(img){img.onload=function(){URL.revokeObjectURL(url)};img.src=url}
          else{URL.revokeObjectURL(url)}
        }
      }).catch(function(){});
    }
  });
};


/* ---- Camera Page ---- */
routes['/camera']=function(param,query){
  var patients=getPatients();
  var t=getTherapist();
  if(patients.length===0){
    app.innerHTML='<div class="page"><div class="page-header"><h2>拍照记录</h2></div><div class="empty"><div class="ei">👥</div>请先添加患者</div><button class="btn" data-go="/patients">去添加患者</button></div>';
    var b=document.querySelector('[data-go="/patients"]');if(b)b.onclick=function(){go('/patients')};
    return;
  }
  var profiles=getProfiles();
  var activeProfile=getActiveProfile()||profiles[0]||{id:'',name:t.name,department:t.department,role:t.role};
  var presetType=query.type||TREATMENT_TYPES[0];
  var presetPid=query.pid||'';

  var opts='';
  patients.forEach(function(p){opts+='<option value="'+p.id+'"'+(p.id===presetPid?' selected':'')+'>'+escapeHtml(p.name)+'</option>'});
  var topts='';
  // 治疗类型从东营市项目中选择
  getDYCategories().forEach(function(cat){
    topts+='<optgroup label="'+escapeHtml(cat)+'">';
    getDYItemsByCategory(cat).forEach(function(it){
      topts+='<option value="'+escapeHtml(it.name)+'">'+escapeHtml(it.name)+'</option>';
    });
    topts+='</optgroup>';
  });
  topts+='<option value="其他">其他</option>';
  // 地点预设
  var LOCATIONS=['康复大厅','作业治疗室','言语治疗室','康复门诊','病房','物理治疗室','理疗室'];
  var savedLocs=LS.get('customLocations')||[];
  var allLocs=LOCATIONS.concat(savedLocs);
  var idopts='';
  if(profiles.length===0){
    idopts='<option value="">'+escapeHtml(t.name||'(未设置)')+'</option>';
  }else{
    profiles.forEach(function(p){idopts+='<option value="'+p.id+'"'+(p.id===activeProfile.id?' selected':'')+'>'+escapeHtml(p.name||'(未命名)')+(p.department?' · '+escapeHtml(p.department):'')+'</option>'});
  }

  // default time rounded to half hour
  var nowTs=roundToHalfHour(Date.now());
  var dval=new Date(nowTs);
  var dvalStr=dval.getFullYear()+'-'+pad(dval.getMonth()+1)+'-'+pad(dval.getDate())+'T'+pad(dval.getHours())+':'+pad(dval.getMinutes());

  app.innerHTML='<div class="page"><div class="page-header"><h2>拍照记录</h2><p>拍摄治疗过程并自动加水印</p></div>'+
    '<div class="card">'+
    '<div class="form-group"><label>当前身份</label><select id="cam_identity" '+(profiles.length===0?'disabled':'')+'>'+idopts+'</select></div>'+
    '<div class="form-group"><label>选择患者</label><select id="cam_pid">'+opts+'</select></div>'+
    '<div class="form-group"><label>治疗类型</label><select id="cam_type">'+topts+'</select></div>'+
    '<div class="form-group"><label>地点</label><select id="cam_loc_sel"><option value="">请选择地点</option>'+allLocs.map(function(l){return '<option value="'+escapeHtml(l)+'">'+escapeHtml(l)+'</option>'}).join('')+'<option value="__custom">+ 自定义添加...</option></select></div>'+
    '<div class="form-group" id="cam_loc_custom_wrap" style="display:none"><label>自定义地点</label><div style="display:flex;gap:8px"><input id="cam_loc_custom" placeholder="输入地点名称"><button class="btn btn-ghost" id="cam_loc_add" style="white-space:nowrap">添加</button></div></div>'+
    '<div class="form-group" id="cam_loc_manual_wrap" style="display:none"><label>地点（手动输入）</label><input id="cam_loc" value="" placeholder="输入地点"></div>'+
    '<div class="form-group"><label>治疗师姓名</label><input id="cam_th" value="'+escapeHtml(t.name)+'" placeholder="治疗师姓名"></div>'+
    '<div class="form-group"><label>治疗时间</label><input type="datetime-local" id="cam_time" value="'+dvalStr+'"></div>'+
    '<button class="btn" id="cam_shoot">📷 拍照</button>'+
    '<input type="file" id="cam_file" accept="image/*" capture="environment" style="display:none">'+
    '</div>'+
    '<div class="card" id="cam_preview_wrap" style="display:none">'+
    '<div class="card-title">预览（已加水印）</div>'+
    '<img class="photo-preview" id="cam_preview_img">'+
    '<div style="display:flex;gap:8px">'+
    '<button class="btn" id="cam_save" style="flex:1">💾 保存记录</button>'+
    '<button class="btn btn-ghost" id="cam_update" style="flex:1">🔄 更新水印</button>'+
    '</div>'+
    '<button class="btn btn-ghost" id="cam_reshoot" style="margin-top:8px">重新拍摄</button>'+
    '</div></div>';

  var fileInput=document.getElementById('cam_file');

  // location select handler
  var locSel=document.getElementById('cam_loc_sel');
  if(locSel){
    locSel.onchange=function(){
      var customWrap=document.getElementById('cam_loc_custom_wrap');
      var manualWrap=document.getElementById('cam_loc_manual_wrap');
      if(this.value==='__custom'){
        customWrap.style.display='';
        manualWrap.style.display='';
        var ci=document.getElementById('cam_loc_custom');
        if(ci)ci.focus();
      }else{
        customWrap.style.display='none';
        manualWrap.style.display='none';
      }
    };
  }
  // add custom location
  var locAddBtn=document.getElementById('cam_loc_add');
  if(locAddBtn){
    locAddBtn.onclick=function(){
      var ci=document.getElementById('cam_loc_custom');
      var val=ci?ci.value.trim():'';
      if(!val){toast('请输入地点名称');return}
      var saved=LS.get('customLocations')||[];
      if(saved.indexOf(val)<0&&LOCATIONS.indexOf(val)<0){
        saved.push(val);
        LS.set('customLocations',saved);
      }
      // add to select
      var opt=document.createElement('option');
      opt.value=val;opt.textContent=val;
      locSel.insertBefore(opt,locSel.querySelector('option[value="__custom"]'));
      locSel.value=val;
      document.getElementById('cam_loc_custom_wrap').style.display='none';
      document.getElementById('cam_loc_manual_wrap').style.display='none';
      ci.value='';
      toast('地点已添加：'+val);
    };
  }

  // identity change -> update therapist name input
  var idSel=document.getElementById('cam_identity');
  if(idSel){
    idSel.onchange=function(){
      var pid=this.value;
      var ps=getProfiles();
      for(var i=0;i<ps.length;i++){if(ps[i].id===pid){
        document.getElementById('cam_th').value=ps[i].name||'';
        break;
      }}
    };
  }

  // read current form values
  function readForm(){
    var pid=document.getElementById('cam_pid').value;
    var pname='';
    var ps=getPatients();
    for(var i=0;i<ps.length;i++){if(ps[i].id===pid){pname=ps[i].name;break}}
    var type=document.getElementById('cam_type').value;
    var locSel=document.getElementById('cam_loc_sel');
    var loc='';
    if(locSel.value==='__custom'){
      var manualInput=document.getElementById('cam_loc');
      loc=manualInput?manualInput.value.trim():'';
    }else{
      loc=locSel.value||'未填写';
    }
    var th=document.getElementById('cam_th').value.trim()||'未填写';
    var tval=document.getElementById('cam_time').value;
    var ts;
    if(tval){
      var dd=new Date(tval);
      ts=isNaN(dd.getTime())?roundToHalfHour(Date.now()):dd.getTime();
    }else{
      ts=roundToHalfHour(Date.now());
    }
    var rno=genRecordNo(ts);
    return {pid:pid,pname:pname,type:type,loc:loc,th:th,ts:ts,rno:rno};
  }

  // encapsulated capture + watermark function (reusable for "update watermark")
  function captureAndWatermark(file){
    if(!file){toast('请先拍照');return}
    var fr=new FileReader();
    fr.onload=function(){
      var f=readForm();
      toast('正在生成水印...');
      addWatermark(fr.result,{
        datetime:fmtTimeShort(f.ts),location:f.loc,therapist:f.th,patient:f.pname,type:f.type,recordNo:f.rno
      },function(blob,dataURL){
        pendingCapture={blob:blob,dataURL:dataURL,file:file,imgURL:fr.result,pid:f.pid,pname:f.pname,type:f.type,loc:f.loc,th:f.th,ts:f.ts,rno:f.rno};
        var prevImg=document.getElementById('cam_preview_img');
        if(prevImg)prevImg.src=dataURL;
        var wrap=document.getElementById('cam_preview_wrap');
        if(wrap)wrap.style.display='block';
        toast('水印已生成');
      });
    };
    fr.readAsDataURL(file);
  }

  document.getElementById('cam_shoot').onclick=function(){fileInput.click()};
  document.getElementById('cam_reshoot').onclick=function(){fileInput.click()};
  fileInput.onchange=function(e){
    var file=e.target.files[0];
    if(!file)return;
    captureAndWatermark(file);
    fileInput.value=''; // allow re-pick same file
  };
  document.getElementById('cam_update').onclick=function(){
    if(!pendingCapture||!pendingCapture.file){toast('请先拍照');return}
    captureAndWatermark(pendingCapture.file);
  };
  document.getElementById('cam_save').onclick=function(){
    if(!pendingCapture){toast('请先拍照');return}
    // auto-update watermark if form changed before save
    var f=readForm();
    var needUpdate=(f.pid!==pendingCapture.pid||f.pname!==pendingCapture.pname||f.type!==pendingCapture.type||
                    f.loc!==pendingCapture.loc||f.th!==pendingCapture.th||f.ts!==pendingCapture.ts||f.rno!==pendingCapture.rno);
    var doSave=function(){
      var c=pendingCapture;
      var rec={id:uid(),recordNo:c.rno,patientId:c.pid,patientName:c.pname,therapistName:c.th,treatmentType:c.type,location:c.loc,timestamp:c.ts,photoId:null};
      // 1. 先写记录（photoId=null 占位），LS 失败则直接报错，不产生孤儿照片
      var rs=getRecords();
      rs.push(rec);
      if(!setRecords(rs)){
        toast('⚠️ 保存失败：存储空间不足');
        return Promise.resolve();
      }
      // 2. 再异步写照片到 IDB
      return DB.putPhoto(rec.id,c.blob).then(function(){
        // 3. 照片成功，更新记录的 photoId
        rec.photoId=rec.id;
        var rs2=getRecords();
        for(var i=0;i<rs2.length;i++){if(rs2[i].id===rec.id){rs2[i].photoId=rec.id;break}}
        setRecords(rs2);
        pendingCapture=null;
        toast('已保存记录');
        go('/record/'+rec.id);
      }).catch(function(err){
        // 照片写入失败，但记录已保存（photoId=null），用户可重新拍照
        pendingCapture=null;
        toast('记录已保存，但照片存储失败：'+(err&&err.message||''));
        go('/record/'+rec.id);
      });
    };
    if(needUpdate&&pendingCapture.file){
      // regenerate then save
      return new Promise(function(resolve,reject){
        var fr=new FileReader();
        fr.onload=function(){
          addWatermark(fr.result,{
            datetime:fmtTimeShort(f.ts),location:f.loc,therapist:f.th,patient:f.pname,type:f.type,recordNo:f.rno
          },function(blob,dataURL){
            pendingCapture={blob:blob,dataURL:dataURL,file:pendingCapture.file,imgURL:fr.result,pid:f.pid,pname:f.pname,type:f.type,loc:f.loc,th:f.th,ts:f.ts,rno:f.rno};
            doSave().then(resolve,reject);
          });
        };
        fr.readAsDataURL(pendingCapture.file);
      });
    }else{
      return doSave();
    }
  };
  wrapSave('cam_save');
};

/* ---- Records List ---- */
routes['/records']=function(){
  var records=getRecords().slice().sort(function(a,b){return b.timestamp-a.timestamp});
  var list='';
  if(records.length===0){list='<div class="empty"><div class="ei">📋</div>暂无记录，去拍照记录</div>'}
  else{
    list='<div id="rec_list">';
    records.forEach(function(r){
      list+='<div class="record-card" data-rid="'+r.id+'"><img class="record-thumb" id="thumb_'+r.id+'"><div class="record-info"><div class="rn">'+escapeHtml(r.recordNo)+'</div><div class="rm">'+escapeHtml(r.patientName)+' · '+escapeHtml(r.treatmentType)+'</div><div class="rt">'+fmtTime(r.timestamp)+'</div></div></div>';
    });
    list+='</div>';
  }
  app.innerHTML='<div class="page"><div class="page-header"><h2>记录归档</h2><p>共 '+records.length+' 条记录</p></div>'+list+'</div>';
  // load thumbnails
  var cards=document.querySelectorAll('[data-rid]');
  cards.forEach(function(el){
    el.onclick=function(){go('/record/'+el.getAttribute('data-rid'))};
    var rid=el.getAttribute('data-rid');
    var r=getRecord(rid);
    if(r&&r.photoId){
      DB.getPhoto(r.photoId).then(function(blob){
        if(blob){
          var url=URL.createObjectURL(blob);
          var img=document.getElementById('thumb_'+rid);
          if(img){img.onload=function(){URL.revokeObjectURL(url)};img.src=url}
          else{URL.revokeObjectURL(url)}
        }
      }).catch(function(){});
    }
  });
};

/* ---- Record Detail ---- */
routes['/record/:id']=function(id){
  var r=getRecord(id);
  if(!r){app.innerHTML='<div class="page"><div class="empty"><div class="ei">❓</div>记录不存在</div><button class="btn" onclick="location.hash=\'#/records\'">返回记录列表</button></div>';return}
  app.innerHTML='<div class="page"><div class="page-header"><h2>记录详情</h2><p>'+escapeHtml(r.recordNo)+'</p></div>'+
    '<div class="card"><img class="detail-photo" id="detail_img"><div class="info-row"><div class="k">记录编号</div><div class="v">'+escapeHtml(r.recordNo)+'</div></div>'+
    '<div class="info-row"><div class="k">治疗师</div><div class="v">'+escapeHtml(r.therapistName)+'</div></div>'+
    '<div class="info-row"><div class="k">患者</div><div class="v">'+escapeHtml(r.patientName)+'</div></div>'+
    '<div class="info-row"><div class="k">时间</div><div class="v">'+fmtTime(r.timestamp)+'</div></div>'+
    '<div class="info-row"><div class="k">地点</div><div class="v">'+escapeHtml(r.location)+'</div></div>'+
    '<div class="info-row"><div class="k">治疗类型</div><div class="v">'+escapeHtml(r.treatmentType)+'</div></div>'+
    '<div class="info-row" style="border:none"><div class="k">照片哈希</div><div class="v" style="font-family:monospace;font-size:12px">'+simpleHash(r.recordNo+r.patientName+r.timestamp+r.treatmentType)+'</div></div>'+
    '</div>'+
    '<button class="btn" id="gen_cert" style="margin-bottom:8px">📜 生成证明</button>'+
    '<button class="btn btn-danger" id="del_rec">删除记录</button>'+
    '<div id="cert_area"></div></div>';

  // load big photo
  if(r.photoId){
    DB.getPhoto(r.photoId).then(function(blob){
      if(blob){
        var url=URL.createObjectURL(blob);
        var img=document.getElementById('detail_img');
        if(img){img.onload=function(){URL.revokeObjectURL(url)};img.src=url}
        else{URL.revokeObjectURL(url)}
      }
    }).catch(function(){});
  }
  document.getElementById('gen_cert').onclick=function(){
    var area=document.getElementById('cert_area');
    var hash=simpleHash(r.recordNo+r.patientName+r.timestamp+r.treatmentType+r.location);
    area.innerHTML='<div class="card"><div class="cert-card"><h3>治疗记录真实性证明</h3>'+
      '<div class="cert-info">'+
      '<div class="ir"><span class="k">记录编号</span>'+escapeHtml(r.recordNo)+'</div>'+
      '<div class="ir"><span class="k">治疗师</span>'+escapeHtml(r.therapistName)+'</div>'+
      '<div class="ir"><span class="k">患者</span>'+escapeHtml(r.patientName)+'</div>'+
      '<div class="ir"><span class="k">治疗时间</span>'+fmtTime(r.timestamp)+'</div>'+
      '<div class="ir"><span class="k">地点</span>'+escapeHtml(r.location)+'</div>'+
      '<div class="ir"><span class="k">治疗类型</span>'+escapeHtml(r.treatmentType)+'</div>'+
      '<div class="ir" style="border:none"><span class="k">验证码</span><span style="font-family:monospace">'+hash+'</span></div>'+
      '</div>'+
      '<canvas class="qr-canvas" id="cert_qr" width="200" height="200"></canvas>'+
      '<p style="font-size:11px;color:#888;margin-top:6px">扫描或保存此证明卡片以验证记录真实性</p>'+
      '</div>'+
      '<button class="btn btn-ghost" id="save_cert" style="margin-top:10px">💾 保存证明图片</button></div>';
    var qrCanvas=document.getElementById('cert_qr');
    drawQR(qrCanvas,r.recordNo+'|'+r.patientName+'|'+r.timestamp+'|'+hash);
    document.getElementById('save_cert').onclick=function(){
      // render cert to canvas and download
      saveCertImage(r,hash);
    };
    area.scrollIntoView({behavior:'smooth'});
  };
  document.getElementById('del_rec').onclick=function(){
    confirmDialog('确定删除该记录？照片也将删除',function(){
      var bak=getRecords();
      var rs=bak.filter(function(x){return x.id!==id});
      if(!setRecords(rs)){toast('删除失败：存储空间不足');return}
      try{
        if(r.photoId){DB.delPhoto(r.photoId).catch(function(){})}
        toast('已删除');go('/records');
      }catch(e){
        setRecords(bak);toast('删除失败，已回滚：'+e.message);
      }
    });
  };
};

function saveCertImage(r,hash){
  var W=400,H=620;
  var canvas=document.createElement('canvas');
  canvas.width=W;canvas.height=H;
  var ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#3182ce';ctx.fillRect(0,0,W,8);
  ctx.fillStyle='#3182ce';ctx.font='700 20px sans-serif';ctx.textAlign='center';
  ctx.fillText('治疗记录真实性证明',W/2,50);
  ctx.textAlign='left';ctx.fillStyle='#333';ctx.font='14px sans-serif';
  var rows=[['记录编号',r.recordNo],['治疗师',r.therapistName],['患者',r.patientName],['治疗时间',fmtTime(r.timestamp)],['地点',r.location],['治疗类型',r.treatmentType],['验证码',hash]];
  var y=90;
  rows.forEach(function(row){
    ctx.fillStyle='#888';ctx.fillText(row[0],40,y);
    ctx.fillStyle='#333';ctx.fillText(String(row[1]),140,y);
    y+=30;
  });
  // qr
  var qrC=document.createElement('canvas');qrC.width=160;qrC.height=160;
  drawQR(qrC,r.recordNo+'|'+r.patientName+'|'+r.timestamp+'|'+hash);
  ctx.drawImage(qrC,(W-160)/2,y+10,160,160);
  ctx.fillStyle='#999';ctx.font='11px sans-serif';ctx.textAlign='center';
  ctx.fillText('治疗师拍照记录系统',W/2,H-20);
  canvas.toBlob(function(blob){
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='cert_'+r.recordNo+'.png';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_){}},5000);
    toast('证明图片已下载');
  });
}

/* ---- Stats ---- */
routes['/stats']=function(){
  var records=getRecords();
  var patients=getPatients();
  var today=todayStr();
  var todayCount=records.filter(function(r){return fmtDate(r.timestamp)===today}).length;

  // type distribution
  var typeCount={};
  TREATMENT_TYPES.forEach(function(t){typeCount[t]=0});
  records.forEach(function(r){if(typeCount[r.treatmentType]!=null){typeCount[r.treatmentType]++}});
  var maxType=Math.max.apply(null,Object.keys(typeCount).map(function(k){return typeCount[k]}));
  var typeBars='';
  TREATMENT_TYPES.forEach(function(t){
    var pct=maxType>0?Math.round(typeCount[t]/maxType*100):0;
    typeBars+='<div class="hbar"><div class="nl">'+t+'</div><div class="track"><div class="fill" style="width:'+pct+'%"></div></div><div class="nm">'+typeCount[t]+'</div></div>';
  });

  // 7 day trend
  var dayLabels=[];var dayCounts=[];
  for(var i=6;i>=0;i--){
    var d=new Date();d.setDate(d.getDate()-i);
    var ds=fmtDate(d.getTime());
    dayLabels.push(pad(d.getMonth()+1)+'-'+pad(d.getDate()));
    dayCounts.push(records.filter(function(r){return fmtDate(r.timestamp)===ds}).length);
  }
  var maxDay=Math.max.apply(null,dayCounts.concat([1]));
  var dayBars='';
  for(var j=0;j<7;j++){
    var h=Math.round(dayCounts[j]/maxDay*100);
    dayBars+='<div class="bar-col" style="height:'+(h<6?6:h)+'%"><span class="val">'+dayCounts[j]+'</span><span class="lab">'+dayLabels[j]+'</span></div>';
  }

  app.innerHTML='<div class="page"><div class="page-header"><h2>统计分析</h2><p>数据概览与趋势</p></div>'+
    '<div class="stat-grid"><div class="stat-box"><div class="num">'+todayCount+'</div><div class="lbl">今日记录</div></div><div class="stat-box"><div class="num">'+records.length+'</div><div class="lbl">累计记录</div></div><div class="stat-box"><div class="num">'+patients.length+'</div><div class="lbl">患者总数</div></div></div>'+
    '<div class="card"><div class="card-title">日期范围筛选</div><div class="filter-row"><div class="form-group"><label>开始</label><input class="date-input" type="date" id="st_start"></div><div class="form-group"><label>结束</label><input class="date-input" type="date" id="st_end"></div><button class="btn-mini" id="st_filter" style="height:34px">筛选</button></div><div id="st_result" style="font-size:13px;color:#666"></div></div>'+
    '<div class="card"><div class="card-title">治疗类型分布</div>'+typeBars+'</div>'+
    '<div class="card"><div class="card-title">近7天记录趋势</div><div class="bar-chart">'+dayBars+'</div></div>'+
    '</div>';

  document.getElementById('st_filter').onclick=function(){
    var s=document.getElementById('st_start').value;
    var e=document.getElementById('st_end').value;
    if(!s||!e){toast('请选择日期');return}
    var cnt=records.filter(function(r){var d=fmtDate(r.timestamp);return d>=s&&d<=e}).length;
    document.getElementById('st_result').innerHTML='筛选范围 <b>'+escapeHtml(s)+'</b> 至 <b>'+escapeHtml(e)+'</b>，共 <b style="color:var(--primary)">'+escapeHtml(String(cnt))+'</b> 条记录';
  };
};

/* ---- Settings ---- */
routes['/settings']=function(){
  var t=getTherapist();
  var profiles=getProfiles();
  var aid=getActiveProfileId();
  var role=getUserRole();
  var isAdmin=role==='admin';
  // build identity cards html
  var idListHtml='';
  if(profiles.length===0){
    idListHtml='<div class="empty" style="padding:20px 10px"><div class="ei">👤</div>暂无身份<br>点击下方添加</div>';
  }else{
    profiles.forEach(function(p){
      var on=p.id===aid;
      idListHtml+='<div class="card" style="margin-bottom:8px;padding:10px;'+(on?'border:2px solid var(--primary);background:#ebf8ff':'')+'">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'+
        '<div style="flex:1;min-width:0">'+
        '<div style="font-weight:600;font-size:14px">'+escapeHtml(p.name||'(未命名)')+(on?' <span style="font-size:11px;color:var(--primary)">当前</span>':'')+'</div>'+
        '<div style="font-size:12px;color:#888;margin-top:2px">'+escapeHtml(p.department||'未设置科室')+(p.role?' · '+escapeHtml(p.role):'')+'</div>'+
        '</div>'+
        '<div class="row-actions" style="flex-shrink:0">'+
        (on?'':'<button class="btn-mini" data-setactive="'+p.id+'">设为当前</button>')+
        '<button class="btn-mini" data-editprofile="'+p.id+'">编辑</button>'+
        (profiles.length>1?'<button class="btn-mini danger" data-delprofile="'+p.id+'">删除</button>':'')+
        '</div></div></div>';
    });
  }

  // patient archive list (only admin sees full management)
  var allPatients=getPatients();
  var archiveHtml='';
  if(allPatients.length===0){archiveHtml='<div class="empty" style="padding:16px"><div class="ei">👥</div>暂无患者</div>'}
  else{
    archiveHtml='<div id="archive_list">';
    allPatients.forEach(function(p){
      var canDel=canDeletePatient(p);
      archiveHtml+='<div class="patient-card" data-apid="'+p.id+'"><div class="patient-info"><div class="pn">'+escapeHtml(p.name)+' <span class="tag">'+escapeHtml(p.patientId||p.id.slice(0,6))+'</span></div><div class="pm"><span>'+escapeHtml(p.gender||'')+'</span><span>'+escapeHtml(p.age||'')+'岁</span><span>'+escapeHtml(p.diagnosis||'')+'</span></div></div><div class="row-actions">'+
        '<button class="btn-mini" data-exp1="'+p.id+'">导出</button>'+
        (canDel?'<button class="btn-mini danger" data-delap="'+p.id+'">删除</button>':'')+
        '</div></div>';
    });
    archiveHtml+='</div>';
  }

  app.innerHTML='<div class="page"><div class="page-header"><h2>设置</h2><p>身份管理 · 角色权限 · 数据管理</p></div>'+

    '<div class="card"><div class="card-title">角色权限 <span class="role-badge '+role+'">'+getRoleName(role)+'</span></div>'+
    '<div class="form-group"><label>当前角色</label><select id="set_role_select">'+
      '<option value="therapist"'+(role==='therapist'?' selected':'')+'>治疗师（仅管理自己创建的患者）</option>'+
      '<option value="director"'+(role==='director'?' selected':'')+'>主任（查看所有患者，可编辑）</option>'+
      '<option value="admin"'+(role==='admin'?' selected':'')+'>管理员（全部权限+清空数据+删除患者）</option>'+
    '</select></div>'+
    '<div class="alert info">权限说明：治疗师仅可查看/编辑自己创建的患者；主任可查看所有患者并编辑；管理员拥有全部权限（含清空数据、删除患者）。</div>'+
    '</div>'+

    '<div class="card"><div class="card-title">身份管理 <button class="btn-mini" id="set_addprofile">+ 添加身份</button></div>'+
    idListHtml+
    '</div>'+
    '<div class="card"><div class="card-title">编辑当前身份</div>'+
    '<div class="form-group"><label>姓名</label><input id="set_name" value="'+escapeHtml(t.name)+'" placeholder="请输入姓名"></div>'+
    '<div class="form-group"><label>科室</label><input id="set_dept" value="'+escapeHtml(t.department||'')+'" placeholder="请输入科室"></div>'+
    '<div class="form-group"><label>角色/职称</label><input id="set_role" value="'+escapeHtml(t.role||'')+'" placeholder="如：主管治疗师"></div>'+
    '<button class="btn" id="set_save">保存当前身份</button></div>'+

    '<div class="card"><div class="card-title">患者档案管理</div>'+
    '<div class="search-box"><span class="ic">🔍</span><input id="ap_search" placeholder="按姓名/患者ID/诊断搜索"></div>'+
    '<div class="chip-row"><span class="chip on" data-gender="">全部性别</span><span class="chip" data-gender="男">男</span><span class="chip" data-gender="女">女</span><span class="chip" data-gender="其他">其他</span></div>'+
    '<div class="chip-row"><span class="chip on" data-age="">全部年龄</span><span class="chip" data-age="young">≤30</span><span class="chip" data-age="mid">31-60</span><span class="chip" data-age="old">>60</span></div>'+
    archiveHtml+
    '<button class="btn btn-ghost" id="set_expall_patients" style="margin-top:10px">📤 导出全部患者JSON</button>'+
    '</div>'+

    '<div class="card"><div class="card-title">东营市康复医疗项目内涵查询</div>'+
    '<div class="search-box"><span class="ic">🔍</span><input id="dy_search" placeholder="输入项目名或内涵关键词搜索（如：认知、吞咽、意识）"></div>'+
    '<div class="form-group"><label>分类筛选</label><select id="dy_cat_filter"><option value="">全部分类</option>'+getDYCategories().map(function(c){return '<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>'}).join('')+'</select></div>'+
    '<div id="dy_result"></div></div>'+

    '<div class="card"><div class="card-title">数据备份与导入</div>'+
    '<div class="alert info" style="margin-bottom:10px">💡 初次使用？点击下方「加载演示数据」可一键创建 3 位示例患者（脑卒中/腰椎间盘突出/肩周炎），含完整评估、量表、特殊检查、康复方案，方便快速演示。</div>'+
    '<button class="btn" id="set_demo" style="margin-bottom:10px;background:#38a169">📋 加载演示数据（3位典型患者）</button>'+
    '<button class="btn btn-ghost" id="set_excel" style="margin-bottom:10px">📊 导出Excel（全数据）</button>'+
    '<button class="btn btn-ghost" id="set_export" style="margin-bottom:10px">📤 导出全部数据JSON备份</button>'+
    '<button class="btn btn-ghost" id="set_import" style="margin-bottom:10px">📥 导入数据JSON（合并）</button>'+
    '<input type="file" id="set_import_file" accept="application/json" style="display:none">'+
    (isAdmin?'<button class="btn btn-danger" id="set_clear">🗑 清空所有数据</button>':'<div class="alert warn">清空数据需要管理员权限</div>')+
    '</div>'+

    '<div class="card"><div class="card-title">安全与审计 <span class="more" data-go="/audit">查看日志 ›</span></div>'+
    '<button class="btn btn-ghost" id="set_pin" style="margin-bottom:10px">'+(isPinSet()?'🔒 修改 PIN 码':'🔓 设置 PIN 码（保护高危操作）')+'</button>'+
    '<div class="alert info">PIN 码保护：切换到主任/管理员角色、清空数据时需输入 PIN。遗忘 PIN 可在「查看日志」页用管理员身份重置。</div>'+
    '<button class="btn btn-ghost" id="set_audit">📋 查看操作日志</button>'+
    '</div>'+
    '<div class="card" style="text-align:center;font-size:12px;color:#999"><p>康复评估系统 v2.0</p><p>所有数据保存在本地，不会上传服务器</p></div></div>';

  // role change
  document.getElementById('set_role_select').onchange=function(){
    var newRole=this.value;
    var oldRole=getUserRole();
    // 切换到 admin/director 需 PIN（若有设置），防止误提权
    requirePinIfLocked(function(){
      setUserRole(newRole);
      audit('role.change',{from:oldRole,to:newRole});
      toast('角色已切换为：'+getRoleName(newRole));
      route('/settings');
    });
  };

  // save current identity (edits active profile)
  document.getElementById('set_save').onclick=function(){
    var name=document.getElementById('set_name').value.trim();
    var dept=document.getElementById('set_dept').value.trim();
    var roleIn=document.getElementById('set_role').value.trim();
    if(profiles.length===0){
      // create first profile
      var np={id:uid(),name:name,department:dept,role:roleIn};
      setProfiles([np]);
      setActiveProfileId(np.id);
    }else{
      var ap=getActiveProfile();
      if(ap){
        ap.name=name;ap.department=dept;ap.role=roleIn;
        var arr=getProfiles();
        for(var i=0;i<arr.length;i++){if(arr[i].id===ap.id){arr[i]=ap;break}}
        if(!setProfiles(arr)){toast('⚠️ 保存失败：存储空间不足');return}
      }
    }
    toast('已保存');route('/settings');
  };
  wrapSave('set_save');
  // add identity
  document.getElementById('set_addprofile').onclick=function(){showProfileForm(null)};
  // edit identity
  var edEls=document.querySelectorAll('[data-editprofile]');
  for(var i=0;i<edEls.length;i++){(function(el){el.onclick=function(e){e.stopPropagation();showProfileForm(el.getAttribute('data-editprofile'))}})(edEls[i])}
  // set as active
  var saEls=document.querySelectorAll('[data-setactive]');
  for(var j=0;j<saEls.length;j++){(function(el){el.onclick=function(e){e.stopPropagation();setActiveProfileId(el.getAttribute('data-setactive'));toast('已设为当前身份');route('/settings')}})(saEls[j])}
  // delete identity
  var dlEls=document.querySelectorAll('[data-delprofile]');
  for(var k=0;k<dlEls.length;k++){(function(el){el.onclick=function(e){e.stopPropagation();confirmDialog('确定删除该身份？已关联记录保留但显示原治疗师名',function(){
    var id=el.getAttribute('data-delprofile');
    var arr=getProfiles().filter(function(p){return p.id!==id});
    setProfiles(arr);
    if(getActiveProfileId()===id){setActiveProfileId(arr.length>0?arr[0].id:'')}
    toast('已删除');route('/settings');
  })}})(dlEls[k])}

  // archive filters
  var apGender='',apAge='';
  function applyArchiveFilter(){
    var kw=(document.getElementById('ap_search').value||'').trim().toLowerCase();
    document.querySelectorAll('#archive_list .patient-card').forEach(function(el){
      var pid=el.getAttribute('data-apid');
      var p=getPatient(pid);
      if(!p){el.style.display='none';return}
      var matchKw=!kw||(p.name||'').toLowerCase().indexOf(kw)>=0||(p.patientId||'').toLowerCase().indexOf(kw)>=0||(p.diagnosis||'').toLowerCase().indexOf(kw)>=0;
      var matchG=!apGender||p.gender===apGender;
      var age=parseInt(p.age,10);var matchA=true;
      if(apAge==='young')matchA=!isNaN(age)&&age<=30;
      else if(apAge==='mid')matchA=!isNaN(age)&&age>=31&&age<=60;
      else if(apAge==='old')matchA=!isNaN(age)&&age>60;
      el.style.display=(matchKw&&matchG&&matchA)?'':'none';
    });
  }
  document.getElementById('ap_search').oninput=applyArchiveFilter;
  document.querySelectorAll('.chip[data-gender]').forEach(function(el){
    el.onclick=function(){
      document.querySelectorAll('.chip[data-gender]').forEach(function(c){c.classList.remove('on')});
      el.classList.add('on');apGender=el.getAttribute('data-gender');applyArchiveFilter();
    };
  });
  document.querySelectorAll('.chip[data-age]').forEach(function(el){
    el.onclick=function(){
      document.querySelectorAll('.chip[data-age]').forEach(function(c){c.classList.remove('on')});
      el.classList.add('on');apAge=el.getAttribute('data-age');applyArchiveFilter();
    };
  });
  // single patient export
  document.querySelectorAll('[data-exp1]').forEach(function(el){
    el.onclick=function(e){e.stopPropagation();exportSinglePatient(el.getAttribute('data-exp1'))};
  });
  // delete patient (admin)
  document.querySelectorAll('[data-delap]').forEach(function(el){
    el.onclick=function(e){e.stopPropagation();confirmDialog('确定删除该患者？将同时删除其所有评估、检查、量表、方案和拍照记录',function(){
      if(deletePatientData(el.getAttribute('data-delap'))){
        toast('已删除');route('/settings');
      }else{
        toast('删除失败：存储空间不足，已回滚');
      }
    })};
  });
  // export all patients
  document.getElementById('set_expall_patients').onclick=function(){exportAllPatients()};
  // PIN 设置 / 修改
  var pinBtn=document.getElementById('set_pin');
  if(pinBtn)pinBtn.onclick=function(){showPinDialog(false)};
  // 审计日志
  var auditBtn=document.getElementById('set_audit');
  if(auditBtn)auditBtn.onclick=function(){go('/audit')};

  // 东营市项目内涵查询功能
  function renderDYPriceList(){
    var kw=(document.getElementById('dy_search').value||'').trim().toLowerCase();
    var cat=document.getElementById('dy_cat_filter').value;
    var list=DY_PRICE_LIST.filter(function(it){
      var matchKw=!kw||(it.name||'').toLowerCase().indexOf(kw)>=0||(it.code||'').toLowerCase().indexOf(kw)>=0||(it.desc||'').toLowerCase().indexOf(kw)>=0;
      var matchCat=!cat||it.category===cat;
      return matchKw&&matchCat;
    });
    var wrap=document.getElementById('dy_result');
    if(!wrap)return;
    if(list.length===0){
      wrap.innerHTML='<div class="empty" style="padding:16px"><div class="ei">💊</div>未找到匹配项目</div>';
      return;
    }
    var html='<div style="font-size:12px;color:#666;margin-top:4px">共 '+list.length+' 项</div>';
    list.forEach(function(it){
      html+='<div style="padding:10px;border-bottom:1px solid #edf2f7">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
        '<b style="font-size:14px;color:#2d3748">'+escapeHtml(it.name)+'</b>'+
        '<span style="font-size:11px;color:#a0aec0">'+escapeHtml(it.code)+'</span>'+
        '</div>'+
        '<div style="font-size:11px;color:#718096;margin:4px 0 6px"><span style="background:#ebf8ff;color:#2b6cb0;padding:1px 6px;border-radius:3px">'+escapeHtml(it.category)+'</span>'+(it.unit?' · '+escapeHtml(it.unit):'')+'</div>'+
        (it.desc?'<div style="font-size:12px;color:#2d3748;line-height:1.5;padding:6px 8px;background:#edf2f7;border-radius:4px"><b style="color:#2b6cb0">内涵：</b>'+escapeHtml(it.desc)+'</div>':'')+
        (it.note?'<div style="font-size:11px;color:#a0aec0;margin-top:4px"><b>备注：</b>'+escapeHtml(it.note)+'</div>':'')+
        '</div>';
    });
    wrap.innerHTML=html;
  }
  renderDYPriceList();
  document.getElementById('dy_search').oninput=renderDYPriceList;
  document.getElementById('dy_cat_filter').onchange=renderDYPriceList;

  document.getElementById('set_excel').onclick=function(){exportExcel()};
  document.getElementById('set_export').onclick=function(){exportFullBackup()};
  document.getElementById('set_demo').onclick=function(){loadDemoData()};
  // import
  document.getElementById('set_import').onclick=function(){document.getElementById('set_import_file').click()};
  document.getElementById('set_import_file').onchange=function(e){
    var file=e.target.files[0];
    if(!file)return;
    var fr=new FileReader();
    fr.onload=function(){
      try{
        var data=JSON.parse(fr.result);
        importFullBackup(data);
        toast('导入成功');
        route('/settings');
      }catch(err){toast('导入失败：文件格式错误')}
    };
    fr.readAsText(file);
    e.target.value='';
  };
  if(isAdmin){
    document.getElementById('set_clear').onclick=function(){
      confirmDialog('将清空所有患者、记录、评估、方案和照片，且不可恢复，确定？',function(){
        confirmDialog('再次确认清空全部数据？',function(){
          // 双重确认后，若设了 PIN 还需 PIN 验证（防他人借机清空）
          requirePinIfLocked(function(){
            var beforeCount=getPatients().length+getRecords().length;
            // 保留审计日志与 PIN，便于事后追责；其它业务 key 全清
            LS.del('therapist_info');LS.del('therapist_profiles');LS.del('active_profile_id');LS.del('patients');LS.del('records');
            LS.del('assessments');LS.del('specialExams');LS.del('scales');LS.del('plans');LS.del('customExams');LS.del('customScales');LS.del('userRole');
            LS.del(SCHEMA_KEY);
            audit('data.clear',{before:beforeCount+'items'});
            DB.clear().then(function(){toast('已清空所有数据');go('/home')}).catch(function(e){toast('清空失败：'+(e&&e.message||''))});
          });
        });
      });
    };
  }
};

/* profile form modal (add/edit identity) */
function showProfileForm(id){
  var p={name:'',department:'',role:''};
  var profiles=getProfiles();
  if(id){for(var i=0;i<profiles.length;i++){if(profiles[i].id===id){p=profiles[i];break}}}
  var mask=document.createElement('div');
  mask.className='modal-mask';
  mask.innerHTML='<div class="modal"><div class="modal-hd"><span>'+(id?'编辑身份':'添加身份')+'</span><span class="close">&times;</span></div>'+
    '<div class="modal-bd">'+
    '<div class="form-group"><label>姓名</label><input id="pf_id_name" value="'+escapeHtml(p.name)+'" placeholder="治疗师姓名"></div>'+
    '<div class="form-group"><label>科室</label><input id="pf_id_dept" value="'+escapeHtml(p.department)+'" placeholder="如：康复科"></div>'+
    '<div class="form-group"><label>角色/职称</label><input id="pf_id_role" value="'+escapeHtml(p.role)+'" placeholder="如：主管治疗师"></div>'+
    '</div><div class="modal-ft"><button class="btn btn-ghost" id="pf_id_cancel">取消</button><button class="btn" id="pf_id_save">保存</button></div></div>';
  document.body.appendChild(mask);
  mask.querySelector('.close').onclick=function(){mask.remove()};
  document.getElementById('pf_id_cancel').onclick=function(){mask.remove()};
  document.getElementById('pf_id_save').onclick=function(){
    var name=document.getElementById('pf_id_name').value.trim();
    var dept=document.getElementById('pf_id_dept').value.trim();
    var role=document.getElementById('pf_id_role').value.trim();
    if(!name){toast('请输入姓名');return}
    var arr=getProfiles();
    if(id){
      for(var i=0;i<arr.length;i++){if(arr[i].id===id){arr[i].name=name;arr[i].department=dept;arr[i].role=role;break}}
    }else{
      var np={id:uid(),name:name,department:dept,role:role};
      arr.push(np);
      // if first profile, set as active
      if(arr.length===1){setActiveProfileId(np.id)}
    }
    if(!setProfiles(arr)){toast('⚠️ 保存失败：存储空间不足');return}
    mask.remove();toast('已保存');route('/settings');
  };
  wrapSave('pf_id_save');
  mask.onclick=function(e){if(e.target===mask)mask.remove()};
}

function exportData(){
  var records=getRecords();
  var patients=getPatients();
  var t=getTherapist();
  var photoIds=records.map(function(r){return r.photoId}).filter(Boolean);
  var exp={exportTime:new Date().toISOString(),therapist:t,patients:patients,records:records,photos:[]};
  var done=0;var total=photoIds.length;
  if(total===0){finishExport(exp);return}
  photoIds.forEach(function(pid,idx){
    DB.getPhoto(pid).then(function(blob){
      if(blob){
        var fr=new FileReader();
        fr.onload=function(){
          exp.photos.push({id:pid,dataURL:fr.result});
          done++;
          if(done===total){finishExport(exp)}
        };
        fr.readAsDataURL(blob);
      }else{done++;if(done===total){finishExport(exp)}}
    }).catch(function(){done++;if(done===total){finishExport(exp)}});
  });
}
function finishExport(exp){
  var json=JSON.stringify(exp);
  var blob=new Blob([json],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='therapy_backup_'+todayStr()+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_){}},5000);
  toast('备份已下载');
}

/* ==================== Demo Data ==================== */
function loadDemoData(){
  var existing=getPatients();
  if(existing.length>0){
    if(!confirm('当前已有 '+existing.length+' 个患者数据。加载演示数据将追加 3 位示例患者（脑卒中/腰椎间盘突出/肩周炎），不会覆盖现有数据。继续？'))return;
  }
  var now=Date.now();
  var creatorId=getActiveProfile()?getActiveProfile().id:'';
  var asm=getAssessments();
  var sl=getScales();
  var se=getSpecialExams();
  var pl=getPlans();
  var ps=getPatients();
  var loadedCount=0;

  /* ============ 示例患者1：脑卒中偏瘫（神经康复典型病例） ============ */
  (function(){
    var pid='demo-stroke-'+now;
    var p={
      id:pid,
      patientId:'P-DEMO-0001',
      name:'张明（演示）',
      gender:'男',
      age:'58',
      diagnosis:'右侧脑梗死恢复期、高血压Ⅲ级（很高危）& 2型糖尿病',
      diagnosis2:'',
      phone:'138xxxx1234',
      address:'东营市东营区东三路218号',
      note:'演示数据 - 神经康复典型病例',
      createdAt:now,
      createdBy:creatorId
    };
    ps.push(p);
    asm[pid]={
      chiefComplaint:{
        symptoms:'右侧肢体无力伴言语不清，饮水偶有呛咳↑，行走不稳（宽基步态），左手精细动作差（扣纽扣/系鞋带困难）',
        onset:'1月前（晨起突发）',
        triggers:'脑卒中（大动脉粥样硬化性梗死）',
        history:'高血压15年（最高180/110mmHg）、2型糖尿病8年、高脂血症3年；吸烟史30年（20支/日）；否认药物过敏史🚫'
      },
      palpation:{
        sites:['颈椎','肩关节','腰椎','髋关节','膝关节','踝关节'],
        painLevel:7,
        findings:'右侧肩关节压痛（+++），右侧上下肢肌张力增高（改良Ashworth 2级）；右侧Babinski征（+）'
      },
      rom:[
        {joint:'肩',active:'右侧前屈90°/外展75°/外旋30°',passive:'右侧前屈160°/外展120°/外旋45°'},
        {joint:'髋',active:'右侧屈80°/伸-5°',passive:'右侧屈110°/伸15°'},
        {joint:'膝',active:'右侧主动100°（终末阻力）',passive:'右侧被动135°'},
        {joint:'踝',active:'右侧背伸-5°（下垂）',passive:'右侧背伸15°'}
      ],
      muscle:[
        {group:'三角肌（右）',grade:3},
        {group:'肱二头肌（右）',grade:4},
        {group:'腕屈肌（右）',grade:3},
        {group:'股四头肌（右）',grade:3},
        {group:'胫前肌（右）',grade:2},
        {group:'臀大肌（右）',grade:3},
        {group:'臀中肌（右）',grade:2}
      ],
      skinTemp:{left:'36.2',right:'36.5'},
      adl:{items:{'穿衣':1,'进食':1,'如厕':2,'洗澡':2,'行走':2,'上下楼':2,'购物':2,'做饭':2,'洗衣':2,'服药':1}},
      updatedAt:now
    };
    sl[pid]=[
      {scaleType:'VAS',score:7,conclusion:'重度疼痛（7-10）——右侧肩关节为主，夜间加重',data:{},date:now-86400000*3},
      {scaleType:'Barthel',score:55,conclusion:'轻度依赖（41-60分）——进食、穿衣可独立，行走/上下楼需1人帮助',data:{},date:now-86400000*2},
      {scaleType:'Walk6Min',score:280,conclusion:'中度心功能不全（150-300m）——步行距离280m，中途休息2次',data:{distance:280},date:now-86400000}
    ];
    se[pid]=[
      {examName:'霍夫曼征',category:'神经',result:'positive',note:'右侧阳性（+），左侧阴性（-）',date:now-86400000},
      {examName:'巴宾斯基征',category:'神经',result:'positive',note:'右侧趾背伸↑（+），提示锥体束损害',date:now-86400000},
      {examName:'4字试验(Patrick)',category:'髋关节',result:'suspect',note:'右侧可疑（±），骶髂关节压痛（+）',date:now-86400000}
    ];
    pl[pid]={
      acute:{
        goal:'改善右侧肢体运动功能（上肢达徒手肌力3+级，下肢负重站立≥2min），预防肩关节半脱位、关节挛缩、深静脉血栓等并发症',
        freq:'每日1次（5次/周）',
        freqCustom:'',
        items:[
          {name:'良肢位摆放',category:'康复',params:'仰卧/患侧卧/健侧卧位轮换（每2h调整1次）'},
          {name:'关节被动活动(PROM)',category:'康复',params:'右侧肩/肘/腕/髋/膝/踝各10min×2组'},
          {name:'神经肌肉电刺激(NMES)',category:'物理治疗',params:'右侧上肢（三角肌/肱二头肌）20min + 右下肢（股四头肌/胫前肌）20min'}
        ],
        notes:'⚠️ 注意预防肩关节半脱位（≤2指宽）；NMES强度以肌肉收缩可见为宜，避免过度疲劳'
      },
      subacute:{
        goal:'提高ADL能力（Barthel≥70分），促进步行恢复（室内独立步行≥50m），改善平衡功能',
        freq:'每日1次（5次/周）',
        freqCustom:'',
        items:[
          {name:'作业治疗(OT)',category:'康复',params:'上肢精细动作训练（插板/积木/系扣）30min'},
          {name:'平衡训练',category:'康复',params:'坐位→站立位→单腿站立各15min'},
          {name:'步态训练',category:'康复',params:'平行杠内10min → 助行器行走10min → 独立行走5min'}
        ],
        notes:'佩戴踝足矫形器(AFO)辅助步行；步态训练时注意防跌倒（需1人在旁保护）'
      },
      chronic:{
        goal:'巩固功能、回归社区/家庭（6分钟步行≥300m，ADL基本独立）',
        freq:'每周3次',
        freqCustom:'',
        items:[
          {name:'器械训练',category:'康复',params:'功率自行车15min（阻力逐渐递增）'},
          {name:'居家康复指导',category:'康复',params:'家属培训：良肢位维持、日常转移辅助、安全跌倒应对'}
        ],
        notes:'定期复评（每月1次Berg平衡+6分钟步行+Barthel）；如出现胸闷/气促/头晕立即停止训练🛑'
      },
      createdAt:now,
      updatedAt:now
    };
    loadedCount++;
  })();

  /* ============ 示例患者2：腰椎间盘突出（骨科康复典型病例） ============ */
  (function(){
    var pid='demo-ldh-'+now;
    var p={
      id:pid,
      patientId:'P-DEMO-0002',
      name:'李建国（演示）',
      gender:'男',
      age:'45',
      diagnosis:'腰椎间盘突出症（L4-L5、L5-S1）',
      diagnosis2:'',
      phone:'139xxxx5678',
      address:'东营市垦利区胜坨镇',
      note:'演示数据 - 骨科康复典型病例',
      createdAt:now-1000,
      createdBy:creatorId
    };
    ps.push(p);
    asm[pid]={
      chiefComplaint:{
        symptoms:'腰痛伴右下肢放射痛2周，咳嗽/打喷嚏时加重，右小腿外侧麻木',
        onset:'2周前（搬重物后突发）',
        triggers:'搬重物',
        history:'既往腰椎病史3年，反复发作；长期从事体力劳动；否认手术史、否认药物过敏'
      },
      palpation:{
        sites:['腰椎','骶髂关节','骨盆'],
        painLevel:8,
        findings:'腰椎两侧骶棘肌张力增高（++），右侧L4-L5棘旁压痛放射至右下肢小腿外侧≤足背，右下肢直腿抬高40°（+）；左侧（-）'
      },
      rom:[
        {joint:'腰椎',active:'前屈40°（受限）/后伸15°/左右侧屈各20°',passive:'前屈60°/后伸20°'},
        {joint:'髋',active:'右侧屈90°/伸0°',passive:'右侧屈110°/伸15°'},
        {joint:'膝',active:'双侧正常0-135°',passive:'正常'}
      ],
      muscle:[
        {group:'股四头肌（右）',grade:4},
        {group:'腘绳肌（右）',grade:4},
        {group:'胫前肌（右）',grade:4},
        {group:'小腿三头肌（右）',grade:4},
        {group:'臀大肌（右）',grade:4},
        {group:'背伸肌群',grade:3}
      ],
      skinTemp:{left:'36.3',right:'36.4'},
      adl:{items:{'穿衣':0,'进食':0,'如厕':1,'洗澡':1,'行走':1,'上下楼':1,'购物':1,'做饭':1,'洗衣':2,'服药':0}},
      updatedAt:now-1000
    };
    sl[pid]=[
      {scaleType:'VAS',score:8,conclusion:'重度疼痛（7-10）——右下肢放射痛为主，活动受限明显',data:{},date:now-86400000*5},
      {scaleType:'NRS',score:7,conclusion:'中度疼痛（4-6）→ 近重度（7）',data:{},date:now-86400000*4},
      {scaleType:'Barthel',score:75,conclusion:'轻度依赖（41-60分）——多数ADL可独立，弯腰/提物需协助',data:{},date:now-86400000*3},
      {scaleType:'Walk6Min',score:380,conclusion:'轻度心功能不全（300-450m）——步行距离380m',data:{distance:380},date:now-86400000*2}
    ];
    se[pid]=[
      {examName:'直腿抬高试验',category:'腰椎',result:'positive',note:'右侧40°阳性（放射至小腿外侧≤足背）；左侧阴性（80°）',date:now-86400000*2},
      {examName:'加强试验(Bragard)',category:'腰椎',result:'positive',note:'右侧踝背伸时疼痛加重（+）',date:now-86400000*2},
      {examName:'股神经牵拉试验',category:'腰椎',result:'negative',note:'双侧阴性（-），排除L2-L4神经根受累',date:now-86400000*2},
      {examName:'跟腱反射',category:'神经',result:'negative',note:'双侧对称正常（++）',date:now-86400000*2}
    ];
    pl[pid]={
      acute:{
        goal:'缓解腰腿痛（VAS≤3分），减轻神经根水肿，消除炎症反应',
        freq:'每日1次（5次/周）',
        freqCustom:'',
        items:[
          {name:'骨盆牵引',category:'物理治疗',params:'仰卧位，重量体重1/3-1/2，20min×1次/日'},
          {name:'中频电疗',category:'物理治疗',params:'腰部右侧痛点，20min，耐受量'},
          {name:'超声波治疗',category:'物理治疗',params:'腰椎右侧L4-L5区域，1MHz，8min'}
        ],
        notes:'⚠️ 急性期卧床休息（硬板床），避免弯腰/久坐/提重物；如出现大小便功能障碍立即就诊'
      },
      subacute:{
        goal:'改善腰椎活动度（前屈≥70°），增强核心肌力（腹肌/背伸肌达3+级），恢复日常活动',
        freq:'每日1次（5次/周）',
        freqCustom:'',
        items:[
          {name:'核心肌力训练',category:'康复',params:'平板支撑30s×3组 + 死虫式15次×3组 + 鸟狗式10次×3组'},
          {name:' McKenzie训练',category:'康复',params:'俯卧伸展10次×3组 + 站位后伸10次×3组'},
          {name:'软组织松解',category:'推拿',params:'腰部骶棘肌/臀大肌/梨状肌松解20min'}
        ],
        notes:'训练后VAS应≤4分；如疼痛加重立即停止并复诊；禁止脊柱旋转负荷动作'
      },
      chronic:{
        goal:'预防复发（核心稳定+正确姿势），重返工作岗位（可负重≤15kg）',
        freq:'每周3次',
        freqCustom:'',
        items:[
          {name:'器械训练',category:'康复',params:'Roman椅背伸15次×3组 + 壶铃硬拉10次×3组'},
          {name:'姿势教育',category:'康复',params:'正确搬物姿势（屈髋屈膝不弯腰）/工位调整/居家指导'}
        ],
        notes:'每月1次复评（VAS+腰椎ROM+核心肌力）；建议减重5kg；坚持居家核心训练每日20min'
      },
      createdAt:now-1000,
      updatedAt:now-1000
    };
    loadedCount++;
  })();

  /* ============ 示例患者3：肩周炎（粘连期典型病例） ============ */
  (function(){
    var pid='demo-frozen-'+now;
    var p={
      id:pid,
      patientId:'P-DEMO-0003',
      name:'王秀英（演示）',
      gender:'女',
      age:'52',
      diagnosis:'右肩关节周围炎（粘连期）',
      diagnosis2:'',
      phone:'137xxxx9012',
      address:'东营市广饶县大王镇',
      note:'演示数据 - 肩部康复典型病例',
      createdAt:now-2000,
      createdBy:creatorId
    };
    ps.push(p);
    asm[pid]={
      chiefComplaint:{
        symptoms:'右肩疼痛伴活动受限3月，夜间痛明显，梳头/穿衣/后背抓痒困难',
        onset:'3月前（无明显诱因起病，逐渐加重）',
        triggers:'受凉',
        history:'糖尿病5年（控制可）；否认肩部外伤史；否认甲状腺疾病；绝经3年'
      },
      palpation:{
        sites:['肩关节','肩胛骨'],
        painLevel:6,
        findings:'右肩关节前方/喙突外侧压痛（++），肱二头肌长头压痛（+），肩峰下压痛（+）；被动活动受限明显（各方向均受限）'
      },
      rom:[
        {joint:'肩',active:'右侧前屈80°/外展70°/外旋10°/内旋至L5水平',passive:'右侧前屈100°/外展90°/外旋20°/内旋至L1水平（疼痛终末感）'}
      ],
      muscle:[
        {group:'三角肌（右）',grade:4},
        {group:'肱二头肌（右）',grade:4},
        {group:'肱三头肌（右）',grade:5},
        {group:'背伸肌群',grade:5}
      ],
      skinTemp:{left:'36.1',right:'36.3'},
      adl:{items:{'穿衣':2,'进食':0,'如厕':0,'洗澡':2,'行走':0,'上下楼':0,'购物':1,'做饭':1,'洗衣':2,'服药':0}},
      updatedAt:now-2000
    };
    sl[pid]=[
      {scaleType:'VAS',score:6,conclusion:'中度疼痛（4-6）——夜间痛为主，影响睡眠',data:{},date:now-86400000*7},
      {scaleType:'NRS',score:5,conclusion:'中度疼痛（4-6）',data:{},date:now-86400000*6},
      {scaleType:'Barthel',score:85,conclusion:'轻度依赖（41-60分）→ 接近独立，仅穿衣/洗澡需少量协助',data:{},date:now-86400000*5},
      {scaleType:'Walk6Min',score:480,conclusion:'心功能正常（>450m）',data:{distance:480},date:now-86400000*4}
    ];
    se[pid]=[
      {examName:'Neer撞击试验',category:'肩关节',result:'positive',note:'右肩前屈内旋时疼痛（+），提示肩峰下撞击',date:now-86400000*4},
      {examName:'Hawkins试验',category:'肩关节',result:'positive',note:'右肩屈曲90°内旋时疼痛（+）',date:now-86400000*4},
      {examName:'Empty Can试验',category:'肩关节',result:'suspect',note:'右肩冈上肌可疑（±），肌力略弱',date:now-86400000*4},
      {examName:'Lift-off试验',category:'肩关节',result:'negative',note:'肩胛下肌阴性（-）',date:now-86400000*4}
    ];
    pl[pid]={
      acute:{
        goal:'缓解疼痛（VAS≤4分），减轻炎症反应，避免进一步粘连',
        freq:'每日1次（5次/周）',
        freqCustom:'',
        items:[
          {name:'超声波治疗',category:'物理治疗',params:'右肩关节前/外侧，1MHz，10min'},
          {name:'TENS经皮电刺激',category:'物理治疗',params:'右肩痛点20min，频率100Hz'},
          {name:'冰敷',category:'物理治疗',params:'训练后冰敷15min（防炎症加重）'}
        ],
        notes:'⚠️ 急性期避免主动牵伸和过度负重；夜间佩戴肩吊带缓解疼痛；睡眠避免患侧受压'
      },
      subacute:{
        goal:'改善肩关节活动度（前屈≥120°/外展≥100°/外旋≥30°），恢复ADL（梳头/穿衣独立）',
        freq:'每日1次（5次/周）',
        freqCustom:'',
        items:[
          {name:'关节松动术',category:'推拿',params:'肩肱关节牵引/向下滑动/向前滑动各3级×10min'},
          {name:'Codman钟摆运动',category:'康复',params:'弯腰患臂自然下垂，前后/左右/画圈各20次×3组'},
          {name:'主动助力ROM',category:'康复',params:'爬墙运动/滑轮运动/毛巾后背拉各10次×3组'},
          {name:'器械训练',category:'康复',params:'肩轮5min×2组 + 棍棒操10次×3组'}
        ],
        notes:'松动术达到终末感时保持30s；训练后VAS不应高于训练前2分；如疼痛持续加重复诊'
      },
      chronic:{
        goal:'恢复全范围活动（前屈≥160°/外旋≥45°），增强肩袖肌力，预防复发',
        freq:'每周3次',
        freqCustom:'',
        items:[
          {name:'弹力带训练',category:'康复',params:'外旋/内旋/外展3组×12次（红色弹力带）'},
          {name:'器械训练',category:'康复',params:'肩部器械15min（推举/侧平举/前平举）'},
          {name:'居家训练',category:'康复',params:'每日爬墙+后背拉毛巾各50次'}
        ],
        notes:'每月1次复评（VAS+ROM+肌力）；建议持续训练3-6月；控制血糖有助于恢复'
      },
      createdAt:now-2000,
      updatedAt:now-2000
    };
    loadedCount++;
  })();

  if(!setPatients(ps)){toast('⚠️ 患者保存失败：存储空间不足');return}
  if(!setAssessments(asm)){toast('⚠️ 评估保存失败');return}
  if(!setScales(sl)){toast('⚠️ 量表保存失败');return}
  if(!setSpecialExams(se)){toast('⚠️ 特殊检查保存失败');return}
  if(!setPlans(pl)){toast('⚠️ 方案保存失败');return}

  audit('demo.load',{patients:loadedCount,scales:11,exams:12,plans:3});
  toast('✅ '+loadedCount+'位示例患者已加载！点击「患者」查看');
  route('/patients');
}

function exportExcel(){
  var patients=getPatients();
  var records=getRecords().slice().sort(function(a,b){return a.timestamp-b.timestamp});
  var assessments=getAssessments();
  var specialExams=getSpecialExams();
  var scales=getScales();
  var plans=getPlans();
  var t=getTherapist();

  var html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  html+='<head><meta charset="UTF-8"></head><body>';

  // Sheet 1: 患者信息汇总
  html+='<table border="1" cellspacing="0" cellpadding="5" style="font-family:sans-serif;font-size:12px;border-collapse:collapse">';
  html+='<tr style="background:#3182ce;color:#fff;font-weight:bold;text-align:center"><td colspan="8" style="font-size:14px">康复评估系统 - 患者信息汇总</td></tr>';
  html+='<tr style="background:#3182ce;color:#fff;font-weight:bold;text-align:center">';
  ['序号','患者ID','姓名','性别','年龄','诊断','创建时间','治疗师'].forEach(function(h){html+='<td>'+h+'</td>'});
  html+='</tr>';
  patients.forEach(function(p,idx){
    var bg=idx%2===0?'#ffffff':'#f7fafc';
    html+='<tr style="background:'+bg+'">';
    html+='<td>'+(idx+1)+'</td>';
    html+='<td style="font-family:monospace">'+escapeHtml(p.patientId||'-')+'</td>';
    html+='<td>'+escapeHtml(p.name||'-')+'</td>';
    html+='<td>'+escapeHtml(p.gender||'-')+'</td>';
    html+='<td>'+escapeHtml(p.age||'-')+'</td>';
    html+='<td>'+escapeHtml(p.diagnosis||'-')+'</td>';
    html+='<td>'+escapeHtml(fmtDate(p.createdAt)||'-')+'</td>';
    html+='<td>'+escapeHtml(p.createdBy||'-')+'</td>';
    html+='</tr>';
  });
  html+='</table>';

  // Sheet 2: 拍照治疗记录
  html+='<p></p><table border="1" cellspacing="0" cellpadding="5" style="font-family:sans-serif;font-size:12px;border-collapse:collapse">';
  html+='<tr style="background:#38a169;color:#fff;font-weight:bold;text-align:center"><td colspan="9" style="font-size:14px">拍照治疗记录</td></tr>';
  html+='<tr style="background:#38a169;color:#fff;font-weight:bold;text-align:center">';
  ['记录编号','治疗师','患者','治疗时间','地点','治疗类型','时间(分钟)','验证码','备注'].forEach(function(h){html+='<td>'+h+'</td>'});
  html+='</tr>';
  records.forEach(function(r,idx){
    var bg=idx%2===0?'#ffffff':'#f7fafc';
    var dur=r.duration?r.duration+'分钟':'-';
    var vcode=simpleHash(r.recordNo+r.patientName+r.timestamp+r.treatmentType+r.location);
    html+='<tr style="background:'+bg+'">';
    html+='<td style="font-family:monospace">'+escapeHtml(r.recordNo)+'</td>';
    html+='<td>'+escapeHtml(r.therapistName)+'</td>';
    html+='<td>'+escapeHtml(r.patientName)+'</td>';
    html+='<td>'+escapeHtml(fmtTimeShort(r.timestamp))+'</td>';
    html+='<td>'+escapeHtml(r.location)+'</td>';
    html+='<td>'+escapeHtml(r.treatmentType)+'</td>';
    html+='<td>'+dur+'</td>';
    html+='<td style="font-family:monospace">'+vcode+'</td>';
    html+='<td>'+escapeHtml(r.note||'')+'</td>';
    html+='</tr>';
  });
  html+='</table>';

  // Sheet 3: 评估数据
  html+='<p></p><table border="1" cellspacing="0" cellpadding="5" style="font-family:sans-serif;font-size:12px;border-collapse:collapse">';
  html+='<tr style="background:#805ad5;color:#fff;font-weight:bold;text-align:center"><td colspan="9" style="font-size:14px">主诉与客观评估数据</td></tr>';
  html+='<tr style="background:#805ad5;color:#fff;font-weight:bold;text-align:center">';
  ['患者','主要症状','发病时间','诱因','触诊部位','压痛(0-10)','活动度','肌力','皮温(左/右)'].forEach(function(h){html+='<td>'+h+'</td>'});
  html+='</tr>';
  Object.keys(assessments).forEach(function(pid,idx){
    var p=getPatient(pid);
    var a=assessments[pid];
    if(!a)return;
    var cc=a.chiefComplaint||{};
    var pal=a.palpation||{};
    var skinT=a.skinTemp||{};
    var romStr='';
    if(a.rom&&a.rom.length){romStr=a.rom.map(function(r){return r.joint+':主'+(r.active||'-')+'/被'+(r.passive||'-')}).join('; ')}
    var muscleStr='';
    if(a.muscle&&a.muscle.length){muscleStr=a.muscle.map(function(m){return m.group+':'+m.grade+'级'}).join('; ')}
    var bg=idx%2===0?'#ffffff':'#f7fafc';
    html+='<tr style="background:'+bg+'">';
    html+='<td>'+escapeHtml(p?p.name:pid)+'</td>';
    html+='<td>'+escapeHtml(cc.symptoms||'-')+'</td>';
    html+='<td>'+escapeHtml(cc.onset||'-')+'</td>';
    html+='<td>'+escapeHtml(cc.triggers||'-')+'</td>';
    html+='<td>'+(pal.sites?escapeHtml(pal.sites.join('、')):'-')+'</td>';
    html+='<td>'+(pal.painLevel!=null?pal.painLevel:'-')+'</td>';
    html+='<td>'+escapeHtml(romStr||'-')+'</td>';
    html+='<td>'+escapeHtml(muscleStr||'-')+'</td>';
    html+='<td>'+escapeHtml((skinT.left||'-'))+'/'+escapeHtml((skinT.right||'-'))+'</td>';
    html+='</tr>';
  });
  html+='</table>';

  // Sheet 4: 量表评估
  html+='<p></p><table border="1" cellspacing="0" cellpadding="5" style="font-family:sans-serif;font-size:12px;border-collapse:collapse">';
  html+='<tr style="background:#d69e2e;color:#fff;font-weight:bold;text-align:center"><td colspan="6" style="font-size:14px">量表评估数据</td></tr>';
  html+='<tr style="background:#d69e2e;color:#fff;font-weight:bold;text-align:center">';
  ['患者','量表类型','得分','结论','测评时间','治疗师'].forEach(function(h){html+='<td>'+h+'</td>'});
  html+='</tr>';
  var scaleRowIdx=0;
  Object.keys(scales).forEach(function(pid){
    var p=getPatient(pid);
    var sl=scales[pid];
    if(!sl||!sl.length)return;
    sl.forEach(function(s){
      var bg=scaleRowIdx%2===0?'#ffffff':'#f7fafc';scaleRowIdx++;
      var sd=SCALE_DEFINITIONS[s.scaleType];
      var libItem=SCALE_LIBRARY.filter(function(x){return x.key===s.scaleType})[0];
      var scaleName=sd?sd.name:(libItem?libItem.fullName:(s.scaleType||'-'));
      html+='<tr style="background:'+bg+'">';
      html+='<td>'+escapeHtml(p?p.name:pid)+'</td>';
      html+='<td>'+escapeHtml(scaleName)+'</td>';
      html+='<td>'+escapeHtml(s.score!=null?s.score:'-')+'</td>';
      html+='<td>'+escapeHtml(s.conclusion||'-')+'</td>';
      html+='<td>'+escapeHtml(fmtTime(s.date))+'</td>';
      html+='<td>'+escapeHtml(t.name||'-')+'</td>';
      html+='</tr>';
    });
  });
  html+='</table>';

  // Sheet 5: 康复方案
  html+='<p></p><table border="1" cellspacing="0" cellpadding="5" style="font-family:sans-serif;font-size:12px;border-collapse:collapse">';
  html+='<tr style="background:#e53e3e;color:#fff;font-weight:bold;text-align:center"><td colspan="7" style="font-size:14px">康复方案数据</td></tr>';
  html+='<tr style="background:#e53e3e;color:#fff;font-weight:bold;text-align:center">';
  ['患者','阶段','治疗目标','治疗频率','治疗项目','参数','注意事项'].forEach(function(h){html+='<td>'+h+'</td>'});
  html+='</tr>';
  var planRowIdx=0;
  Object.keys(plans).forEach(function(pid){
    var p=getPatient(pid);
    var plan=plans[pid];
    if(!plan)return;
    PLAN_STAGES.forEach(function(ps){
      var st=plan[ps.key];
      if(!st)return;
      var items=st.items||[];
      if(items.length===0){
        var bg=planRowIdx%2===0?'#ffffff':'#f7fafc';planRowIdx++;
        html+='<tr style="background:'+bg+'">';
        html+='<td>'+escapeHtml(p?p.name:pid)+'</td>';
        html+='<td>'+escapeHtml(ps.name)+'</td>';
        html+='<td>'+escapeHtml(st.goal||'-')+'</td>';
        html+='<td>'+escapeHtml(st.freq||'-')+'</td>';
        html+='<td>-</td><td>-</td>';
        html+='<td>'+escapeHtml(st.notes||'-')+'</td>';
        html+='</tr>';
      }else{
        items.forEach(function(it){
          var bg=planRowIdx%2===0?'#ffffff':'#f7fafc';planRowIdx++;
          html+='<tr style="background:'+bg+'">';
          html+='<td>'+escapeHtml(p?p.name:pid)+'</td>';
          html+='<td>'+escapeHtml(ps.name)+'</td>';
          html+='<td>'+escapeHtml(st.goal||'-')+'</td>';
          html+='<td>'+escapeHtml(st.freq||'-')+'</td>';
          html+='<td>'+escapeHtml(it.name)+'</td>';
          html+='<td>'+escapeHtml(it.params||'-')+'</td>';
          html+='<td>'+escapeHtml(st.notes||'-')+'</td>';
          html+='</tr>';
        });
      }
    });
  });
  html+='</table>';

  // Sheet 6: 特殊检查
  html+='<p></p><table border="1" cellspacing="0" cellpadding="5" style="font-family:sans-serif;font-size:12px;border-collapse:collapse">';
  html+='<tr style="background:#319795;color:#fff;font-weight:bold;text-align:center"><td colspan="5" style="font-size:14px">特殊检查数据</td></tr>';
  html+='<tr style="background:#319795;color:#fff;font-weight:bold;text-align:center">';
  ['患者','检查项目','结果','备注','检查时间'].forEach(function(h){html+='<td>'+h+'</td>'});
  html+='</tr>';
  var examRowIdx=0;
  Object.keys(specialExams).forEach(function(pid){
    var p=getPatient(pid);
    var el=specialExams[pid];
    if(!el||!el.length)return;
    el.forEach(function(e){
      var bg=examRowIdx%2===0?'#ffffff':'#f7fafc';examRowIdx++;
      var resultMap={positive:'阳性',negative:'阴性',suspect:'可疑',unchecked:'未查'};
      html+='<tr style="background:'+bg+'">';
      html+='<td>'+escapeHtml(p?p.name:pid)+'</td>';
      html+='<td>'+escapeHtml(e.name||'-')+'</td>';
      html+='<td>'+(resultMap[e.result]||e.result||'-')+'</td>';
      html+='<td>'+escapeHtml(e.note||'-')+'</td>';
      html+='<td>'+escapeHtml(fmtTime(e.date))+'</td>';
      html+='</tr>';
    });
  });
  html+='</table>';

  // Summary
  html+='<p></p><table border="1" cellspacing="0" cellpadding="5" style="font-family:sans-serif;font-size:12px;border-collapse:collapse">';
  html+='<tr style="background:#2d3748;color:#fff;font-weight:bold;text-align:center"><td colspan="2" style="font-size:14px">数据统计汇总</td></tr>';
  html+='<tr><td>导出时间</td><td>'+escapeHtml(fmtTime(Date.now()))+'</td></tr>';
  html+='<tr><td>治疗师</td><td>'+escapeHtml(t.name||'-')+' ('+escapeHtml(t.department||'')+')'+'</td></tr>';
  html+='<tr><td>患者总数</td><td>'+patients.length+' 人</td></tr>';
  html+='<tr><td>拍照记录总数</td><td>'+records.length+' 条</td></tr>';
  html+='<tr><td>评估记录总数</td><td>'+Object.keys(assessments).length+' 份</td></tr>';
  html+='<tr><td>量表评估总数</td><td>'+Object.keys(scales).reduce(function(s,k){return s+(scales[k]?scales[k].length:0)},0)+' 条</td></tr>';
  html+='<tr><td>康复方案总数</td><td>'+Object.keys(plans).length+' 份</td></tr>';
  html+='<tr><td>特殊检查总数</td><td>'+Object.keys(specialExams).reduce(function(s,k){return s+(specialExams[k]?specialExams[k].length:0)},0)+' 条</td></tr>';
  html+='</table>';

  html+='</body></html>';
  var blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='康复评估全数据_'+todayStr()+'.xls';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_){}},5000);
  toast('Excel全数据已下载（'+patients.length+'患者/'+records.length+'记录/'+Object.keys(assessments).length+'评估）');
}

/* ==================== Full backup / import / single-patient export ==================== */
function exportFullBackup(){
  var records=getRecords();
  var photoIds=records.map(function(r){return r.photoId}).filter(Boolean);
  var exp={
    exportTime:new Date().toISOString(),version:'2.0',
    therapist:getTherapist(),
    profiles:getProfiles(),
    patients:getPatients(),
    records:records,
    assessments:getAssessments(),
    specialExams:getSpecialExams(),
    scales:getScales(),
    plans:getPlans(),
    customExams:getCustomExams(),
    customScales:getCustomScales(),
    userRole:getUserRole(),
    photos:[]
  };
  var done=0,total=photoIds.length;
  if(total===0){finishFullBackup(exp);return}
  photoIds.forEach(function(pid){
    DB.getPhoto(pid).then(function(blob){
      if(blob){
        var fr=new FileReader();
        fr.onload=function(){
          exp.photos.push({id:pid,dataURL:fr.result});
          done++;if(done===total){finishFullBackup(exp)}
        };
        fr.readAsDataURL(blob);
      }else{done++;if(done===total){finishFullBackup(exp)}}
    }).catch(function(){done++;if(done===total){finishFullBackup(exp)}});
  });
}
function finishFullBackup(exp){
  var json=JSON.stringify(exp);
  var blob=new Blob([json],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='rehab_backup_'+todayStr()+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_){}},5000);
  toast('完整备份已下载（含'+exp.patients.length+'患者/'+exp.records.length+'记录/'+exp.photos.length+'照片）');
}

function importFullBackup(data){
  // Anti prototype pollution: reject dangerous keys
  var BAD_KEYS={__proto__:1,constructor:1,prototype:1,hasOwnProperty:1,toString:1,valueOf:1};
  function isSafeKey(k){return !BAD_KEYS[k]&&typeof k==='string'&&k.indexOf('__')!==0}
  audit('data.import',{patients:data.patients?data.patients.length:0,records:data.records?data.records.length:0,photos:data.photos?data.photos.length:0});
  // merge: patients by id, records by id, others overwrite by key
  if(data.patients){
    var existing=getPatients();
    var map={};
    existing.forEach(function(p){if(isSafeKey(p.id))map[p.id]=p});
    data.patients.forEach(function(p){if(p&&isSafeKey(p.id))map[p.id]=p});
    setPatients(Object.keys(map).filter(isSafeKey).map(function(k){return map[k]}));
  }
  if(data.records){
    var er=getRecords();var rmap={};
    er.forEach(function(r){if(isSafeKey(r.id))rmap[r.id]=r});
    data.records.forEach(function(r){if(r&&isSafeKey(r.id))rmap[r.id]=r});
    setRecords(Object.keys(rmap).filter(isSafeKey).map(function(k){return rmap[k]}));
  }
  if(data.assessments){var a=getAssessments();Object.keys(data.assessments).filter(isSafeKey).forEach(function(k){a[k]=data.assessments[k]});setAssessments(a)}
  if(data.specialExams){var se=getSpecialExams();Object.keys(data.specialExams).filter(isSafeKey).forEach(function(k){se[k]=data.specialExams[k]});setSpecialExams(se)}
  if(data.scales){var sc=getScales();Object.keys(data.scales).filter(isSafeKey).forEach(function(k){sc[k]=data.scales[k]});setScales(sc)}
  if(data.plans){var pl=getPlans();Object.keys(data.plans).filter(isSafeKey).forEach(function(k){pl[k]=data.plans[k]});setPlans(pl)}
  if(data.profiles){var pr=getProfiles();var pmap={};pr.forEach(function(p){if(isSafeKey(p.id))pmap[p.id]=p});data.profiles.forEach(function(p){if(p&&isSafeKey(p.id))pmap[p.id]=p});setProfiles(Object.keys(pmap).filter(isSafeKey).map(function(k){return pmap[k]}))}
  if(data.customExams){var ce=getCustomExams();data.customExams.forEach(function(e){var found=ce.some(function(x){return x.name===e.name&&x.category===e.category});if(!found)ce.push(e)});setCustomExams(ce)}
  if(data.customScales){var cs=getCustomScales();data.customScales.forEach(function(s){var found=cs.some(function(x){return x.name===s.name});if(!found)cs.push(s)});setCustomScales(cs)}
  // import photos (async, race-safe via Promise.allSettled)
  if(data.photos&&data.photos.length){
    var valid=data.photos.filter(function(ph){return ph&&isSafeKey(ph.id)&&ph.dataURL});
    var skipped=data.photos.length-valid.length;
    if(valid.length>0){
      toast('正在导入'+valid.length+'张照片...');
      var promises=valid.map(function(ph){
        var blob=dataURLToBlob(ph.dataURL);
        return DB.putPhoto(ph.id,blob);
      });
      Promise.allSettled(promises).then(function(results){
        var ok=0,fail=0;
        results.forEach(function(r){if(r.status==='fulfilled')ok++;else fail++});
        var msg='已导入'+ok+'张照片';
        if(fail>0)msg+='（'+fail+'张失败）';
        if(skipped>0)msg+='（跳过'+skipped+'张无效）';
        toast(msg);
      });
    }else if(skipped>0){
      toast('已导入数据（跳过'+skipped+'张无效照片）');
    }
  }
}

function exportSinglePatient(pid){
  var p=getPatient(pid);
  if(!p){toast('患者不存在');return}
  var records=getRecords().filter(function(r){return r.patientId===pid});
  var photoIds=records.map(function(r){return r.photoId}).filter(Boolean);
  var exp={
    type:'single_patient',exportTime:new Date().toISOString(),
    patient:p,
    records:records,
    assessment:getAssessment(pid),
    specialExams:getSpecialExamList(pid),
    scales:getScaleList(pid),
    plan:getPlan(pid),
    photos:[]
  };
  var done=0,total=photoIds.length;
  if(total===0){finishSingleExport(exp);return}
  photoIds.forEach(function(photoid){
    DB.getPhoto(photoid).then(function(blob){
      if(blob){
        var fr=new FileReader();
        fr.onload=function(){
          exp.photos.push({id:photoid,dataURL:fr.result});
          done++;if(done===total){finishSingleExport(exp)}
        };
        fr.readAsDataURL(blob);
      }else{done++;if(done===total){finishSingleExport(exp)}}
    }).catch(function(){done++;if(done===total){finishSingleExport(exp)}});
  });
}
function finishSingleExport(exp){
  var json=JSON.stringify(exp);
  var blob=new Blob([json],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='patient_'+(exp.patient.patientId||exp.patient.id)+'_'+todayStr()+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_){}},5000);
  toast('已导出患者档案：'+exp.patient.name);
}

function exportAllPatients(){
  var patients=getPatients();
  var json=JSON.stringify({type:'all_patients',exportTime:new Date().toISOString(),patients:patients});
  var blob=new Blob([json],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='all_patients_'+todayStr()+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_){}},5000);
  toast('已导出 '+patients.length+' 位患者档案');
}

/* ==================== Patient Selector (for assessment/plan/report tabs) ==================== */
function renderPatientPicker(title,sub,onPick){
  var role=getUserRole();
  var patients=getPatients().filter(function(p){return canViewPatient(p)});
  var list='';
  if(patients.length===0){list='<div class="empty"><div class="ei">👥</div>暂无患者<br>请先在患者页添加</div>'}
  else{
    list='<div class="patient-select-list">';
    patients.forEach(function(p){
      list+='<div class="ps-item" data-pid="'+p.id+'"><div style="font-weight:600">'+escapeHtml(p.name)+'</div><div style="font-size:12px;color:#888;margin-top:2px"><span>'+escapeHtml(p.gender||'')+'</span> <span>'+escapeHtml(p.age||'')+'岁</span> <span>'+escapeHtml(p.diagnosis||'')+'</span>'+(p.patientId?' <span style="font-family:monospace">'+escapeHtml(p.patientId)+'</span>':'')+'</div></div>';
    });
    list+='</div>';
  }
  app.innerHTML='<div class="page"><div class="page-header"><h2>'+escapeHtml(title)+'</h2><p>'+escapeHtml(sub)+'</p></div>'+
    '<div class="search-box"><span class="ic">🔍</span><input id="pp_search" placeholder="搜索患者姓名"></div>'+
    '<div class="card">'+list+'</div></div>';
  var si=document.getElementById('pp_search');
  if(si){
    si.oninput=function(){
      var kw=this.value.trim().toLowerCase();
      document.querySelectorAll('.patient-select-list .ps-item').forEach(function(el){
        if(!kw){el.style.display='';return}
        var pid=el.getAttribute('data-pid');
        var p=getPatient(pid);
        el.style.display=((p.name||'').toLowerCase().indexOf(kw)>=0)?'':'none';
      });
    };
  }
  document.querySelectorAll('.patient-select-list .ps-item').forEach(function(el){
    el.onclick=function(){onPick(el.getAttribute('data-pid'))};
  });
}

/* ==================== Task 2: Assessment Module ==================== */
routes['/assessment']=function(){renderPatientPicker('评估','选择患者进入评估流程',function(pid){go('/assessment/'+pid)})};

/* in-memory state for dynamic lists during assessment editing */
var assessState={rom:[],muscle:[]};

routes['/assessment/:id']=function(id){
  var p=getPatient(id);
  if(!p){app.innerHTML='<div class="page"><div class="empty"><div class="ei">❓</div>患者不存在</div><button class="btn" data-go="/patients">返回</button></div>';return}
  var existing=getAssessment(id)||{};
  var cc=existing.chiefComplaint||{symptoms:'',onset:'',triggers:'',history:''};
  var pal=existing.palpation||{sites:[],painLevel:0,findings:''};
  var skinT=existing.skinTemp||{left:'',right:''};
  var adl=existing.adl||{items:{}};
  // init state
  assessState.rom=existing.rom?(JSON.parse(JSON.stringify(existing.rom))):[];
  assessState.muscle=existing.muscle?(JSON.parse(JSON.stringify(existing.muscle))):[];

  app.innerHTML='<div class="page no-print">'+
    '<div class="page-header"><h2>主诉与客观评估</h2><p>'+escapeHtml(p.name)+' · '+(p.diagnosis||'未诊断')+'</p></div>'+

    '<div class="card" style="margin-bottom:10px;position:sticky;top:0;z-index:10"><div class="form-group" style="margin:0">'+
      '<label>快速跳转（所有评估项已展开，点击下方按钮可滚动定位）</label>'+
      '<div class="pill-group" id="as_quick_jump" style="flex-wrap:wrap">'+
        '<span class="pill" data-jump="as_cc">主诉</span>'+
        '<span class="pill" data-jump="as_pal">触诊</span>'+
        '<span class="pill" data-jump="as_rom">活动度</span>'+
        '<span class="pill" data-jump="as_muscle">肌力</span>'+
        '<span class="pill" data-jump="as_skin">皮温</span>'+
        '<span class="pill" data-jump="as_adl">ADL</span>'+
      '</div>'+
    '</div></div>'+

    '<div class="section-card" id="as_cc"><div class="sc-hd"><span>主诉</span><span class="arrow">▾</span></div><div class="sc-bd">'+
      '<div class="sub-section"><div class="ss-title">主要症状（点选快填，可在下方补充）</div><div class="pill-group" id="cc_symptoms_chips">'+
        SYMPTOM_OPTIONS.map(function(s){return '<span class="pill'+(cc.symptoms&&cc.symptoms.indexOf(s)>=0?' on':'')+'" data-sym="'+s+'">'+s+'</span>'}).join('')+
      '</div></div>'+
      '<div class="form-group"><label>主要症状描述</label><textarea id="as_symptoms" placeholder="如：腰痛伴右下肢放射痛 / 右侧肢体无力">'+escapeHtml(cc.symptoms)+'</textarea></div>'+
      '<div class="sub-section"><div class="ss-title">发病时间（点选快填）</div><div class="pill-group" id="cc_onset_chips">'+
        ONSET_OPTIONS.map(function(s){return '<span class="pill'+(cc.onset===s?' on':'')+'" data-onset="'+s+'">'+s+'</span>'}).join('')+
      '</div></div>'+
      '<div class="form-group"><label>发病时间（可自定义）</label><input id="as_onset" value="'+escapeHtml(cc.onset)+'" placeholder="如：3天前/2周前"></div>'+
      '<div class="sub-section"><div class="ss-title">诱因/加重因素（点选快填）</div><div class="pill-group" id="cc_triggers_chips">'+
        TRIGGER_OPTIONS.map(function(s){return '<span class="pill'+(cc.triggers===s?' on':'')+'" data-trigger="'+s+'">'+s+'</span>'}).join('')+
      '</div></div>'+
      '<div class="form-group"><label>诱因（可自定义）</label><input id="as_triggers" value="'+escapeHtml(cc.triggers)+'" placeholder="如：搬重物/脑卒中"></div>'+
      '<div class="form-group"><label>既往史</label><textarea id="as_history" placeholder="既往病史">'+escapeHtml(cc.history)+'</textarea></div>'+
    '</div></div>'+

    '<div class="section-card" id="as_pal"><div class="sc-hd"><span>触诊</span><span class="arrow">▾</span></div><div class="sc-bd">'+
      '<div class="sub-section"><div class="ss-title">疼痛部位（多选）</div><div class="pill-group" id="pal_sites">'+PAIN_SITES.map(function(s){return '<span class="pill'+(pal.sites.indexOf(s)>=0?' on':'')+'" data-site="'+s+'">'+s+'</span>'}).join('')+'</div></div>'+
      '<div class="sub-section"><div class="ss-title">压痛程度</div><div class="slider-row"><input type="range" id="pal_pain" min="0" max="10" value="'+(pal.painLevel||0)+'"><span class="sv" id="pal_pain_v">'+(pal.painLevel||0)+'</span></div></div>'+
      '<div class="form-group"><label>触诊发现</label><textarea id="pal_findings" placeholder="触诊发现">'+escapeHtml(pal.findings)+'</textarea></div>'+
    '</div></div>'+

    '<div class="section-card" id="as_rom"><div class="sc-hd"><span>活动度 (ROM)</span><span class="arrow">▾</span></div><div class="sc-bd">'+
      '<div id="rom_list"></div>'+
      '<button class="btn btn-ghost" id="rom_add" style="margin-top:8px">+ 添加关节记录</button>'+
    '</div></div>'+

    '<div class="section-card" id="as_muscle"><div class="sc-hd"><span>肌力评估</span><span class="arrow">▾</span></div><div class="sc-bd">'+
      '<div id="muscle_list"></div>'+
      '<button class="btn btn-ghost" id="muscle_add" style="margin-top:8px">+ 添加肌力记录</button>'+
    '</div></div>'+

    '<div class="section-card" id="as_skin"><div class="sc-hd"><span>皮温</span><span class="arrow">▾</span></div><div class="sc-bd">'+
      '<div class="form-group"><label>左侧温度 (°C)</label><input type="number" step="0.1" id="sk_left" value="'+escapeHtml(skinT.left)+'" placeholder="如：36.5"></div>'+
      '<div class="form-group"><label>右侧温度 (°C)</label><input type="number" step="0.1" id="sk_right" value="'+escapeHtml(skinT.right)+'" placeholder="如：36.5"></div>'+
      '<div id="sk_diff"></div>'+
    '</div></div>'+

    '<div class="section-card" id="as_adl"><div class="sc-hd"><span>ADL 日常生活活动</span><span class="arrow">▾</span></div><div class="sc-bd">'+
      '<div id="adl_list"></div>'+
      '<div id="adl_total" style="margin-top:10px;font-weight:600;color:var(--primary)"></div>'+
    '</div></div>'+

    '<button class="btn" id="as_save">💾 保存评估</button>'+
    '<button class="btn btn-ghost" data-go="/patient/'+id+'" style="margin-top:8px">返回患者详情</button>'+
    '</div>';

  // 默认全部展开（按用户文档：所有评估项汇总展示，便于一次录完）
  document.querySelectorAll('.section-card').forEach(function(s){s.style.display='';s.classList.remove('collapsed')});
  // 快速跳转 chips：滚动定位到对应 section
  document.querySelectorAll('#as_quick_jump .pill').forEach(function(el){
    el.onclick=function(){
      var targetId=el.getAttribute('data-jump');
      var target=document.getElementById(targetId);
      if(target){
        // 高亮当前 chip
        document.querySelectorAll('#as_quick_jump .pill').forEach(function(e2){e2.classList.remove('on')});
        el.classList.add('on');
        target.scrollIntoView({behavior:'smooth',block:'start'});
        // 短暂闪烁边框提示
        target.style.transition='box-shadow .3s';
        target.style.boxShadow='0 0 0 3px var(--primary)';
        setTimeout(function(){target.style.boxShadow=''},1200);
      }
    };
  });
  // section 标题点击可折叠/展开（保留单模块收起能力）
  document.querySelectorAll('.section-card .sc-hd').forEach(function(hd){
    hd.style.cursor='pointer';
    hd.onclick=function(){
      var card=hd.parentElement;
      var bd=card.querySelector('.sc-bd');
      if(bd.style.display==='none'){bd.style.display='';hd.querySelector('.arrow').textContent='▾'}
      else{bd.style.display='none';hd.querySelector('.arrow').textContent='▸'}
    };
  });
  // palpation pills
  var palSites=pal.sites.slice();
  document.querySelectorAll('#pal_sites .pill').forEach(function(el){
    el.onclick=function(){
      var s=el.getAttribute('data-site');
      var idx=palSites.indexOf(s);
      if(idx>=0){palSites.splice(idx,1);el.classList.remove('on')}
      else{palSites.push(s);el.classList.add('on')}
    };
  });
  // pain slider
  var painInput=document.getElementById('pal_pain');
  painInput.oninput=function(){document.getElementById('pal_pain_v').textContent=this.value};

  // 主诉：症状多选 chips（点击追加到 textarea）
  var symInput=document.getElementById('as_symptoms');
  document.querySelectorAll('#cc_symptoms_chips .pill').forEach(function(el){
    el.onclick=function(){
      var s=el.getAttribute('data-sym');
      var cur=symInput.value.trim();
      // 单选模式：点击高亮，再次点取消；textarea 同步追加
      var isOn=el.classList.contains('on');
      document.querySelectorAll('#cc_symptoms_chips .pill').forEach(function(e2){e2.classList.remove('on')});
      if(isOn){
        // 取消：从 textarea 中移除该症状
        symInput.value=cur.replace(new RegExp('，?'+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'，?'),'').replace(/^，|，$/,'').trim();
      }else{
        el.classList.add('on');
        symInput.value=cur?cur+'，'+s:s;
      }
      symInput.focus();
    };
  });
  // 主诉：发病时间单选 chips
  var onsetInput=document.getElementById('as_onset');
  document.querySelectorAll('#cc_onset_chips .pill').forEach(function(el){
    el.onclick=function(){
      var s=el.getAttribute('data-onset');
      document.querySelectorAll('#cc_onset_chips .pill').forEach(function(e2){e2.classList.remove('on')});
      if(onsetInput.value===s){
        onsetInput.value='';el.classList.remove('on');
      }else{
        el.classList.add('on');onsetInput.value=s;
      }
    };
  });
  // 主诉：诱因单选 chips
  var trigInput=document.getElementById('as_triggers');
  document.querySelectorAll('#cc_triggers_chips .pill').forEach(function(el){
    el.onclick=function(){
      var s=el.getAttribute('data-trigger');
      document.querySelectorAll('#cc_triggers_chips .pill').forEach(function(e2){e2.classList.remove('on')});
      if(trigInput.value===s){
        trigInput.value='';el.classList.remove('on');
      }else{
        el.classList.add('on');trigInput.value=s;
      }
    };
  });
  // textarea 手动输入时，清掉对应 chips 高亮（避免状态错乱）
  symInput.oninput=function(){
    document.querySelectorAll('#cc_symptoms_chips .pill').forEach(function(e2){e2.classList.remove('on')});
  };
  onsetInput.oninput=function(){
    document.querySelectorAll('#cc_onset_chips .pill').forEach(function(e2){e2.classList.remove('on')});
  };
  trigInput.oninput=function(){
    document.querySelectorAll('#cc_triggers_chips .pill').forEach(function(e2){e2.classList.remove('on')});
  };

  // ROM render
  function renderRom(){
    var wrap=document.getElementById('rom_list');
    var html='';
    assessState.rom.forEach(function(r,idx){
      html+='<div class="dyn-item"><div class="di-hd"><span>关节：'+escapeHtml(r.joint||'未选')+'</span><span class="di-rm" data-rm-rom="'+idx+'">删除</span></div>'+
        '<div class="rom-row"><div class="rom-cell"><label>关节</label><select data-rom-joint="'+idx+'">'+ROM_JOINTS.map(function(j){return '<option value="'+j+'"'+(r.joint===j?' selected':'')+'>'+j+'</option>'}).join('')+'</select></div>'+
        '<div class="rom-cell"><label>主动活动度</label><input placeholder="屈/伸/外展..." value="'+escapeHtml(r.active||'')+'" data-rom-active="'+idx+'"></div>'+
        '<div class="rom-cell"><label>被动活动度</label><input placeholder="数值" value="'+escapeHtml(r.passive||'')+'" data-rom-passive="'+idx+'"></div></div></div>';
    });
    wrap.innerHTML=html||'<div style="color:#aaa;font-size:12px;text-align:center;padding:8px">暂无关节记录</div>';
    wrap.querySelectorAll('[data-rm-rom]').forEach(function(el){el.onclick=function(){assessState.rom.splice(+el.getAttribute('data-rm-rom'),1);renderRom()}});
    wrap.querySelectorAll('[data-rom-joint]').forEach(function(el){el.onchange=function(){assessState.rom[+el.getAttribute('data-rom-joint')].joint=el.value}});
    wrap.querySelectorAll('[data-rom-active]').forEach(function(el){el.oninput=function(){assessState.rom[+el.getAttribute('data-rom-active')].active=el.value}});
    wrap.querySelectorAll('[data-rom-passive]').forEach(function(el){el.oninput=function(){assessState.rom[+el.getAttribute('data-rom-passive')].passive=el.value}});
  }
  document.getElementById('rom_add').onclick=function(){assessState.rom.push({joint:ROM_JOINTS[0],active:'',passive:''});renderRom()};
  renderRom();

  // muscle render
  function renderMuscle(){
    var wrap=document.getElementById('muscle_list');
    var html='';
    assessState.muscle.forEach(function(m,idx){
      var gradeHtml='';
      for(var g=0;g<=5;g++){
        gradeHtml+='<label'+(m.grade==g?' style="background:var(--primary);color:#fff"':'')+'><input type="radio" name="mg_'+idx+'" value="'+g+'" '+(m.grade==g?'checked':'')+'> '+g+'级</label>';
      }
      html+='<div class="dyn-item"><div class="di-hd"><span>'+escapeHtml(m.group||'未选')+'</span><span class="di-rm" data-rm-muscle="'+idx+'">删除</span></div>'+
        '<div class="form-group"><label>肌群</label><select data-muscle-group="'+idx+'">'+MUSCLE_GROUPS.map(function(g2){return '<option value="'+g2+'"'+(m.group===g2?' selected':'')+'>'+g2+'</option>'}).join('')+'</select></div>'+
        '<div class="form-group"><label>肌力等级 (0-5)</label><div class="pill-group">'+gradeHtml+'</div></div>'+
        '<div class="form-group"><label>备注</label><input value="'+escapeHtml(m.note||'')+'" data-muscle-note="'+idx+'"></div></div>';
    });
    wrap.innerHTML=html||'<div style="color:#aaa;font-size:12px;text-align:center;padding:8px">暂无肌力记录</div>';
    wrap.querySelectorAll('[data-rm-muscle]').forEach(function(el){el.onclick=function(){assessState.muscle.splice(+el.getAttribute('data-rm-muscle'),1);renderMuscle()}});
    wrap.querySelectorAll('[data-muscle-group]').forEach(function(el){el.onchange=function(){assessState.muscle[+el.getAttribute('data-muscle-group')].group=el.value;renderMuscle()}});
    wrap.querySelectorAll('[data-muscle-note]').forEach(function(el){el.oninput=function(){assessState.muscle[+el.getAttribute('data-muscle-note')].note=el.value}});
    wrap.querySelectorAll('input[type=radio][name^=mg_]').forEach(function(el){
      el.onchange=function(){
        var idx=+el.name.split('_')[1];
        assessState.muscle[idx].grade=+el.value;
        renderMuscle();
      };
    });
  }
  document.getElementById('muscle_add').onclick=function(){assessState.muscle.push({group:MUSCLE_GROUPS[0],grade:0,note:''});renderMuscle()};
  renderMuscle();

  // skin temp diff
  var skL=document.getElementById('sk_left'),skR=document.getElementById('sk_right');
  function calcSkinDiff(){
    var l=parseFloat(skL.value),r=parseFloat(skR.value);
    var box=document.getElementById('sk_diff');
    if(isNaN(l)||isNaN(r)){box.innerHTML='';return}
    var diff=Math.abs(l-r);
    var cls=diff>2?'danger':'info';
    var msg=diff>2?'⚠ 温差过大（>2°C），提示异常':'温差 '+diff.toFixed(1)+'°C，正常范围内';
    box.innerHTML='<div class="alert '+cls+'">'+msg+'</div>';
  }
  skL.oninput=calcSkinDiff;skR.oninput=calcSkinDiff;calcSkinDiff();

  // ADL render
  var adlData=adl.items||{};
  function renderAdl(){
    var wrap=document.getElementById('adl_list');
    var html='';
    ADL_ITEMS.forEach(function(item){
      var cur=adlData[item];
      html+='<div class="sub-section"><div class="ss-title">'+item+'</div><div class="pill-group">'+
        [{l:'独立(0)',v:0},{l:'需协助(1)',v:1},{l:'不能(2)',v:2}].map(function(o){
          return '<span class="pill'+(cur===o.v?' on':'')+'" data-adl="'+item+'" data-v="'+o.v+'">'+o.l+'</span>';
        }).join('')+'</div></div>';
    });
    wrap.innerHTML=html;
    wrap.querySelectorAll('.pill[data-adl]').forEach(function(el){
      el.onclick=function(){
        adlData[el.getAttribute('data-adl')]=+el.getAttribute('data-v');
        renderAdl();calcAdlTotal();
      };
    });
  }
  function calcAdlTotal(){
    var total=0,count=0;
    ADL_ITEMS.forEach(function(it){if(adlData[it]!=null){total+=adlData[it];count++}});
    var box=document.getElementById('adl_total');
    if(count===0){box.textContent='';return}
    var pct=Math.round((1-total/(count*2))*100);
    var lvl=pct>=80?'独立':(pct>=50?'轻度依赖':(pct>=20?'中度依赖':'重度依赖'));
    box.textContent='ADL总分：'+total+' / 独立程度：'+pct+'% ('+lvl+')';
  }
  renderAdl();calcAdlTotal();

  // save
  document.getElementById('as_save').onclick=function(){
    var data={
      chiefComplaint:{
        symptoms:document.getElementById('as_symptoms').value.trim(),
        onset:document.getElementById('as_onset').value.trim(),
        triggers:document.getElementById('as_triggers').value.trim(),
        history:document.getElementById('as_history').value.trim()
      },
      palpation:{
        sites:palSites,
        painLevel:+document.getElementById('pal_pain').value,
        findings:document.getElementById('pal_findings').value.trim()
      },
      rom:JSON.parse(JSON.stringify(assessState.rom)),
      muscle:JSON.parse(JSON.stringify(assessState.muscle)),
      skinTemp:{left:document.getElementById('sk_left').value.trim(),right:document.getElementById('sk_right').value.trim()},
      adl:{items:adlData}
    };
    clearDirty();
    if(!setAssessment(id,data)){toast('⚠️ 保存失败：存储空间不足');markDirty('form');return}
    toast('评估已保存');
  };
  wrapSave('as_save');
  bindDirtyGuard('app');
};

/* ==================== Task 3: Special Exam Module ==================== */
routes['/special-exam']=function(){renderPatientPicker('特殊检查','选择患者进行特殊检查',function(pid){go('/special-exam/'+pid)})};

routes['/special-exam/:id']=function(id){
  var p=getPatient(id);
  if(!p){app.innerHTML='<div class="page"><div class="empty"><div class="ei">❓</div>患者不存在</div><button class="btn" data-go="/patients">返回</button></div>';return}
  var custom=getCustomExams();
  var allExams=SPECIAL_EXAMS.concat(custom);
  // existing results: map name-> {result,note}
  var existing=getSpecialExamList(id);
  var resultMap={};
  existing.forEach(function(e){resultMap[e.examName]={result:e.result,note:e.note}});
  // group by category
  var cats={};
  allExams.forEach(function(e,idx){if(!cats[e.category])cats[e.category]=[];cats[e.category].push({exam:e,idx:idx})});

  var bodyHtml='';
  Object.keys(cats).forEach(function(cat){
    bodyHtml+='<div class="cat-group"><div class="cat-title">'+escapeHtml(cat)+'</div>';
    cats[cat].forEach(function(item){
      var e=item.exam;var idx=item.idx;
      var cur=resultMap[e.name]||{result:'unchecked',note:''};
      var resultHtml=EXAM_RESULTS.map(function(r){
        return '<label class="'+r.cls+(cur.result===r.val?' checked':'')+'" data-res="'+r.val+'"><input type="radio" name="ex_'+idx+'" value="'+r.val+'" '+(cur.result===r.val?'checked':'')+'><span>'+r.label+'</span></label>';
      }).join('');
      bodyHtml+='<div class="exam-row"><div class="ex-name">'+escapeHtml(e.name)+'</div>'+
        '<div class="ex-result">'+resultHtml+'</div>'+
        '<input class="ex-note" placeholder="备注" value="'+escapeHtml(cur.note||'')+'" data-note="'+idx+'">'+
        '</div>';
    });
    bodyHtml+='</div>';
  });

  app.innerHTML='<div class="page no-print">'+
    '<div class="page-header"><h2>特殊检查</h2><p>'+escapeHtml(p.name)+'</p></div>'+
    '<div class="card">'+bodyHtml+'</div>'+
    '<div class="card"><div class="card-title">自定义检查项</div>'+
      '<div class="form-group"><label>名称</label><input id="ce_name" placeholder="检查项目名称"></div>'+
      '<div class="form-group"><label>分类</label><input id="ce_cat" placeholder="如：肩关节"></div>'+
      '<button class="btn btn-ghost" id="ce_add">+ 添加自定义检查项</button>'+
    '</div>'+
    '<button class="btn" id="se_save" style="margin-top:8px">💾 保存检查结果</button>'+
    '<button class="btn btn-ghost" data-go="/patient/'+id+'" style="margin-top:8px">返回患者详情</button>'+
    '</div>';

  // bind radio pills (visual toggle)
  document.querySelectorAll('.exam-row .ex-result label').forEach(function(lb){
    lb.onclick=function(e){
      e.preventDefault();
      var name=this.parentNode.querySelector('input').name;
      var val=this.getAttribute('data-res');
      // update radio
      this.parentNode.querySelectorAll('input[name="'+name+'"]').forEach(function(r){r.checked=false;r.parentNode.classList.remove('checked')});
      this.querySelector('input').checked=true;
      this.classList.add('checked');
    };
  });
  // add custom exam
  document.getElementById('ce_add').onclick=function(){
    var nm=document.getElementById('ce_name').value.trim();
    var ct=document.getElementById('ce_cat').value.trim()||'其他';
    if(!nm){toast('请输入名称');return}
    var arr=getCustomExams();
    arr.push({name:nm,category:ct});
    if(!setCustomExams(arr)){toast('⚠️ 保存失败：存储空间不足');return}
    toast('已添加，请重新选择结果并保存');
    route('/special-exam/'+id);
  };
  // save
  document.getElementById('se_save').onclick=function(){
    var list=[];
    allExams.forEach(function(e,idx){
      var checked=document.querySelector('input[name="ex_'+idx+'"]:checked');
      var noteEl=document.querySelector('[data-note="'+idx+'"]');
      var res=checked?checked.value:'unchecked';
      var note=noteEl?noteEl.value.trim():'';
      // only save if has a result other than unchecked or has note
      if(res!=='unchecked'||note){
        list.push({examName:e.name,category:e.category,result:res,note:note,date:Date.now()});
      }
    });
    clearDirty();
    if(!setSpecialExamList(id,list)){toast('⚠️ 保存失败：存储空间不足');markDirty('form');return}
    toast('已保存 '+list.length+' 项检查结果');
  };
  wrapSave('se_save');
  bindDirtyGuard('app');
};

/* ==================== Task 4: Scales Module ==================== */
routes['/scales']=function(){renderPatientPicker('量表评估','选择患者进行量表评估',function(pid){go('/scales/'+pid)})};

routes['/scales/:id']=function(id){
  var p=getPatient(id);
  if(!p){app.innerHTML='<div class="page"><div class="empty"><div class="ei">❓</div>患者不存在</div><button class="btn" data-go="/patients">返回</button></div>';return}
  var history=getScaleList(id).slice().reverse();

  // category chips
  var chipsHtml=SCALE_CATEGORIES.map(function(c,i){return '<span class="chip'+(i===0?' on':'')+'" data-cat="'+c+'">'+c+'</span>'}).join('');

  // scale forms
  var formsHtml='';
  // VAS
  formsHtml+='<div class="scale-card" data-scale="VAS" data-cat="疼痛评估"><div class="sc-name"><span>VAS疼痛评分</span><span class="tag">疼痛评估</span></div>'+
    '<div class="slider-row"><input type="range" id="sl_vas" min="0" max="10" value="0"><span class="sv" id="sl_vas_v">0</span></div>'+
    '<div class="sc-conclusion" id="sl_vas_c">轻度疼痛（0-3）</div>'+
    '<button class="btn-mini" id="sl_vas_save" style="margin-top:8px">保存本次</button></div>';
  // NRS
  var nrsHtml='';
  for(var n=0;n<=10;n++){nrsHtml+='<label class="pill'+(n===0?' on':'')+'" data-nrs="'+n+'">'+n+'</label>'}
  formsHtml+='<div class="scale-card" data-scale="NRS" data-cat="疼痛评估"><div class="sc-name"><span>NRS数字评分</span><span class="tag">疼痛评估</span></div>'+
    '<div class="pill-group" id="nrs_group">'+nrsHtml+'</div><div class="sc-conclusion" id="sl_nrs_c">轻度疼痛（0-3）</div>'+
    '<button class="btn-mini" id="sl_nrs_save" style="margin-top:8px">保存本次</button></div>';
  // MPQ
  formsHtml+='<div class="scale-card" data-scale="MPQ" data-cat="疼痛评估"><div class="sc-name"><span>MPQ简化版</span><span class="tag">疼痛评估</span></div>'+
    '<div class="ss-title" style="margin-top:6px">感觉项（0-3分）</div><div id="mpq_sensory"></div>'+
    '<div class="ss-title">情感项（0-3分）</div><div id="mpq_affective"></div>'+
    '<div class="ss-title">评估项</div><div class="pill-group" id="mpq_eval"></div>'+
    '<div class="sc-conclusion" id="sl_mpq_c">PRI总分 0 - 轻度疼痛</div>'+
    '<button class="btn-mini" id="sl_mpq_save" style="margin-top:8px">保存本次</button></div>';
  // Barthel
  formsHtml+='<div class="scale-card" data-scale="Barthel" data-cat="功能与生活能力"><div class="sc-name"><span>Barthel指数</span><span class="tag">功能与生活能力</span></div>'+
    '<div id="barthel_list"></div><div class="sc-conclusion" id="sl_bar_c">总分：0 / 100 - 完全依赖（≤20分）</div>'+
    '<button class="btn-mini" id="sl_bar_save" style="margin-top:8px">保存本次</button></div>';
  // Walk6Min
  formsHtml+='<div class="scale-card" data-scale="Walk6Min" data-cat="心肺评估"><div class="sc-name"><span>6分钟步行试验</span><span class="tag">心肺评估</span></div>'+
    '<div class="form-group"><label>步行距离 (米)</label><input type="number" id="sl_walk" placeholder="如：350"></div>'+
    '<div class="sc-conclusion" id="sl_walk_c">请输入距离</div>'+
    '<button class="btn-mini" id="sl_walk_save" style="margin-top:8px">保存本次</button></div>';
  // custom scales
  var customScales=getCustomScales();
  customScales.forEach(function(cs){
    formsHtml+='<div class="scale-card" data-scale="custom_'+cs.id+'" data-cat="自定义"><div class="sc-name"><span>'+escapeHtml(cs.name)+'</span><span class="tag">自定义</span></div>'+
      '<div id="cs_'+cs.id+'"></div>'+
      '<div class="sc-conclusion" id="cs_c_'+cs.id+'">总分：0</div>'+
      '<button class="btn-mini" data-cs-save="'+cs.id+'" style="margin-top:8px">保存本次</button></div>';
  });

  // history
  var histHtml='';
  if(history.length===0){histHtml='<div class="empty" style="padding:16px"><div class="ei">📊</div>暂无评估记录</div>'}
  else{
    histHtml='<div id="hist_list">';
    history.forEach(function(h){
      var sd=SCALE_DEFINITIONS[h.scaleType];
      var libItem=SCALE_LIBRARY.filter(function(x){return x.key===h.scaleType})[0];
      var sname=sd?sd.name:(libItem?libItem.fullName:(h.scaleType||'量表'));
      histHtml+='<div class="record-card" data-hid="'+h.date+'"><div class="record-info"><div class="rn">'+escapeHtml(sname)+'</div><div class="rm">得分：'+escapeHtml(h.score)+' · '+escapeHtml(h.conclusion)+'</div><div class="rt">'+fmtTime(h.date)+'</div></div></div>';
    });
    histHtml+='</div>';
  }

  /* 快速评分记录 + 量表库参考（按用户文档：覆盖71个标准化量表，12大分类） */
  var groupedCats={};
  SCALE_LIBRARY.forEach(function(s){if(!groupedCats[s.category])groupedCats[s.category]=[];groupedCats[s.category].push(s)});
  // 量表库下拉（按分类分组）
  var quickScaleOpts='';
  Object.keys(groupedCats).forEach(function(cat){
    quickScaleOpts+='<optgroup label="'+escapeHtml(cat)+'">';
    groupedCats[cat].forEach(function(s){
      quickScaleOpts+='<option value="'+s.key+'">'+escapeHtml(s.fullName)+'（'+escapeHtml(s.scoreRange)+'）</option>';
    });
    quickScaleOpts+='</optgroup>';
  });
  // 量表库参考（分组折叠展示）
  var libRefHtml='';
  Object.keys(groupedCats).forEach(function(cat){
    libRefHtml+='<div class="lib-cat"><div class="lib-cat-hd"><span class="arrow">▾</span> '+escapeHtml(cat)+'（'+groupedCats[cat].length+'个）</div><div class="lib-cat-bd">';
    groupedCats[cat].forEach(function(s){
      libRefHtml+='<div class="lib-item"><div class="li-name">'+escapeHtml(s.fullName)+' <span class="tag">'+escapeHtml(s.scoreRange)+'</span>'+((s.interactive)?' <span class="tag" style="background:#c6f6d5;color:#276749">交互表单</span>':'')+'</div>'+
        '<div class="li-row"><b>目的：</b>'+escapeHtml(s.purpose)+' · <b>适用：</b>'+escapeHtml(s.audience)+'</div>'+
        '<div class="li-row"><b>评分方法：</b>'+escapeHtml(s.scoring)+'</div>'+
        '<div class="li-row"><b>得分解读：</b>'+escapeHtml(s.interpretation)+'</div>'+
        (s.notes?'<div class="li-row" style="color:#888"><b>备注：</b>'+escapeHtml(s.notes)+'</div>':'')+
        '</div>';
    });
    libRefHtml+='</div></div>';
  });

  app.innerHTML='<div class="page no-print">'+
    '<div class="page-header"><h2>量表评估</h2><p>'+escapeHtml(p.name)+'</p></div>'+
    '<div class="card"><div class="card-title">分类筛选</div><div class="chip-row">'+chipsHtml+'</div></div>'+
    '<div class="card"><div class="card-title">量表填写（专属交互表单）</div>'+formsHtml+'</div>'+
    '<div class="card"><div class="card-title">快速评分记录（量表库任选'+SCALE_LIBRARY.length+'个量表）</div>'+
      '<div class="form-group"><label>选择量表</label><select id="qr_scale"><option value="">请选择量表…</option>'+quickScaleOpts+'</select></div>'+
      '<div id="qr_info" class="lib-info" style="display:none"></div>'+
      '<div class="form-group"><label>得分/结果</label><input id="qr_score" placeholder="如：7 / 65% / I期 / 阳性"></div>'+
      '<div class="form-group"><label>结论（可留空，自动参考解读）</label><input id="qr_concl" placeholder="如：中度疼痛"></div>'+
      '<button class="btn" id="qr_save">💾 保存评分记录</button>'+
    '</div>'+
    '<div class="card"><div class="card-title">历史评估记录</div>'+histHtml+'</div>'+
    '<div class="card"><div class="card-title">量表库参考（'+SCALE_LIBRARY.length+'个标准化量表 · 按文档12大分类）</div>'+libRefHtml+'</div>'+
    '<div class="card"><div class="card-title">自定义量表 <button class="btn-mini" id="cs_add">+ 新建</button></div>'+
      '<div class="form-group"><label>量表名称</label><input id="cs_name" placeholder="量表名称"></div>'+
      '<div class="form-group"><label>分类</label><input id="cs_cat" placeholder="如：平衡评估" value="自定义"></div>'+
      '<div class="form-group"><label>问题列表（每行一题，可加“:分值”如：站立平衡:3）</label><textarea id="cs_qs" placeholder="站立平衡:3&#10;坐位平衡:2"></textarea></div>'+
    '</div>'+
    '<button class="btn btn-ghost" data-go="/patient/'+id+'" style="margin-top:8px">返回患者详情</button>'+
    '</div>';

  // category filter
  document.querySelectorAll('.chip[data-cat]').forEach(function(el){
    el.onclick=function(){
      document.querySelectorAll('.chip[data-cat]').forEach(function(c){c.classList.remove('on')});
      el.classList.add('on');
      var cat=el.getAttribute('data-cat');
      document.querySelectorAll('.scale-card').forEach(function(sc){
        var scat=sc.getAttribute('data-cat');
        sc.style.display=(cat==='全部'||scat===cat)?'':'none';
      });
    };
  });

  // 快速评分记录：选择量表后展示其评分方法与解读参考
  var qrScale=document.getElementById('qr_scale');
  var qrInfo=document.getElementById('qr_info');
  function showQrInfo(s){
    if(!s){qrInfo.style.display='none';return}
    qrInfo.style.display='block';
    qrInfo.innerHTML='<div class="li-row"><b>目的：</b>'+escapeHtml(s.purpose)+' · <b>适用：</b>'+escapeHtml(s.audience)+'</div>'+
      '<div class="li-row"><b>评分方法：</b>'+escapeHtml(s.scoring)+'</div>'+
      '<div class="li-row"><b>得分范围：</b>'+escapeHtml(s.scoreRange)+'</div>'+
      '<div class="li-row"><b>解读参考：</b>'+escapeHtml(s.interpretation)+'</div>'+
      (s.notes?'<div class="li-row" style="color:#888"><b>备注：</b>'+escapeHtml(s.notes)+'</div>':'');
  }
  if(qrScale){
    qrScale.onchange=function(){
      var key=qrScale.value;
      var s=SCALE_LIBRARY.filter(function(x){return x.key===key})[0];
      showQrInfo(s||null);
    };
    document.getElementById('qr_save').onclick=function(){
      var key=qrScale.value;
      if(!key){toast('请先选择量表');return}
      var s=SCALE_LIBRARY.filter(function(x){return x.key===key})[0];
      var score=document.getElementById('qr_score').value.trim();
      if(!score){toast('请输入得分/结果');return}
      var concl=document.getElementById('qr_concl').value.trim();
      if(!concl){concl='参考解读：'+s.interpretation}
      if(!addScaleRecord(id,{scaleType:key,score:score,conclusion:concl,data:{score:score,scaleKey:key},date:Date.now()})){toast('⚠️ 保存失败：存储空间不足');return}
      toast(s.fullName+' 已保存');route('/scales/'+id);
    };
    wrapSave('qr_save');
  }

  // 量表库参考：分类折叠/展开
  document.querySelectorAll('.lib-cat-hd').forEach(function(hd){
    hd.onclick=function(){
      var bd=hd.nextElementSibling;
      var arrow=hd.querySelector('.arrow');
      if(bd.style.display==='none'){bd.style.display='';arrow.textContent='▾'}
      else{bd.style.display='none';arrow.textContent='▸'}
    };
  });

  // VAS
  var vas=document.getElementById('sl_vas');
  vas.oninput=function(){
    document.getElementById('sl_vas_v').textContent=this.value;
    document.getElementById('sl_vas_c').textContent=SCALE_DEFINITIONS.VAS.conclusion(+this.value);
  };
  document.getElementById('sl_vas_save').onclick=function(){
    var s=+vas.value;
    if(!addScaleRecord(id,{scaleType:'VAS',score:s,conclusion:SCALE_DEFINITIONS.VAS.conclusion(s),data:{score:s},date:Date.now()})){toast('⚠️ 保存失败：存储空间不足');return}
    toast('VAS已保存');route('/scales/'+id);
  };
  wrapSave('sl_vas_save');

  // NRS
  var nrsVal=0;
  document.querySelectorAll('#nrs_group .pill').forEach(function(el){
    el.onclick=function(){
      document.querySelectorAll('#nrs_group .pill').forEach(function(c){c.classList.remove('on')});
      el.classList.add('on');
      nrsVal=+el.getAttribute('data-nrs');
      document.getElementById('sl_nrs_c').textContent=SCALE_DEFINITIONS.NRS.conclusion(nrsVal);
    };
  });
  document.getElementById('sl_nrs_save').onclick=function(){
    if(!addScaleRecord(id,{scaleType:'NRS',score:nrsVal,conclusion:SCALE_DEFINITIONS.NRS.conclusion(nrsVal),data:{score:nrsVal},date:Date.now()})){toast('⚠️ 保存失败：存储空间不足');return}
    toast('NRS已保存');route('/scales/'+id);
  };
  wrapSave('sl_nrs_save');

  // MPQ
  var sensItems=['跳痛','刺痛','灼痛','酸痛','胀痛'];
  var affItems=['疲倦','恶心','害怕','刺穿痛'];
  var mpqSens=[0,0,0,0,0],mpqAff=[0,0,0,0],mpqEval=1;
  function renderMpqSensory(){
    var html='';
    sensItems.forEach(function(it,idx){
      var opts='';
      for(var g=0;g<=3;g++){opts+='<label class="pill'+(mpqSens[idx]===g?' on':'')+'" data-mpq-s="'+idx+'" data-v="'+g+'">'+g+'</label>'}
      html+='<div class="sub-section"><div class="ss-title" style="margin-bottom:4px">'+it+'</div><div class="pill-group">'+opts+'</div></div>';
    });
    document.getElementById('mpq_sensory').innerHTML=html;
    document.querySelectorAll('[data-mpq-s]').forEach(function(el){
      el.onclick=function(){
        mpqSens[+el.getAttribute('data-mpq-s')]=+el.getAttribute('data-v');
        renderMpqSensory();calcMpq();
      };
    });
  }
  function renderMpqAffective(){
    var html='';
    affItems.forEach(function(it,idx){
      var opts='';
      for(var g=0;g<=3;g++){opts+='<label class="pill'+(mpqAff[idx]===g?' on':'')+'" data-mpq-a="'+idx+'" data-v="'+g+'">'+g+'</label>'}
      html+='<div class="sub-section"><div class="ss-title" style="margin-bottom:4px">'+it+'</div><div class="pill-group">'+opts+'</div></div>';
    });
    document.getElementById('mpq_affective').innerHTML=html;
    document.querySelectorAll('[data-mpq-a]').forEach(function(el){
      el.onclick=function(){
        mpqAff[+el.getAttribute('data-mpq-a')]=+el.getAttribute('data-v');
        renderMpqAffective();calcMpq();
      };
    });
  }
  var evalOpts=[{l:'持续',v:1},{l:'阵发',v:2},{l:'短暂',v:3}];
  document.getElementById('mpq_eval').innerHTML=evalOpts.map(function(o){return '<label class="pill on" data-mpq-e="'+o.v+'">'+o.l+'</label>'}).join('');
  document.querySelectorAll('[data-mpq-e]').forEach(function(el){
    el.onclick=function(){
      document.querySelectorAll('[data-mpq-e]').forEach(function(c){c.classList.remove('on')});
      el.classList.add('on');
      mpqEval=+el.getAttribute('data-mpq-e');calcMpq();
    };
  });
  function calcMpq(){
    var data={sensory:mpqSens,affective:mpqAff,eval:mpqEval};
    document.getElementById('sl_mpq_c').textContent=SCALE_DEFINITIONS.MPQ.conclusion(data);
  }
  renderMpqSensory();renderMpqAffective();calcMpq();
  document.getElementById('sl_mpq_save').onclick=function(){
    var data={sensory:mpqSens,affective:mpqAff,eval:mpqEval};
    var total=mpqSens.reduce(function(a,b){return a+b},0)+mpqAff.reduce(function(a,b){return a+b},0);
    if(!addScaleRecord(id,{scaleType:'MPQ',score:total,conclusion:SCALE_DEFINITIONS.MPQ.conclusion(data),data:data,date:Date.now()})){toast('⚠️ 保存失败：存储空间不足');return}
    toast('MPQ已保存');route('/scales/'+id);
  };
  wrapSave('sl_mpq_save');

  // Barthel
  var barthelData={};
  function renderBarthel(){
    var html='';
    BARTHEL_ITEMS.forEach(function(it){
      var opts=it.opts.map(function(o){return '<label class="pill'+(barthelData[it.name]===o.v?' on':'')+'" data-bar="'+it.name+'" data-v="'+o.v+'">'+o.l+'('+o.v+')</label>'}).join('');
      html+='<div class="sub-section"><div class="ss-title" style="margin-bottom:4px">'+it.name+'</div><div class="pill-group">'+opts+'</div></div>';
    });
    document.getElementById('barthel_list').innerHTML=html;
    document.querySelectorAll('[data-bar]').forEach(function(el){
      el.onclick=function(){
        barthelData[el.getAttribute('data-bar')]=+el.getAttribute('data-v');
        renderBarthel();calcBar();
      };
    });
  }
  function calcBar(){
    var total=0;
    Object.keys(barthelData).forEach(function(k){total+=barthelData[k]});
    document.getElementById('sl_bar_c').textContent='总分：'+total+' / 100 - '+SCALE_DEFINITIONS.Barthel.conclusion(total);
  }
  renderBarthel();calcBar();
  document.getElementById('sl_bar_save').onclick=function(){
    var total=0;Object.keys(barthelData).forEach(function(k){total+=barthelData[k]});
    if(!addScaleRecord(id,{scaleType:'Barthel',score:total,conclusion:SCALE_DEFINITIONS.Barthel.conclusion(total),data:barthelData,date:Date.now()})){toast('⚠️ 保存失败：存储空间不足');return}
    toast('Barthel已保存');route('/scales/'+id);
  };
  wrapSave('sl_bar_save');

  // Walk6Min
  var walk=document.getElementById('sl_walk');
  walk.oninput=function(){
    var v=+this.value;
    document.getElementById('sl_walk_c').textContent=isNaN(v)||v===0?'请输入距离':SCALE_DEFINITIONS.Walk6Min.conclusion(v);
  };
  document.getElementById('sl_walk_save').onclick=function(){
    var v=+walk.value;
    if(!v){toast('请输入距离');return}
    if(!addScaleRecord(id,{scaleType:'Walk6Min',score:v,conclusion:SCALE_DEFINITIONS.Walk6Min.conclusion(v),data:{distance:v},date:Date.now()})){toast('⚠️ 保存失败：存储空间不足');return}
    toast('6分钟步行已保存');route('/scales/'+id);
  };
  wrapSave('sl_walk_save');

  // custom scales
  customScales.forEach(function(cs){
    var csData={};
    var wrap=document.getElementById('cs_'+cs.id);
    if(wrap){
      var html='';
      cs.questions.forEach(function(q,idx){
        var opts='';
        for(var g=0;g<=q.maxScore;g++){opts+='<label class="pill'+(g===0?' on':'')+'" data-cs="'+cs.id+'" data-q="'+idx+'" data-v="'+g+'">'+g+'</label>'}
        html+='<div class="sub-section"><div class="ss-title" style="margin-bottom:4px">'+escapeHtml(q.text)+' (0-'+q.maxScore+')</div><div class="pill-group">'+opts+'</div></div>';
        csData[idx]=0;
      });
      wrap.innerHTML=html;
      wrap.querySelectorAll('[data-cs]').forEach(function(el){
        el.onclick=function(){
          var q=+el.getAttribute('data-q');
          wrap.querySelectorAll('[data-cs][data-q="'+q+'"]').forEach(function(c){c.classList.remove('on')});
          el.classList.add('on');
          csData[q]=+el.getAttribute('data-v');
          var total=0;Object.keys(csData).forEach(function(k){total+=csData[k]});
          document.getElementById('cs_c_'+cs.id).textContent='总分：'+total+' / '+cs.maxTotal;
        };
      });
    }
    var saveBtn=document.querySelector('[data-cs-save="'+cs.id+'"]');
    if(saveBtn)saveBtn.onclick=function(){
      var total=0;Object.keys(csData).forEach(function(k){total+=csData[k]});
      if(!addScaleRecord(id,{scaleType:'custom_'+cs.id,score:total,conclusion:cs.name+' 总分 '+total+'/'+cs.maxTotal,data:csData,date:Date.now()})){toast('⚠️ 保存失败：存储空间不足');return}
      toast('已保存');route('/scales/'+id);
    };
    if(saveBtn)wrapSaveEl(saveBtn);
  });

  // add custom scale
  document.getElementById('cs_add').onclick=function(){
    var nm=document.getElementById('cs_name').value.trim();
    var ct=document.getElementById('cs_cat').value.trim()||'自定义';
    var qs=document.getElementById('cs_qs').value.trim().split('\n').filter(Boolean);
    if(!nm||qs.length===0){toast('请填写名称和问题');return}
    var questions=qs.map(function(line){
      var parts=line.split(':');
      var text=parts[0].trim();
      var max=parts[1]?parseInt(parts[1],10):3;
      if(isNaN(max)||max<1)max=3;
      return {text:text,maxScore:max};
    });
    var maxTotal=questions.reduce(function(a,b){return a+b.maxScore},0);
    var arr=getCustomScales();
    arr.push({id:uid(),name:nm,category:ct,questions:questions,maxTotal:maxTotal});
    if(!setCustomScales(arr)){toast('⚠️ 保存失败：存储空间不足');return}
    toast('自定义量表已创建');
    route('/scales/'+id);
  };

  // history click - show trend
  document.querySelectorAll('[data-hid]').forEach(function(el){
    el.onclick=function(){
      var date=+el.getAttribute('data-hid');
      var rec=getScaleList(id).filter(function(h){return h.date===date})[0];
      if(rec){
        // find all same scaleType records for trend
        var sameType=getScaleList(id).filter(function(h){return h.scaleType===rec.scaleType}).sort(function(a,b){return a.date-b.date});
        var sd=SCALE_DEFINITIONS[rec.scaleType];
        var libItem=SCALE_LIBRARY.filter(function(x){return x.key===rec.scaleType})[0];
        var sname=sd?sd.name:(libItem?libItem.fullName:rec.scaleType);
        var trendHtml=sameType.map(function(s){return fmtDate(s.date)+': '+s.score+'分'}).join(' → ');
        toast(sname+' 趋势：'+trendHtml);
      }
    };
  });
};

/* ==================== Task 5: Plan Module ==================== */
routes['/plan']=function(){renderPatientPicker('康复方案','选择患者查看/编辑康复方案',function(pid){go('/plan/'+pid)})};

routes['/plan/:id']=function(id){
  var p=getPatient(id);
  if(!p){app.innerHTML='<div class="page"><div class="empty"><div class="ei">❓</div>患者不存在</div><button class="btn" data-go="/patients">返回</button></div>';return}
  var existing=getPlan(id)||{};
  // ensure stages exist
  ['acute','subacute','chronic'].forEach(function(k){if(!existing[k])existing[k]={goal:'',freq:'',items:[],notes:''}});

  function renderStage(stage){
    var st=existing[stage];
    var itemsHtml='';
    st.items.forEach(function(it,idx){
      var metaParts=[];
      if(it.params)metaParts.push('参数：'+it.params);
      if(it.freq)metaParts.push('频次：'+it.freq);
      if(it.duration)metaParts.push(it.duration+'分钟');
      if(it.sets)metaParts.push(it.sets+'组');
      if(it.reps)metaParts.push(it.reps+'次');
      if(it.load)metaParts.push('负荷：'+it.load);
      if(it.part)metaParts.push('部位：'+it.part);
      var dy=findDYPrice(it.name);
      var descHtml='';
      if(dy&&dy.desc){
        descHtml='<div class="ti-desc"><b>项目内涵：</b>'+escapeHtml(dy.desc)+'</div>';
      }
      itemsHtml+='<div class="treat-item"><div class="di-hd"><span class="ti-name">'+escapeHtml(it.name)+' <span class="tag">'+escapeHtml(it.category)+'</span></span><span class="di-rm" data-rm-item="'+stage+'_'+idx+'">删除</span></div>'+
        '<div class="ti-meta">'+escapeHtml(metaParts.join(' · '))+'</div>'+
        descHtml+
        '</div>';
    });
    return itemsHtml;
  }

  var stagesHtml='';
  PLAN_STAGES.forEach(function(ps){
    var st=existing[ps.key];
    var freqOpts=TREAT_FREQ.map(function(f){return '<option value="'+f+'"'+(st.freq===f?' selected':'')+'>'+f+'</option>'}).join('');
    stagesHtml+='<div class="plan-stage '+ps.cls+'"><div class="ps-title">'+ps.name+'</div>'+
      '<div class="form-group"><label>治疗目标</label><textarea data-plan-goal="'+ps.key+'" placeholder="本阶段治疗目标">'+escapeHtml(st.goal)+'</textarea></div>'+
      '<div class="form-group"><label>治疗频率</label><select data-plan-freq="'+ps.key+'"><option value="">请选择</option>'+freqOpts+'<option value="自定义"'+(st.freq==='自定义'?' selected':'')+'>自定义</option></select>'+
        '<input data-plan-freqc="'+ps.key+'" value="'+escapeHtml(st.freqCustom||'')+'" placeholder="自定义频率" style="margin-top:6px"></div>'+
      '<div><label style="font-size:13px;color:#555;display:block;margin-bottom:6px">治疗项目</label><div id="items_'+ps.key+'">'+renderStage(ps.key)+'</div></div>'+
      '<div class="form-group" style="margin-top:8px"><label>添加治疗项目</label>'+
        '<select id="addcat_'+ps.key+'">'+getDYCategories().map(function(c){return '<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>'}).join('')+'</select>'+
        '<select id="additem_'+ps.key+'" style="margin-top:6px"></select>'+
        '<div class="form-group" style="margin-top:6px"><label>参数/详情</label><input id="addparams_'+ps.key+'" placeholder="如：参数/组数/次数/时长/部位/负荷"></div>'+
        '<button class="btn btn-ghost" id="addbtn_'+ps.key+'" style="margin-top:6px">+ 添加到本阶段</button>'+
        '<button class="btn-mini" id="copybtn_'+ps.key+'" style="margin-top:6px;width:100%">📋 复制到其他阶段</button>'+
      '</div>'+
      '<div class="form-group"><label>注意事项</label><textarea data-plan-notes="'+ps.key+'" placeholder="注意事项">'+escapeHtml(st.notes)+'</textarea></div>'+
      '</div>';
  });

  app.innerHTML='<div class="page no-print">'+
    '<div class="page-header"><h2>康复方案</h2><p>'+escapeHtml(p.name)+'</p></div>'+
    '<button class="btn btn-ghost" id="plan_recommend" style="margin-bottom:12px">🤖 根据评估推荐方案</button>'+
    stagesHtml+
    '<button class="btn" id="plan_save">💾 保存方案</button>'+
    '<div style="display:flex;gap:8px;margin-top:8px">'+
    '<button class="btn btn-ghost" id="plan_share" style="flex:1">📤 分享方案</button>'+
    '<button class="btn btn-ghost" data-go="/patient/'+id+'" style="flex:1">返回患者详情</button>'+
    '</div>'+
    '</div>';

  // populate item options based on category
  PLAN_STAGES.forEach(function(ps){
    var catSel=document.getElementById('addcat_'+ps.key);
    var itemSel=document.getElementById('additem_'+ps.key);
    var paramsInput=document.getElementById('addparams_'+ps.key);
    function refreshItems(){
      var cat=catSel.value;
      var items=getDYItemsByCategory(cat);
      itemSel.innerHTML=items.map(function(it){return '<option value="'+escapeHtml(it.name)+'" data-unit="'+escapeHtml(it.unit||'')+'">'+escapeHtml(it.name)+(it.unit?'（'+escapeHtml(it.unit)+'）':'')+'</option>'}).join('');
      updateParamsPlaceholder();
    }
    function updateParamsPlaceholder(){
      var opt=itemSel.options[itemSel.selectedIndex];
      var unit=opt?opt.getAttribute('data-unit'):'';
      if(unit){
        paramsInput.placeholder='单位：'+unit+'，如：参数/组数/次数/时长/部位/负荷';
      }else{
        paramsInput.placeholder='如：参数/组数/次数/时长/部位/负荷';
      }
    }
    refreshItems();
    catSel.onchange=refreshItems;
    itemSel.onchange=updateParamsPlaceholder;

    document.getElementById('addbtn_'+ps.key).onclick=function(){
      var name=itemSel.value;
      var cat=catSel.value;
      var params=paramsInput.value.trim();
      existing[ps.key].items.push({name:name,category:cat,params:params});
      paramsInput.value='';
      document.getElementById('items_'+ps.key).innerHTML=renderStage(ps.key);
      bindItemRm();
    };

    document.getElementById('copybtn_'+ps.key).onclick=function(){
      var others=PLAN_STAGES.filter(function(s){return s.key!==ps.key}).map(function(s){return s.key+'|'+s.name}).join(',');
      // simple: copy to next stage
      var idx=PLAN_STAGES.findIndex(function(s){return s.key===ps.key});
      var target=PLAN_STAGES[(idx+1)%PLAN_STAGES.length].key;
      existing[target].items=existing[target].items.concat(JSON.parse(JSON.stringify(existing[ps.key].items)));
      document.getElementById('items_'+target).innerHTML=renderStage(target);
      bindItemRm();
      toast('已复制到：'+PLAN_STAGES[(idx+1)%PLAN_STAGES.length].name);
    };

    // save stage fields on input
    document.querySelector('[data-plan-goal="'+ps.key+'"]').oninput=function(){existing[ps.key].goal=this.value};
    document.querySelector('[data-plan-freq="'+ps.key+'"]').onchange=function(){existing[ps.key].freq=this.value};
    document.querySelector('[data-plan-freqc="'+ps.key+'"]').oninput=function(){existing[ps.key].freqCustom=this.value};
    document.querySelector('[data-plan-notes="'+ps.key+'"]').oninput=function(){existing[ps.key].notes=this.value};
  });

  function bindItemRm(){
    document.querySelectorAll('[data-rm-item]').forEach(function(el){
      el.onclick=function(){
        var parts=el.getAttribute('data-rm-item').split('_');
        var stage=parts[0],idx=+parts[1];
        existing[stage].items.splice(idx,1);
        document.getElementById('items_'+stage).innerHTML=renderStage(stage);
        bindItemRm();
      };
    });
  }
  bindItemRm();

  // recommend
  document.getElementById('plan_recommend').onclick=function(){
    var asm=getAssessment(id);
    var sl=getScaleList(id);
    // get latest pain score
    var painScores=sl.filter(function(s){return s.scaleType==='VAS'||s.scaleType==='NRS'}).sort(function(a,b){return b.date-a.date});
    var maxPain=painScores.length>0?painScores[0].score:0;
    // get min muscle grade
    var minGrade=5;
    if(asm&&asm.muscle){asm.muscle.forEach(function(m){if(m.grade<minGrade)minGrade=m.grade})}
    // acute: pain>7 -> physical factors
    if(maxPain>7){
      existing.acute.goal='控制疼痛、减轻炎症';
      var dyTens=findDYPrice('电疗');
      existing.acute.items.push({name:dyTens?dyTens.name:'运动功能训练',category:dyTens?dyTens.category:'康复训练',params:'镇痛模式'});
    }
    if(minGrade<3){
      existing.subacute.goal='增强肌力';
      var dyMuscle=findDYPrice('运动功能训练');
      existing.subacute.items.push({name:dyMuscle?dyMuscle.name:'运动功能训练',category:dyMuscle?dyMuscle.category:'康复训练',params:'低负荷 '+minGrade+'级肌力训练'});
    }
    if(existing.chronic.items.length===0){
      existing.chronic.goal='功能恢复与巩固';
      var dyCore=findDYPrice('运动功能训练');
      existing.chronic.items.push({name:dyCore?dyCore.name:'运动功能训练',category:dyCore?dyCore.category:'康复训练',params:'循序渐进'});
    }
    PLAN_STAGES.forEach(function(ps){document.getElementById('items_'+ps.key).innerHTML=renderStage(ps.key)});
    bindItemRm();
    toast('已根据评估推荐方案（疼痛'+maxPain+'分/最低肌力'+minGrade+'级）');
  };

  // save
  document.getElementById('plan_save').onclick=function(){
    if(!setPlan(id,existing)){toast('⚠️ 保存失败：存储空间不足');return}
    toast('方案已保存');
  };
  wrapSave('plan_save');

  // share plan
  document.getElementById('plan_share').onclick=function(){
    var t=getTherapist();
    var text='【康复方案分享】\n患者：'+(p.name||'-')+'　'+(p.gender||'')+'　'+(p.age||'')+'岁\n';
    if(p.diagnosis)text+='诊断：'+p.diagnosis+'\n';
    text+='治疗师：'+(t.name||'-')+'　'+(t.department||'')+'\n';
    text+='生成时间：'+fmtTime(Date.now())+'\n';
    text+='─────────────\n';
    PLAN_STAGES.forEach(function(ps){
      var st=existing[ps.key];
      if(!st)return;
      text+='\n【'+ps.name+'】\n';
      if(st.goal)text+='目标：'+st.goal+'\n';
      if(st.freq)text+='频率：'+st.freq+'\n';
      if(st.items&&st.items.length){
        text+='治疗项目：\n';
        st.items.forEach(function(it,idx){
          var line='  '+(idx+1)+'. '+it.name+'（'+it.category+'）';
          var meta=[];
          if(it.params)meta.push(it.params);
          if(meta.length)line+=' ['+meta.join('，')+']';
          text+=line+'\n';
        });
      }
      if(st.notes)text+='注意事项：'+st.notes+'\n';
    });
    text+='─────────────\n（由康复评估系统生成）';
    showShareModal('康复方案分享',text,'plan_'+id);
  };
};

/* ==================== Task 6: Report Module ==================== */
routes['/report']=function(){renderPatientPicker('评估报告','选择患者生成/查看报告',function(pid){go('/report/'+pid)})};

routes['/report/:id']=function(id){
  var p=getPatient(id);
  if(!p){app.innerHTML='<div class="page"><div class="empty"><div class="ei">❓</div>患者不存在</div><button class="btn" data-go="/patients">返回</button></div>';return}
  var asm=getAssessment(id);
  var exams=getSpecialExamList(id);
  var scales=getScaleList(id);
  var plan=getPlan(id);

  // 1. basic info
  var s1='<div class="report-section"><h3>一、患者基本信息</h3>'+
    '<div class="r-row"><div class="rk">姓名</div><div class="rv">'+escapeHtml(p.name)+'</div></div>'+
    '<div class="r-row"><div class="rk">性别</div><div class="rv">'+escapeHtml(p.gender||'-')+'</div></div>'+
    '<div class="r-row"><div class="rk">年龄</div><div class="rv">'+escapeHtml(p.age||'-')+'</div></div>'+
    '<div class="r-row"><div class="rk">诊断</div><div class="rv">'+escapeHtml(p.diagnosis||'-')+'</div></div>'+
    '<div class="r-row"><div class="rk">患者ID</div><div class="rv" style="font-family:monospace">'+escapeHtml(p.patientId||p.id)+'</div></div>'+
    '</div>';

  // 2. chief complaint
  var cc=asm&&asm.chiefComplaint?asm.chiefComplaint:{};
  var s2='<div class="report-section"><h3>二、主诉</h3>'+
    '<div class="r-row"><div class="rk">主要症状</div><div class="rv">'+escapeHtml(cc.symptoms||'-')+'</div></div>'+
    '<div class="r-row"><div class="rk">发病时间</div><div class="rv">'+escapeHtml(cc.onset||'-')+'</div></div>'+
    '<div class="r-row"><div class="rk">诱因</div><div class="rv">'+escapeHtml(cc.triggers||'-')+'</div></div>'+
    '<div class="r-row"><div class="rk">既往史</div><div class="rv">'+escapeHtml(cc.history||'-')+'</div></div>'+
    '</div>';

  // 3. objective assessment
  var pal=asm&&asm.palpation?asm.palpation:{};
  var rom=asm&&asm.rom?asm.rom:[];
  var muscle=asm&&asm.muscle?asm.muscle:[];
  var skin=asm&&asm.skinTemp?asm.skinTemp:{};
  var adl=asm&&asm.adl?asm.adl:{};
  var s3='<div class="report-section"><h3>三、客观评估结果</h3>'+
    '<div class="r-row"><div class="rk">触诊-疼痛部位</div><div class="rv">'+(pal.sites&&pal.sites.length?pal.sites.map(function(s){return '<span class="tag warn">'+escapeHtml(s)+'</span>'}).join(''):'-')+'</div></div>'+
    '<div class="r-row"><div class="rk">压痛程度</div><div class="rv">'+(pal.painLevel||0)+'/10</div></div>'+
    '<div class="r-row"><div class="rk">触诊发现</div><div class="rv">'+escapeHtml(pal.findings||'-')+'</div></div>'+
    '<div class="r-row"><div class="rk">活动度</div><div class="rv">'+(rom.length?rom.map(function(r){return escapeHtml(r.joint)+'(主动:'+escapeHtml(r.active||'-')+',被动:'+escapeHtml(r.passive||'-')+')'}).join('；'):'-')+'</div></div>'+
    '<div class="r-row"><div class="rk">肌力</div><div class="rv">'+(muscle.length?muscle.map(function(m){return escapeHtml(m.group)+':'+(m.grade!=null?m.grade:'?')+'级'}).join('；'):'-')+'</div></div>'+
    '<div class="r-row"><div class="rk">皮温</div><div class="rv">左 '+escapeHtml(skin.left||'-')+'°C / 右 '+escapeHtml(skin.right||'-')+'°C'+(skin.left&&skin.right?' (温差'+Math.abs((+skin.left)-(+skin.right)).toFixed(1)+'°C)':'')+'</div></div>'+
    '<div class="r-row"><div class="rk">ADL</div><div class="rv">'+(function(){
      if(!adl.items)return '-';
      var total=0,count=0;
      ADL_ITEMS.forEach(function(it){if(adl.items[it]!=null){total+=adl.items[it];count++}});
      if(count===0)return '-';
      var pct=Math.round((1-total/(count*2))*100);
      return '总分'+total+'，独立程度'+pct+'%';
    })()+'</div></div>'+
    '</div>';

  // special exams
  var posExams=exams.filter(function(e){return e.result==='positive'});
  var s3b='<div class="r-block"><b>特殊检查：</b>'+(exams.length?exams.filter(function(e){return e.result!=='unchecked'}).map(function(e){var cls=e.result==='positive'?'pos':(e.result==='negative'?'neg':'warn');return escapeHtml(e.examName)+'<span class="tag '+cls+'">'+{positive:'阳性',negative:'阴性',suspect:'可疑'}[e.result]+'</span>'}).join(' '):'未查')+(posExams.length?'<br>阳性项目：'+posExams.map(function(e){return escapeHtml(e.examName)}).join('、'):'')+'</div>';
  s3=s3.replace('</div>',s3b+'</div>');

  // 4. scales
  var s4='<div class="report-section"><h3>四、量表评估结论</h3>';
  if(scales.length===0){s4+='<div class="r-row"><div class="rv">暂无量表评估</div></div>'}
  else{
    // latest of each type
    var latest={};
    scales.forEach(function(s){if(!latest[s.scaleType]||s.date>latest[s.scaleType].date)latest[s.scaleType]=s});
    Object.keys(latest).forEach(function(k){
      var s=latest[k];
      var sd=SCALE_DEFINITIONS[s.scaleType];
      var libItem=SCALE_LIBRARY.filter(function(x){return x.key===s.scaleType})[0];
      var sname=sd?sd.name:(libItem?libItem.fullName:s.scaleType);
      s4+='<div class="r-row"><div class="rk">'+escapeHtml(sname)+'</div><div class="rv">得分：<b>'+escapeHtml(s.score)+'</b> · '+escapeHtml(s.conclusion)+'</div></div>';
    });
  }
  s4+='</div>';

  // 5. plan
  var s5='<div class="report-section"><h3>五、康复方案</h3>';
  if(!plan||(!plan.acute&&!plan.subacute&&!plan.chronic)){s5+='<div class="r-row"><div class="rv">暂未制定康复方案</div></div>'}
  else{
    PLAN_STAGES.forEach(function(ps){
      var st=plan[ps.key];
      if(!st)return;
      s5+='<div class="r-block"><b>'+ps.name+'</b>';
      if(st.goal)s5+='<br>目标：'+escapeHtml(st.goal);
      if(st.freq)s5+='<br>频率：'+escapeHtml(st.freq)+(st.freqCustom?'('+escapeHtml(st.freqCustom)+')':'');
      if(st.items&&st.items.length)s5+='<br>项目：'+st.items.map(function(it){return escapeHtml(it.name)+(it.params?'('+escapeHtml(it.params)+')':'')}).join('、');
      if(st.notes)s5+='<br>注意：'+escapeHtml(st.notes);
      s5+='</div>';
    });
  }
  s5+='</div>';

  // 5.5 治疗项目内涵汇总
  var s55='<div class="report-section"><h3>六、治疗项目内涵汇总</h3>';
  var descRows=[];
  if(plan){
    PLAN_STAGES.forEach(function(ps){
      var st=plan[ps.key];
      if(st&&st.items&&st.items.length){
        st.items.forEach(function(it){
          var dy=findDYPrice(it.name);
          if(dy&&dy.desc){
            descRows.push({name:it.name,desc:dy.desc,unit:dy.unit,stage:ps.name,category:dy.category});
          }
        });
      }
    });
  }
  if(descRows.length===0){
    s55+='<div class="r-row"><div class="rv">方案中暂无可匹配内涵说明的项目</div></div>';
  }else{
    s55+='<table class="r-summary-table"><thead><tr><th>项目名</th><th>内涵说明</th><th>阶段</th></tr></thead><tbody>';
    descRows.forEach(function(r){
      s55+='<tr><td style="text-align:left;white-space:nowrap">'+escapeHtml(r.name)+(r.unit?'<br><span style="font-size:11px;color:#999">'+escapeHtml(r.unit)+'</span>':'')+'</td><td style="text-align:left;font-size:12px;line-height:1.5">'+escapeHtml(r.desc)+'</td><td>'+escapeHtml(r.stage)+'</td></tr>';
    });
    s55+='</tbody></table>';
  }
  s55+='</div>';

  // 6. notes
  var s6='<div class="report-section"><h3>七、注意事项</h3>'+
    '<div class="r-block">1. 本报告基于当前评估数据生成，仅供康复治疗参考。<br>2. 治疗过程中如出现不适，请及时告知治疗师。<br>3. 建议定期复评，动态调整康复方案。<br>4. 项目内涵说明可在系统设置页中查阅完整内容。<br>5. 报告生成时间：'+fmtTime(Date.now())+'</div>'+
    '</div>';

  var t=getTherapist();
  app.innerHTML='<div class="page">'+
    '<div class="page-header no-print"><h2>康复评估报告</h2><p>'+escapeHtml(p.name)+'</p></div>'+
    '<div class="no-print" style="display:flex;gap:8px;margin-bottom:12px">'+
    '<button class="btn" id="rp_print" style="flex:1">🖨 导出PDF</button>'+
    '<button class="btn btn-ghost" id="rp_view" style="flex:1">👁 在线预览</button>'+
    '<button class="btn btn-ghost" id="rp_share" style="flex:1">📤 分享</button>'+
    '</div>'+
    '<div class="no-print" style="display:flex;gap:8px;margin-bottom:12px">'+
      '<button class="btn btn-ghost" data-go="/assessment/'+id+'" style="flex:1">修改评估</button>'+
      '<button class="btn btn-ghost" data-go="/plan/'+id+'" style="flex:1">修改方案</button>'+
    '</div>'+
    '<button class="btn btn-ghost no-print" data-go="/patient/'+id+'" style="margin-bottom:12px">返回患者详情</button>'+
    '<div class="report-page" id="rp_content">'+
      '<div class="report-title">康复评估报告</div>'+
      '<div class="report-sub">患者：'+escapeHtml(p.name)+'　|　生成日期：'+fmtDate(Date.now())+'　|　治疗师：'+escapeHtml(t.name||'-')+'</div>'+
      s1+s2+s3+s4+s5+s55+s6+
    '</div></div>';

  document.getElementById('rp_print').onclick=function(){window.print()};
  document.getElementById('rp_view').onclick=function(){
    var content=document.getElementById('rp_content');
    if(content.style.maxHeight==='none'){content.style.maxHeight='none';toast('已展开完整报告')}
    else{content.style.maxHeight='none';content.scrollIntoView({behavior:'smooth'})}
    toast('完整报告已展示');
  };
  // share report
  document.getElementById('rp_share').onclick=function(){
    var text='【康复评估报告】\n';
    text+='患者：'+(p.name||'-')+'　'+(p.gender||'')+'　'+(p.age||'')+'岁\n';
    if(p.patientId)text+='患者ID：'+p.patientId+'\n';
    if(p.diagnosis)text+='诊断：'+p.diagnosis+'\n';
    text+='治疗师：'+(t.name||'-')+'　'+(t.department||'')+'\n';
    text+='报告时间：'+fmtTime(Date.now())+'\n';
    text+='═══════════════\n';
    // 主诉
    var cc=asm&&asm.chiefComplaint?asm.chiefComplaint:{};
    if(asm){
      text+='\n【主诉】\n';
      if(cc.symptoms)text+='主要症状：'+cc.symptoms+'\n';
      if(cc.onset)text+='发病时间：'+cc.onset+'\n';
      if(cc.triggers)text+='诱因：'+cc.triggers+'\n';
    }
    // 客观评估
    var pal=asm&&asm.palpation?asm.palpation:{};
    var skinT=asm&&asm.skinTemp?asm.skinTemp:{};
    if(asm){
      text+='\n【客观评估】\n';
      if(pal.sites&&pal.sites.length)text+='触诊疼痛部位：'+pal.sites.join('、')+'\n';
      if(pal.painLevel!=null)text+='压痛程度：'+pal.painLevel+'/10分\n';
      if(asm.rom&&asm.rom.length){text+='活动度：';asm.rom.forEach(function(r){text+=r.joint+'(主'+r.active+'°/被'+r.passive+'°) '});text+='\n'}
      if(asm.muscle&&asm.muscle.length){text+='肌力：';asm.muscle.forEach(function(m){text+=m.group+':'+m.grade+'级 '});text+='\n'}
      if(skinT.left||skinT.right)text+='皮温：左'+(skinT.left||'-')+'℃ 右'+(skinT.right||'-')+'℃\n';
      if(asm.adl&&asm.adl.items){
        var adlTotal=0,adlCount=0;
        ADL_ITEMS.forEach(function(it){if(asm.adl.items[it]!=null){adlTotal+=asm.adl.items[it];adlCount++}});
        if(adlCount>0){var adlPct=Math.round((1-adlTotal/(adlCount*2))*100);text+='ADL总分：'+adlTotal+'分 / 独立程度：'+adlPct+'%\n'}
      }
    }
    // 量表
    if(scales&&scales.length){
      text+='\n【量表评估】\n';
      scales.forEach(function(s){
        var sd=SCALE_DEFINITIONS[s.scaleType];
        var libItem=SCALE_LIBRARY.filter(function(x){return x.key===s.scaleType})[0];
        var snm=sd?sd.name:(libItem?libItem.fullName:(s.scaleType||'量表'));
        text+=snm+': '+s.score+'分（'+(s.conclusion||'')+'）\n';
      });
    }
    // 方案
    if(plan){
      text+='\n【康复方案】\n';
      PLAN_STAGES.forEach(function(ps){
        var st=plan[ps.key];
        if(!st)return;
        text+='\n['+ps.name+']\n';
        if(st.goal)text+='目标：'+st.goal+'\n';
        if(st.freq)text+='频率：'+st.freq+'\n';
        if(st.items&&st.items.length){text+='项目：';st.items.forEach(function(it,idx){text+=(idx+1)+'.'+it.name+' '});text+='\n'}
      });
    }
    text+='\n═══════════════\n（由康复评估系统生成）';
    showShareModal('报告分享',text,'report_'+id);
  };
};

/* ========================= Onboarding ========================= */
function showOnboarding(){
  var mask=document.createElement('div');
  mask.className='modal-mask';
  mask.innerHTML='<div class="modal"><div class="modal-bd"><div class="onboard-welcome"><div class="logo">💊</div><h3>欢迎使用</h3><p style="color:#888;font-size:13px">康复评估系统</p></div>'+
    '<div class="form-group"><label>姓名（可跳过稍后设置）</label><input id="ob_name" placeholder="治疗师姓名"></div>'+
    '<div class="form-group"><label>科室</label><input id="ob_dept" placeholder="如：康复科"></div>'+
    '<div class="form-group"><label>角色/职称（可选）</label><input id="ob_role" placeholder="如：主管治疗师"></div></div>'+
    '<div class="modal-ft"><button class="btn btn-ghost" id="ob_skip">跳过</button><button class="btn" id="ob_ok">开始使用</button></div></div>';
  document.body.appendChild(mask);
  document.getElementById('ob_skip').onclick=function(){LS.set('onboarded',true);mask.remove()};
  document.getElementById('ob_ok').onclick=function(){
    var name=document.getElementById('ob_name').value.trim();
    var dept=document.getElementById('ob_dept').value.trim();
    var role=document.getElementById('ob_role').value.trim();
    if(name){
      // save first profile into therapist_profiles array
      var profiles=getProfiles();
      var np={id:uid(),name:name,department:dept,role:role};
      profiles.push(np);
      if(!setProfiles(profiles)){toast('⚠️ 保存失败：存储空间不足');return}
      setActiveProfileId(np.id);
    }
    LS.set('onboarded',true);
    mask.remove();toast('设置成功');route('/home');
  };
}

/* ========================= WeChat Work JS-SDK preload ========================= */
function detectWxWork(){
  var ua=navigator.userAgent.toLowerCase();
  if(ua.indexOf('wxwork')>=0){
    var s=document.createElement('script');
    s.src='https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    s.onload=function(){console.log('[wxwork] jweixin loaded')};
    s.onerror=function(){console.warn('[wxwork] jweixin load failed, fallback')};
    document.head.appendChild(s);
    console.log('[wxwork] environment detected, preloading JS-SDK');
  }else{
    console.log('[wxwork] not detected, normal browser mode');
  }
}

/* ========================= Audit Log Page ========================= */
routes['/audit']=function(){
  var log=getAuditLog();
  var role=getUserRole();
  var isAdmin=role==='admin';
  var body;
  if(log.length===0){
    body='<div class="empty"><div class="ei">📋</div>暂无操作记录</div>';
  }else{
    body='<div class="patient-select-list" style="max-height:none">';
    log.forEach(function(e){
      var d=new Date(e.t);
      body+='<div class="ps-item" style="padding:8px 10px">'+
        '<div style="display:flex;justify-content:space-between;font-size:12px;color:#888">'+
          '<span>'+escapeHtml(fmtTime(e.t))+'</span>'+
          '<span class="role-badge '+escapeHtml(e.role||'')+'">'+escapeHtml(getRoleName(e.role))+'</span>'+
        '</div>'+
        '<div style="font-weight:600;font-size:13px;margin-top:4px">'+escapeHtml(e.action)+'</div>'+
        '<div style="font-size:12px;color:#666;margin-top:2px">操作人：'+escapeHtml(e.actor)+(e.detail?' · '+escapeHtml(e.detail):'')+'</div>'+
      '</div>';
    });
    body+='</div>';
  }
  app.innerHTML='<div class="page"><div class="page-header"><h2>操作日志</h2><p>共 '+log.length+' 条记录（环形缓冲上限 '+AUDIT_MAX+'）</p></div>'+
    '<div class="card">'+body+'</div>'+
    (isAdmin?'<button class="btn btn-danger" id="audit_clear" style="margin-top:10px">清空审计日志</button>':'')+
    '<div class="card" style="font-size:12px;color:#888;text-align:center"><p>记录范围：删除患者 / 角色切换 / 清空数据 / 数据导入</p><p>审计日志独立于业务数据，清空业务数据不会清除审计记录</p></div>'+
  '</div>';
  var clr=document.getElementById('audit_clear');
  if(clr){
    clr.onclick=function(){
      confirmDialog('确定清空全部审计日志？此操作本身也会被记录',function(){
        clearAuditLog();
        toast('已清空');
        route('/audit');
      });
    };
  }
};

/* ========================= Init ========================= */
function init(){
  // 1. Schema 迁移（在路由之前，确保数据结构一致）
  var mig=ensureSchemaMigrated();
  if(!mig.ok){
    console.error('[init] schema migration failed:',mig.error);
    toast('⚠️ 数据迁移失败，请导出备份后联系开发者');
  }else if(mig.from!==mig.to){
    console.log('[init] schema',mig.from,'→',mig.to);
  }
  // 2. 启动审计（记录一次会话开始，便于追溯）
  try{audit('app.start',{schema:getStoredSchemaVersion(),patients:getPatients().length,records:getRecords().length})}catch(_){}
  detectWxWork();
  renderTabbar('/home');
  if(!LS.get('onboarded')){
    showOnboarding();
  }
  var h=location.hash.slice(1)||'/home';
  route(h);
}
init();
console.log('APP LOADED');