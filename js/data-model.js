// ===== data-model.js auto-generated =====
function getProfiles(){return LS.get('therapist_profiles')||[]}
function setProfiles(p){
  var vr=validateData('therapist_profiles',p);
  if(!vr.ok){console.error('[A-1] setProfiles 校验失败:', vr.errors);if(typeof toast==='function')toast('⚠️ 数据校验失败:'+vr.errors.slice(0,2).join(';'));return false;}
  return LS.set('therapist_profiles',p);
}
function getActiveProfileId(){return LS.get('active_profile_id')||''}
function setActiveProfileId(id){
  var vr=validateData('active_profile_id',id);
  if(!vr.ok){console.error('[A-1] setActiveProfileId 校验失败:', vr.errors);return false;}
  return LS.set('active_profile_id',id);
}
function getActiveProfile(){
  var profiles=getProfiles();
  if(profiles.length===0)return null;
  var aid=getActiveProfileId();
  if(!aid)return profiles[0];
  for(var i=0;i<profiles.length;i++){if(profiles[i].id===aid)return profiles[i]}
  return profiles[0];
}
function getTherapist(){var p=getActiveProfile();return p||{name:'',department:'',role:''}}
function setTherapist(t){
  // 兼容旧代码，保存为第一个profile
  var profiles=getProfiles();
  if(profiles.length===0){
    profiles=[{id:uid(),name:t.name,department:t.department,role:''}];
    if(!setProfiles(profiles))return false;
    return setActiveProfileId(profiles[0].id);
  }else{
    profiles[0].name=t.name;profiles[0].department=t.department;
    return setProfiles(profiles);
  }
}
function getPatients(){return LS.get('patients')||[]}
function setPatients(p){
  var vr=validateData('patients',p);
  if(!vr.ok){console.error('[A-1] setPatients 校验失败:', vr.errors);if(typeof toast==='function')toast('⚠️ 数据校验失败:'+vr.errors.slice(0,2).join(';'));return false;}
  return LS.set('patients',p);
}
function getRecords(){return LS.get('records')||[]}
function setRecords(r){
  var vr=validateData('records',r);
  if(!vr.ok){console.error('[A-1] setRecords 校验失败:', vr.errors);if(typeof toast==='function')toast('⚠️ 数据校验失败:'+vr.errors.slice(0,2).join(';'));return false;}
  return LS.set('records',r);
}
function getRecord(id){var rs=getRecords();for(var i=0;i<rs.length;i++){if(rs[i].id===id)return rs[i]}return null}

var TREATMENT_TYPES=['物理治疗','中医','推拿','康复','针灸','其他'];
var TYPE_ICONS={'物理治疗':'💊','中医':'🌿','推拿':'👐','康复':'🏃','针灸':'📍','其他':'📝'};

/* ==================== New data accessors ==================== */
/* Patient helpers */
function getPatient(id){var arr=getPatients();for(var i=0;i<arr.length;i++){if(arr[i].id===id)return arr[i]}return null}
function genPatientId(){
  var d=new Date();
  var y=d.getFullYear(),m=pad(d.getMonth()+1),day=pad(d.getDate());
  var rand=('0000'+Math.floor(Math.random()*10000)).slice(-4);
  return 'P-'+y+m+day+'-'+rand;
}

/* Assessments: {patientId: {chiefComplaint, palpation, rom, muscle, skinTemp, adl, updatedAt}} */
function getAssessments(){return LS.get('assessments')||{}}
function setAssessments(a){
  var vr=validateData('assessments',a);
  if(!vr.ok){console.error('[A-1] setAssessments 校验失败:', vr.errors);if(typeof toast==='function')toast('⚠️ 数据校验失败:'+vr.errors.slice(0,2).join(';'));return false;}
  return LS.set('assessments',a);
}
function getAssessment(pid){var a=getAssessments();return a[pid]||null}
function setAssessment(pid,data){var a=getAssessments();data.updatedAt=Date.now();a[pid]=data;return setAssessments(a)}

/* Special exams: {patientId: [{examName, category, result, note, date}]} */
function getSpecialExams(){return LS.get('specialExams')||{}}
function setSpecialExams(s){
  var vr=validateData('specialExams',s);
  if(!vr.ok){console.error('[A-1] setSpecialExams 校验失败:', vr.errors);if(typeof toast==='function')toast('⚠️ 数据校验失败:'+vr.errors.slice(0,2).join(';'));return false;}
  return LS.set('specialExams',s);
}
function getSpecialExamList(pid){var s=getSpecialExams();return s[pid]||[]}
function setSpecialExamList(pid,list){var s=getSpecialExams();s[pid]=list;return setSpecialExams(s)}

/* Scales: {patientId: [{scaleType, score, conclusion, data, date}]} */
function getScales(){return LS.get('scales')||{}}
function setScales(s){
  var vr=validateData('scales',s);
  if(!vr.ok){console.error('[A-1] setScales 校验失败:', vr.errors);if(typeof toast==='function')toast('⚠️ 数据校验失败:'+vr.errors.slice(0,2).join(';'));return false;}
  return LS.set('scales',s);
}
function getScaleList(pid){var s=getScales();return s[pid]||[]}
function addScaleRecord(pid,rec){var s=getScales();if(!s[pid])s[pid]=[];s[pid].push(rec);return setScales(s)}
function clearScaleList(pid){var s=getScales();s[pid]=[];return setScales(s)}

/* Plans: {patientId: {acute, subacute, chronic, createdAt, updatedAt}} */
function getPlans(){return LS.get('plans')||{}}
function setPlans(p){
  var vr=validateData('plans',p);
  if(!vr.ok){console.error('[A-1] setPlans 校验失败:', vr.errors);if(typeof toast==='function')toast('⚠️ 数据校验失败:'+vr.errors.slice(0,2).join(';'));return false;}
  return LS.set('plans',p);
}
function getPlan(pid){var p=getPlans();return p[pid]||null}
function setPlan(pid,plan){var p=getPlans();plan.updatedAt=Date.now();if(!plan.createdAt)plan.createdAt=Date.now();p[pid]=plan;return setPlans(p)}

/* Custom exam library & scale library & treatment items */
function getCustomExams(){return LS.get('customExams')||[]}
function setCustomExams(e){return LS.set('customExams',e)}
function getCustomScales(){return LS.get('customScales')||[]}
function setCustomScales(s){return LS.set('customScales',s)}

/* User role: therapist / director / admin */
function getUserRole(){return LS.get('userRole')||'therapist'}
function setUserRole(r){
  var vr=validateData('userRole',r);
  if(!vr.ok){console.error('[A-1] setUserRole 校验失败:', vr.errors);return false;}
  return LS.set('userRole',r);
}
function getRoleName(r){r=r||getUserRole();return {therapist:'治疗师',director:'主任',admin:'管理员'}[r]||'治疗师'}

/* ========================= Audit Log ========================= */
// 环形缓冲，最多 500 条；高危操作必经此入口。
var AUDIT_MAX=500;
function getAuditLog(){return LS.get('auditLog')||[]}
function setAuditLog(a){
  var vr=validateData('auditLog',a);
  if(!vr.ok){console.error('[A-1] setAuditLog 校验失败:', vr.errors);if(typeof toast==='function')toast('⚠️ 数据校验失败:'+vr.errors.slice(0,2).join(';'));return false;}
  return LS.set('auditLog',a);
}
function audit(action,detail){
  try{
    var log=getAuditLog();
    var ap=getActiveProfile();
    log.unshift({
      t:Date.now(),
      actor:ap?(ap.name||'(未命名)'):'(系统)',
      actorId:ap?ap.id:'',
      role:getUserRole(),
      action:String(action||'').slice(0,64),
      detail:typeof detail==='string'?detail.slice(0,512):JSON.stringify(detail).slice(0,512)
    });
    while(log.length>AUDIT_MAX)log.pop();
    setAuditLog(log);
  }catch(e){console.error('[audit] failed:',e)}
}
function clearAuditLog(){setAuditLog([]);audit('audit.clear','审计日志已清空')}

/* ========================= PIN Protection ========================= */
// 简易哈希（非加密强，但避免明文存 PIN）。PIN 仅前端拦截误操作，不可信。
function pinHash(pin){
  var h=simpleHash('pin_salt_9f3a2::'+String(pin));
  return h;
}
function getPinHash(){return LS.get('pinHash')||''}
function isPinSet(){return !!getPinHash()}
function setPin(pin){
  var h=pin?pinHash(pin):'';
  if(!LS.set('pinHash',h))return false;
  return true;
}
function verifyPin(pin){var h=getPinHash();if(!h)return true;return pinHash(pin)===h}

// PIN 输入弹窗。title=提示，cb=通过回调，onCancel=取消回调
function showPinInput(title,cb,onCancel){
  var mask=document.createElement('div');
  mask.className='modal-mask';
  mask.innerHTML='<div class="modal" style="max-width:340px"><div class="modal-hd"><span>'+escapeHtml(title)+'</span><span class="close">&times;</span></div>'+
    '<div class="modal-bd"><input id="pin_input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="请输入 PIN 码" style="width:100%;padding:12px;font-size:18px;text-align:center;letter-spacing:8px;border:1px solid #e2e8f0;border-radius:6px"></div>'+
    '<div class="modal-ft"><button class="btn btn-ghost" id="pin_cancel">取消</button><button class="btn" id="pin_ok">确定</button></div></div>';
  document.body.appendChild(mask);
  var inp=mask.querySelector('#pin_input');
  setTimeout(function(){inp.focus()},50);
  function close(){mask.remove()}
  function ok(){
    var v=inp.value.trim();
    if(!v){toast('请输入 PIN');return}
    if(verifyPin(v)){close();cb();}else{toast('PIN 码错误');inp.value='';inp.focus();}
  }
  mask.querySelector('.close').onclick=function(){close();if(onCancel)onCancel()};
  mask.querySelector('#pin_cancel').onclick=function(){close();if(onCancel)onCancel()};
  mask.querySelector('#pin_ok').onclick=ok;
  inp.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();ok()}};
  mask.onclick=function(e){if(e.target===mask){close();if(onCancel)onCancel()}};
}

// 设置/修改 PIN 弹窗。change=true 时要求先验证旧 PIN
function showPinDialog(change){
  if(change&&!isPinSet()){change=false}
  if(change){
    showPinInput('请输入当前 PIN 码',function(){
      _showSetPinForm();
    },function(){toast('已取消')});
  }else{
    _showSetPinForm();
  }
  function _showSetPinForm(){
    var mask=document.createElement('div');
    mask.className='modal-mask';
    mask.innerHTML='<div class="modal" style="max-width:340px"><div class="modal-hd"><span>'+(change?'修改 PIN 码':'设置 PIN 码')+'</span><span class="close">&times;</span></div>'+
      '<div class="modal-bd">'+
        '<input id="pin_new1" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="4-8 位数字" style="width:100%;padding:12px;font-size:16px;text-align:center;letter-spacing:4px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:10px">'+
        '<input id="pin_new2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="再次输入" style="width:100%;padding:12px;font-size:16px;text-align:center;letter-spacing:4px;border:1px solid #e2e8f0;border-radius:6px">'+
      '</div>'+
      '<div class="modal-ft"><button class="btn btn-ghost" id="pin_new_cancel">取消</button><button class="btn" id="pin_new_ok">保存</button></div></div>';
    document.body.appendChild(mask);
    var i1=mask.querySelector('#pin_new1'),i2=mask.querySelector('#pin_new2');
    setTimeout(function(){i1.focus()},50);
    function close(){mask.remove()}
    function ok(){
      var v1=i1.value.trim(),v2=i2.value.trim();
      if(!/^\d{4,8}$/.test(v1)){toast('PIN 必须是 4-8 位数字');return}
      if(v1!==v2){toast('两次输入不一致');return}
      if(!setPin(v1)){toast('⚠️ 保存失败：存储空间不足');return}
      audit('pin.set',change?'change':'setup');
      toast(change?'PIN 已修改':'PIN 已设置');
      close();
      route('/settings');
    }
    mask.querySelector('.close').onclick=close;
    mask.querySelector('#pin_new_cancel').onclick=close;
    mask.querySelector('#pin_new_ok').onclick=ok;
    i2.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();ok()}};
  }
}

// 高危操作门禁：未设 PIN 直接通过；已设 PIN 弹窗验证
function requirePinIfLocked(cb,onCancel){
  if(!isPinSet()){cb();return}
  showPinInput('请输入 PIN 码以确认',cb,onCancel);
}

/* Permission check */
function canDeletePatient(p){
  var role=getUserRole();
  if(role==='admin')return true;
  return false;
}
function canEditPatient(p){
  var role=getUserRole();
  if(role==='admin'||role==='director')return true;
  // therapist: only own created patients
  var ap=getActiveProfile();
  if(role==='therapist'&&ap&&p.createdBy===ap.id)return true;
  if(role==='therapist'&&!p.createdBy)return true; // legacy
  return false;
}
function canViewPatient(p){
  var role=getUserRole();
  if(role==='admin'||role==='director')return true;
  return canEditPatient(p);
}

/* Delete a patient and all associated data — 原子操作，失败回滚 */
function deletePatientData(pid){
  var bak_patients=getPatients();
  var bak_records=getRecords();
  var bak_assessments=getAssessments();
  var bak_specialExams=getSpecialExams();
  var bak_scales=getScales();
  var bak_plans=getPlans();
  function rollback(){
    LS.set('patients',bak_patients);
    LS.set('records',bak_records);
    LS.set('assessments',bak_assessments);
    LS.set('specialExams',bak_specialExams);
    LS.set('scales',bak_scales);
    LS.set('plans',bak_plans);
  }
  var arr=bak_patients.filter(function(p){return p.id!==pid});
  if(!LS.set('patients',arr)){rollback();return false}
  var toDel=bak_records.filter(function(r){return r.patientId===pid});
  var rs=bak_records.filter(function(r){return r.patientId!==pid});
  if(!LS.set('records',rs)){rollback();return false}
  toDel.forEach(function(r){if(r.photoId){DB.delPhoto(r.photoId).catch(function(){})}});
  var a=bak_assessments;delete a[pid];
  if(!LS.set('assessments',a)){rollback();return false}
  var se=bak_specialExams;delete se[pid];
  if(!LS.set('specialExams',se)){rollback();return false}
  var sc=bak_scales;delete sc[pid];
  if(!LS.set('scales',sc)){rollback();return false}
  var pl=bak_plans;delete pl[pid];
  if(!LS.set('plans',pl)){rollback();return false}
  // 审计：删除成功后记录
  var deleted=bak_patients.filter(function(p){return p.id===pid})[0];
  audit('patient.delete',{id:pid,name:deleted?deleted.name:'',records:toDel.length});
  return true;
}

/* ==================== Constants ==================== */
/* Special examination library */
/* 特殊检查库（按用户文档：去除失效演示链接，补充脑卒中/神经科常用项） */
var SPECIAL_EXAMS=[
  {name:'直腿抬高试验',category:'腰椎'},
  {name:'4字试验(Patrick)',category:'髋关节'},
  {name:'托马斯试验',category:'髋关节'},
  {name:'麦肯基测试',category:'腰椎'},
  {name:'FABER试验',category:'髋关节'},
  {name:'Neer撞击试验',category:'肩关节'},
  {name:'Hawkins试验',category:'肩关节'},
  {name:'Drop Arm试验',category:'肩关节'},
  {name:'Tinel征',category:'腕关节'},
  {name:'Phalen试验',category:'腕关节'},
  {name:'Lachman试验',category:'膝关节'},
  {name:'McMurray试验',category:'膝关节'},
  {name:'前抽屉试验',category:'踝关节'},
  {name:'磨髌试验',category:'膝关节'},
  {name:'布鲁津斯基征',category:'神经'},
  {name:'Kernig征',category:'神经'},
  {name:'颈项强直',category:'神经'},
  {name:'巴宾斯基征',category:'神经'},
  {name:'霍夫曼征',category:'神经'},
  {name:'戈登征',category:'神经'}
];
/* exam result options */
var EXAM_RESULTS=[
  {val:'positive',label:'阳性',cls:'pos'},
  {val:'negative',label:'阴性',cls:'neg'},
  {val:'suspect',label:'可疑',cls:''},
  {val:'unchecked',label:'未查',cls:''}
];

/* Pain sites for palpation（按文档补充：骶髂关节、肩胛骨、胸椎、骨盆） */
var PAIN_SITES=['颈椎','胸椎','腰椎','骶髂关节','骨盆','肩关节','肩胛骨','肘关节','腕关节','髋关节','膝关节','踝关节','足部','其他'];
/* Joint list for ROM */
var ROM_JOINTS=['颈椎','胸椎','腰椎','骶髂关节','肩','肘','腕','髋','膝','踝','足'];
var ROM_ACTIONS=['屈','伸','外展','内收','旋转','内旋','外旋'];
/* Muscle groups for muscle strength */
var MUSCLE_GROUPS=['屈颈肌','伸颈肌','三角肌','肱二头肌','肱三头肌','腕屈肌','腕伸肌','髂腰肌','股四头肌','腘绳肌','胫前肌','小腿三头肌','臀大肌','臀中肌','背伸肌群','腹肌'];
/* ADL items */
var ADL_ITEMS=['穿衣','进食','如厕','洗澡','行走','上下楼','购物','做饭','洗衣','服药'];

/* 评估模板：常见主诉/发病时间/诱因（按用户文档示例规范化） */
var ONSET_OPTIONS=['数小时前','1天内','3天前','1周前','2周前','1月前','3月前','半年前','1年以上'];
var TRIGGER_OPTIONS=['搬重物','外伤','跌倒','脑卒中','术后','劳累','受凉','无明显诱因','其他'];
var SYMPTOM_OPTIONS=[
  '腰痛伴下肢放射痛','腰痛','颈痛伴上肢放射痛','颈痛','肩关节疼痛活动受限',
  '膝关节疼痛肿胀','右侧肢体无力','左侧肢体无力','四肢无力',
  '关节活动受限','吞咽困难','言语不清','平衡障碍','步态异常','头晕头痛'
];

/* Scale definitions (built-in) */
var SCALE_DEFINITIONS={
  VAS:{name:'VAS疼痛评分',category:'疼痛评估',type:'slider',min:0,max:10,conclusion:function(s){
    if(s<=3)return '轻度疼痛（0-3）';
    if(s<=6)return '中度疼痛（4-6）';
    return '重度疼痛（7-10）';
  }},
  NRS:{name:'NRS数字评分',category:'疼痛评估',type:'number',min:0,max:10,conclusion:function(s){
    if(s<=3)return '轻度疼痛（0-3）';
    if(s<=6)return '中度疼痛（4-6）';
    return '重度疼痛（7-10）';
  }},
  MPQ:{name:'MPQ简化版',category:'疼痛评估',type:'mpq',conclusion:function(data){
    // data: {sensory:[...5 items 0-3], affective:[...4 items 0-3], eval:1-3}
    var s=(data.sensory||[]).reduce(function(a,b){return a+(+b||0)},0);
    var a=(data.affective||[]).reduce(function(a2,b){return a2+(+b||0)},0);
    var total=s+a;
    var lvl=total<=10?'轻度':(total<=20?'中度':'重度');
    return 'PRI总分 '+total+'（感觉项'+s+' + 情感项'+a+'） - '+lvl+'疼痛';
  }},
  Barthel:{name:'Barthel指数',category:'功能与生活能力',type:'barthel',max:100,conclusion:function(score){
    if(score>60)return '独立（>60分）';
    if(score>=41)return '轻度依赖（41-60分）';
    if(score>=21)return '中度依赖（21-40分）';
    return '完全依赖（≤20分）';
  }},
  Walk6Min:{name:'6分钟步行试验',category:'心肺评估',type:'walk',conclusion:function(dist){
    dist=+dist||0;
    if(dist<150)return '重度心功能不全（<150m）';
    if(dist<300)return '中度心功能不全（150-300m）';
    if(dist<450)return '轻度心功能不全（300-450m）';
    return '心功能正常（>450m）';
  }}
};
/* Barthel items with options */
var BARTHEL_ITEMS=[
  {name:'进食',opts:[{l:'独立',v:10},{l:'需协助',v:5},{l:'不能',v:0}]},
  {name:'洗澡',opts:[{l:'独立',v:5},{l:'不能',v:0}]},
  {name:'修饰',opts:[{l:'独立',v:5},{l:'不能',v:0}]},
  {name:'穿衣',opts:[{l:'独立',v:10},{l:'需协助',v:5},{l:'不能',v:0}]},
  {name:'大便控制',opts:[{l:'独立',v:10},{l:'偶尔失禁',v:5},{l:'失禁',v:0}]},
  {name:'小便控制',opts:[{l:'独立',v:10},{l:'偶尔失禁',v:5},{l:'失禁',v:0}]},
  {name:'如厕',opts:[{l:'独立',v:10},{l:'需协助',v:5},{l:'不能',v:0}]},
  {name:'床椅转移',opts:[{l:'独立',v:15},{l:'需协助',v:10},{l:'需1人帮助',v:5},{l:'不能',v:0}]},
  {name:'平地行走',opts:[{l:'独立45m',v:15},{l:'需协助',v:10},{l:'轮椅独立',v:5},{l:'不能',v:0}]},
  {name:'上下楼梯',opts:[{l:'独立',v:10},{l:'需协助',v:5},{l:'不能',v:0}]}
];
/* 量表库（按用户《评估量表汇总》文档：71个标准化量表，12大分类）
   interactive=true 表示有专属交互表单（见 SCALE_DEFINITIONS），其余走通用快速评分记录 */
var SCALE_LIBRARY=[
  /* 疼痛评估 */
  {key:'VAS',name:'VAS',fullName:'VAS视觉模拟疼痛评分',category:'疼痛评估',purpose:'主观疼痛强度',audience:'成人',scoring:'10cm直线标痛点',scoreRange:'0-10',interpretation:'0无痛；1-3轻度；4-6中度；7-10重度',notes:'视力/认知障碍不用，改用面部表情量表',interactive:true},
  {key:'NRS',name:'NRS',fullName:'NRS数字疼痛评分',category:'疼痛评估',purpose:'量化疼痛',audience:'广泛',scoring:'0-10数字选择',scoreRange:'0-10',interpretation:'同VAS（0-3轻/4-6中/7-10重）',notes:'最简单自评，每日可多次',interactive:true},
  {key:'P4',name:'P4',fullName:'P4疼痛强度量表',category:'疼痛评估',purpose:'疼痛强度',audience:'成人',scoring:'4问(最轻/最痛/平均/现在)各0-10',scoreRange:'0-40',interpretation:'<10轻度；10-20中度；>20重度',notes:'需患者回忆过去24h'},
  {key:'SFMPQ',name:'SF-MPQ',fullName:'McGill疼痛问卷(简明)',category:'疼痛评估',purpose:'多维度疼痛性质',audience:'详评者',scoring:'15词(11感觉+4情感)0-3分+VAS',scoreRange:'0-45+0-10',interpretation:'总分越高疼痛体验越复杂严重',notes:'耗时约5-10分钟',interactive:true},
  {key:'WongBaker',name:'Wong-Baker',fullName:'面部表情疼痛量表',category:'疼痛评估',purpose:'疼痛程度',audience:'儿童/认知障碍者',scoring:'6张面部表情0-10',scoreRange:'0-10',interpretation:'0无痛，偶数递增至10剧痛',notes:'非语言，3-18岁适用'},
  {key:'ODI',name:'ODI',fullName:'Oswestry功能障碍指数',category:'疼痛评估',purpose:'腰痛功能',audience:'腰痛患者',scoring:'10节(疼痛/护理/提物/行走/坐/站/睡眠/社交等)每节0-5',scoreRange:'0-100%',interpretation:'0-20%轻；20-40%中；40-60%重；60-80%极重；80-100%卧床',notes:'妊娠或严重合并症需注解'},
  {key:'RMQ',name:'RMQ',fullName:'Roland-Morris功能障碍问卷',category:'疼痛评估',purpose:'腰痛障碍',audience:'腰痛患者',scoring:'24条陈述勾选',scoreRange:'0-24',interpretation:'0-4轻；5-14中；15-24重',notes:'专针对腰痛相关活动受限'},
  /* 颈肩评估 */
  {key:'NDI',name:'NDI',fullName:'NDI颈椎功能障碍指数',category:'颈肩评估',purpose:'颈椎病功能',audience:'颈椎病患者',scoring:'10项(疼痛/护理/提物/阅读/头痛/注意力/工作/驾驶/睡眠/娱乐)每项0-5',scoreRange:'0-100%',interpretation:'同ODI百分比意义',notes:'颈椎病、颈痛患者'},
  {key:'JOAC',name:'JOA颈椎',fullName:'JOA颈椎评分',category:'颈肩评估',purpose:'脊髓型颈椎病神经功能',audience:'颈髓受压者',scoring:'上肢运动(0-4)+下肢运动(0-4)+感觉(0-6)+膀胱(0-3)',scoreRange:'0-17',interpretation:'17正常；11-16轻；6-10中；0-5重',notes:'评估脊髓型颈椎病'},
  /* 腰背评估 */
  {key:'JOAL',name:'JOA腰椎',fullName:'JOA腰椎评分',category:'腰背评估',purpose:'腰椎疾病',audience:'腰突/狭窄',scoring:'主观症状(9)+体征(6)+ADL(14)+膀胱(-6~0)',scoreRange:'0-29',interpretation:'>25优；15-25良；<15差',notes:'需查体'},
  /* 上肢评估 */
  {key:'UCLA',name:'UCLA',fullName:'UCLA肩袖评分',category:'上肢评估',purpose:'肩关节功能',audience:'肩袖伤',scoring:'疼痛10+功能10+主动前屈5+前屈肌力5+满意度5',scoreRange:'0-35',interpretation:'34-35优；29-33良；<29差',notes:'肩袖修复术后'},
  {key:'Constant',name:'Constant',fullName:'Constant-Murley肩关节评分',category:'上肢评估',purpose:'肩全面功能',audience:'肩病',scoring:'疼痛15+ADL20+ROM40+肌力25',scoreRange:'0-100',interpretation:'>90优；80-89良；70-79可；<70差',notes:'需肌力计与量角器'},
  {key:'DASH',name:'DASH',fullName:'DASH上肢功能障碍评定',category:'上肢评估',purpose:'上肢症状功能',audience:'上肢肌骨病',scoring:'30题(21功能+9症状)每题1-5',scoreRange:'0-100',interpretation:'0正常；>30显著障碍',notes:'覆盖肩肘腕手'},
  {key:'MayoElbow',name:'Mayo肘',fullName:'Mayo肘关节功能评分',category:'上肢评估',purpose:'肘功能',audience:'肘病/术后',scoring:'疼痛45+活动度20+稳定性10+日常功能25',scoreRange:'0-100',interpretation:'90-100优；75-89良；60-74可；<60差',notes:'需测活动弧与松弛度'},
  /* 腕手评估 */
  {key:'QuickDASH',name:'QuickDASH',fullName:'QuickDASH简短上肢功能评分',category:'腕手评估',purpose:'简版上肢功能',audience:'同DASH',scoring:'11题(8功能+3症状)1-5',scoreRange:'0-100',interpretation:'同DASH',notes:'DASH简版，省时'},
  {key:'Cooney',name:'Cooney',fullName:'Cooney腕关节评分',category:'腕手评估',purpose:'腕功能',audience:'腕病/术后',scoring:'疼痛25+功能25+活动度25+握力25',scoreRange:'0-100',interpretation:'>90优；80-89良；65-79可；<65差',notes:'需握力计'},
  /* 下肢评估 */
  {key:'Harris',name:'Harris',fullName:'HHS髋关节评分',category:'下肢评估',purpose:'髋功能',audience:'髋病/置换',scoring:'疼痛44+功能47+畸形4+活动度5',scoreRange:'0-100',interpretation:'90-100优；80-89良；70-79可；<70差',notes:'需测ROM'},
  {key:'Lysholm',name:'Lysholm',fullName:'Lysholm膝关节评分',category:'下肢评估',purpose:'膝功能',audience:'韧带/半月板损伤',scoring:'跛行5+支撑5+交锁15+不稳25+疼痛25+肿胀10+爬楼10+蹲5',scoreRange:'0-100',interpretation:'95-100优；84-94良；65-83中；<65差',notes:'膝伤专用'},
  {key:'Oxford',name:'Oxford',fullName:'Oxford膝关节评分',category:'下肢评估',purpose:'膝置换评估',audience:'TKA术后',scoring:'12题(疼痛/功能)每题1-5',scoreRange:'12-60',interpretation:'<20优；20-29良；>29差',notes:'分越高越差，需反转'},
  {key:'IKDC',name:'IKDC',fullName:'IKDC膝关节评分',category:'下肢评估',purpose:'膝症状功能',audience:'各种膝伤',scoring:'18题症状/活动/功能换算',scoreRange:'0-100',interpretation:'越高越好',notes:'前叉损伤常见'},
  /* 踝足评估 */
  {key:'AOFAS',name:'AOFAS',fullName:'AOFAS踝-后足评分',category:'踝足评估',purpose:'踝足功能',audience:'踝伤',scoring:'疼痛40+功能50+对线10',scoreRange:'0-100',interpretation:'90-100优；75-89良；50-74可；<50差',notes:'需影像对线评估'},
  {key:'FAAM',name:'FAAM',fullName:'FAAM足踝能力评分',category:'踝足评估',purpose:'足踝功能',audience:'足踝病',scoring:'ADL子量表21题+运动8题，每题0-4',scoreRange:'0-100%',interpretation:'百分比越高越好',notes:'患者自评'},
  /* 功能与生活能力 */
  {key:'PSFS',name:'PSFS',fullName:'PSFS患者特异性功能量表',category:'功能与生活能力',purpose:'个体活动困难度',audience:'功能障碍者',scoring:'患者写3-5个重要活动，每项0-10',scoreRange:'0-10',interpretation:'均值越高越好',notes:'个体化，治疗前后对比'},
  {key:'Barthel',name:'Barthel',fullName:'Barthel指数',category:'功能与生活能力',purpose:'ADL能力',audience:'卒中/老人',scoring:'10项(进食/洗澡/修饰/穿衣/大小便控制/如厕/转移/行走/上下楼)',scoreRange:'0-100',interpretation:'100独立；60-99轻度依赖；40-59中；20-39重；<20完全依赖',notes:'量表效度好',interactive:true},
  {key:'MBI',name:'MBI',fullName:'改良Barthel指数',category:'功能与生活能力',purpose:'精细ADL',audience:'同BI',scoring:'同BI但评分更细(如进食0,2,5,8,10)',scoreRange:'0-100',interpretation:'同BI',notes:'更敏感'},
  {key:'FIM',name:'FIM',fullName:'FIM功能独立性评定',category:'功能与生活能力',purpose:'全面独立能力',audience:'重残患者',scoring:'18项(13运动+5认知)每项1-7',scoreRange:'18-126',interpretation:'126完全独立；108-125基本独立；<72依赖',notes:'需专业培训'},
  {key:'Katz',name:'Katz',fullName:'Katz指数(ADL)',category:'功能与生活能力',purpose:'基本ADL',audience:'老年筛查',scoring:'6项(洗澡/穿衣/如厕/转移/大小便/进食)独立=1',scoreRange:'0-6',interpretation:'6独立；<4需照护',notes:'老年筛查'},
  {key:'Lawton',name:'Lawton',fullName:'Lawton IADL',category:'功能与生活能力',purpose:'工具性ADL',audience:'社区老人',scoring:'8项(电话/购物/做饭/家务/洗衣/交通/药/钱)每项0-1',scoreRange:'0-8',interpretation:'低分提示工具性ADL受损',notes:'社区老人'},
  {key:'FAC',name:'FAC',fullName:'功能性步行分级',category:'功能与生活能力',purpose:'步行功能',audience:'神经患者',scoring:'0不能~5完全独立',scoreRange:'0-5级',interpretation:'5独立',notes:'观察法'},
  {key:'Holden',name:'Holden',fullName:'Holden步行能力分级',category:'功能与生活能力',purpose:'步行能力',audience:'卒中患者',scoring:'同FAC 0-5级',scoreRange:'0-5级',interpretation:'同FAC',notes:'观察法'},
  {key:'Frenchay',name:'Frenchay',fullName:'Frenchay活动指数',category:'功能与生活能力',purpose:'生活参与',audience:'卒中社区',scoring:'15项(家务/休闲/外出)0-3',scoreRange:'0-45',interpretation:'越高越好',notes:'社区融入'},
  {key:'FMAUE',name:'FMA-UE',fullName:'Fugl-Meyer上肢评估',category:'功能与生活能力',purpose:'上肢运动功能',audience:'卒中偏瘫',scoring:'肩肘24+腕10+手14+协调6',scoreRange:'0-66',interpretation:'越高越好',notes:'每项0-2'},
  {key:'FMALE',name:'FMA-LE',fullName:'Fugl-Meyer下肢评估',category:'功能与生活能力',purpose:'下肢运动功能',audience:'卒中偏瘫',scoring:'髋膝14+踝8+协调6',scoreRange:'0-34',interpretation:'越高越好',notes:'每项0-2'},
  {key:'BrunnstromUE',name:'Brunnstrom上肢',fullName:'Brunnstrom分期(上肢)',category:'功能与生活能力',purpose:'偏瘫恢复分期',audience:'偏瘫患者',scoring:'I弛缓~VI正常共6期',scoreRange:'I-VI',interpretation:'越高越好',notes:'分期报告'},
  {key:'BrunnstromLE',name:'Brunnstrom下肢',fullName:'Brunnstrom分期(下肢)',category:'功能与生活能力',purpose:'偏瘫恢复分期',audience:'偏瘫患者',scoring:'I弛缓~VI正常共6期',scoreRange:'I-VI',interpretation:'越高越好',notes:'分期报告'},
  {key:'BrunnstromHand',name:'Brunnstrom手',fullName:'Brunnstrom分期(手)',category:'功能与生活能力',purpose:'偏瘫恢复分期',audience:'偏瘫患者',scoring:'I弛缓~VI正常共6期',scoreRange:'I-VI',interpretation:'越高越好',notes:'分期报告'},
  {key:'MAS',name:'MAS',fullName:'MAS运动评估',category:'功能与生活能力',purpose:'运动功能',audience:'卒中患者',scoring:'8项(翻身/坐/站等)0-6',scoreRange:'0-48',interpretation:'越高越好',notes:'卒中运动评估'},
  {key:'RMI',name:'RMI',fullName:'Rivermead运动指数',category:'功能与生活能力',purpose:'活动能力',audience:'卒中/脑伤',scoring:'15项(翻身到跑)每项0-1',scoreRange:'0-15',interpretation:'越高越好',notes:'观察法'},
  {key:'Motricity',name:'Motricity',fullName:'Motricity指数',category:'功能与生活能力',purpose:'肌力',audience:'卒中患者',scoring:'上下肢各3肌群(肩屈/肘伸/腕伸；髋屈/膝伸/踝背屈)',scoreRange:'0-100',interpretation:'越高越好',notes:'卒中肌力评估'},
  {key:'UedaUE',name:'上田敏上肢',fullName:'上田敏偏瘫上肢',category:'功能与生活能力',purpose:'偏瘫功能',audience:'偏瘫患者',scoring:'12级(0-11)',scoreRange:'0-11',interpretation:'越高越好',notes:'级别报告'},
  {key:'UedaLE',name:'上田敏下肢',fullName:'上田敏偏瘫下肢',category:'功能与生活能力',purpose:'偏瘫功能',audience:'偏瘫患者',scoring:'12级(0-11)',scoreRange:'0-11',interpretation:'越高越好',notes:'级别报告'},
  /* 平衡与步行 */
  {key:'BBS',name:'BBS',fullName:'Berg平衡量表',category:'平衡与步行',purpose:'平衡防跌',audience:'老/神经患者',scoring:'14项(坐站/转移/闭眼站/单脚站等)每项0-4',scoreRange:'0-56',interpretation:'<40高风险；41-45中风险；46-56低风险',notes:'需椅子台阶'},
  {key:'TUG',name:'TUG',fullName:'TUG起立行走测试',category:'平衡与步行',purpose:'移动能力',audience:'老/神经患者',scoring:'椅高46cm走3m返回坐，计时',scoreRange:'秒',interpretation:'<10正常；>13.5跌倒风险；>30有跌倒史',notes:'观察法'},
  {key:'FRT',name:'FRT',fullName:'功能性伸展测试',category:'平衡与步行',purpose:'动态平衡',audience:'老人',scoring:'臂前伸最大距',scoreRange:'cm',interpretation:'<15cm易跌',notes:'测量法'},
  {key:'OLS',name:'OLS',fullName:'单脚站立测试',category:'平衡与步行',purpose:'静态平衡',audience:'老人',scoring:'睁眼单脚站计时',scoreRange:'秒',interpretation:'<5秒平衡差',notes:'观察法'},
  {key:'Romberg',name:'Romberg',fullName:'Romberg测试',category:'平衡与步行',purpose:'本体/前庭',audience:'眩晕患者',scoring:'并足睁/闭眼观察',scoreRange:'观察',interpretation:'闭眼晃动/跌倒为异常',notes:'观察法'},
  {key:'FingerNose',name:'指鼻试验',fullName:'协调测试(指鼻试验)',category:'平衡与步行',purpose:'协调功能',audience:'小脑患者',scoring:'指鼻反复观察',scoreRange:'观察',interpretation:'辨距不良/震颤为异常',notes:'观察法'},
  {key:'TUG8ft',name:'8英尺TUG',fullName:'计时起立行走测试(8英尺版)',category:'平衡与步行',purpose:'短距移动',audience:'老人',scoring:'2.44m版本计时',scoreRange:'秒',interpretation:'同TUG',notes:'同TUG'},
  {key:'DGI',name:'DGI',fullName:'动态步态指数',category:'平衡与步行',purpose:'动态平衡',audience:'老/前庭患者',scoring:'8项(变速/转头走等)0-3',scoreRange:'0-24',interpretation:'<19跌倒风险',notes:'观察法'},
  /* 生活质量 */
  {key:'SF12',name:'SF-12',fullName:'SF-12生活质量量表',category:'生活质量',purpose:'健康相关生活质量',audience:'普/患',scoring:'12题(PCS/MCS)',scoreRange:'标准分',interpretation:'PCS/MCS标准分',notes:'普适性量表'},
  {key:'WaterSwallow',name:'洼田饮水',fullName:'洼田饮水试验',category:'生活质量',purpose:'吞咽筛查',audience:'卒中/老人',scoring:'喝30ml水分级',scoreRange:'1-5级',interpretation:'1级正常；5级严重',notes:'吞咽筛查'},
  {key:'GUSS',name:'GUSS',fullName:'GUSS吞咽评估',category:'生活质量',purpose:'吞咽功能',audience:'卒中患者',scoring:'间接(唇/咽/呼吸)+直接(勺/杯/水)共20分',scoreRange:'0-20',interpretation:'分级评估',notes:'吞咽功能评估'},
  {key:'FrenchayDys',name:'Frenchay构音',fullName:'Frenchay构音障碍评估',category:'生活质量',purpose:'构音功能',audience:'神经言语患者',scoring:'反射/呼吸/唇/颌/腭/喉/舌每项0-4',scoreRange:'分级',interpretation:'分级评估',notes:'构音障碍'},
  {key:'BDAE',name:'BDAE',fullName:'波士顿诊断性失语检查',category:'生活质量',purpose:'失语评估',audience:'失语患者',scoring:'36子项综合',scoreRange:'综合',interpretation:'综合评估',notes:'失语症诊断'},
  /* 肌肉与关节功能 */
  {key:'MMT',name:'MMT',fullName:'MMT徒手肌力测试',category:'肌肉与关节功能',purpose:'肌力',audience:'肌减患者',scoring:'0无收缩~5正常',scoreRange:'0-5级',interpretation:'0无收缩；1微动；2重力下全幅；3抗重力；4抗阻部分；5正常',notes:'徒手肌力'},
  {key:'ROM',name:'ROM',fullName:'ROM关节活动度评估',category:'肌肉与关节功能',purpose:'关节活动范围',audience:'关节病患者',scoring:'量角器测主动/被动度',scoreRange:'角度',interpretation:'各关节正常范围对照',notes:'量角器测量'},
  {key:'Ashworth',name:'改良Ashworth',fullName:'改良Ashworth肌张力量表',category:'肌肉与关节功能',purpose:'肌张力/痉挛',audience:'上运动神经元损伤',scoring:'0正常~4僵直',scoreRange:'0-4级',interpretation:'0正常；1稍增；1+明显增但活动易；2部分僵；3全僵被动难；4僵直',notes:'痉挛评估'},
  {key:'Tardieu',name:'改良Tardieu',fullName:'改良Tardieu量表',category:'肌肉与关节功能',purpose:'痉挛速度依赖',audience:'脑瘫患者',scoring:'快牵角度R1，慢牵R2，分0-4级',scoreRange:'角度/0-4级',interpretation:'R1与R2差值评估痉挛',notes:'速度依赖痉挛'},
  {key:'Penn',name:'Penn',fullName:'Penn痉挛频率评分',category:'肌肉与关节功能',purpose:'痉挛频率',audience:'脊髓损伤患者',scoring:'0无~4>10次/h',scoreRange:'0-4级',interpretation:'0无；1<1次/天；2>1次/天；3>1次/h；4>10次/h',notes:'痉挛频率'},
  {key:'Clonus',name:'Clonus',fullName:'Clonus分级',category:'肌肉与关节功能',purpose:'阵挛',audience:'上运动神经元损伤',scoring:'0无~4固定挛缩',scoreRange:'0-4级',interpretation:'0无；1<10秒；2>10秒；3持续需干预；4固定挛缩',notes:'阵挛评估'},
  /* 心理状态 */
  {key:'GAD7',name:'GAD-7',fullName:'GAD-7焦虑自评',category:'心理状态',purpose:'焦虑筛查',audience:'成人',scoring:'7题(紧张/担忧等)0-3',scoreRange:'0-21',interpretation:'5-9轻度；10-14中度；>=15重度',notes:'焦虑自评'},
  {key:'PHQ9',name:'PHQ-9',fullName:'PHQ-9抑郁自评',category:'心理状态',purpose:'抑郁筛查',audience:'成人',scoring:'9题0-3',scoreRange:'0-27',interpretation:'5/10/15分级，>10建议治疗',notes:'抑郁自评'},
  {key:'MMSE',name:'MMSE',fullName:'MMSE简易精神状态',category:'心理状态',purpose:'认知筛查',audience:'老/痴患者',scoring:'定向(10)+记忆(3)+注意(5)+回忆(3)+语言(9)',scoreRange:'0-30',interpretation:'文盲<17，小学<20，中学<24为痴呆',notes:'认知筛查'},
  {key:'MoCA',name:'MoCA',fullName:'MoCA蒙特利尔认知评估',category:'心理状态',purpose:'轻度认知障碍',audience:'认知下降者',scoring:'注意/记忆/语言/视空间等',scoreRange:'0-30',interpretation:'<26为MCI（教育<12年+1）',notes:'轻度认知障碍筛查'},
  {key:'GCS',name:'GCS',fullName:'GCS格拉斯哥昏迷评分',category:'心理状态',purpose:'意识水平',audience:'脑伤患者',scoring:'睁眼(1-4)+语言(1-5)+运动(1-6)',scoreRange:'3-15',interpretation:'<=8昏迷；9-12重度；13-15轻度',notes:'昏迷评估'},
  {key:'HAMA',name:'HAMA',fullName:'HAMA汉密尔顿焦虑',category:'心理状态',purpose:'焦虑严重度',audience:'焦虑患者',scoring:'14项0-4',scoreRange:'0-56',interpretation:'>14焦虑',notes:'他评量表'},
  {key:'HAMD',name:'HAMD',fullName:'HAMD汉密尔顿抑郁(17项)',category:'心理状态',purpose:'抑郁严重度',audience:'抑郁患者',scoring:'17项0-2/4',scoreRange:'0-52',interpretation:'>17抑郁',notes:'他评量表'},
  {key:'LOTCA',name:'LOTCA',fullName:'LOTCA认知评估',category:'心理状态',purpose:'认知综合评估',audience:'脑伤患者',scoring:'定向/知觉/视运动/思维',scoreRange:'分项',interpretation:'分项评估',notes:'认知综合'},
  {key:'DigitSpan',name:'数字广度',fullName:'数字广度测试',category:'心理状态',purpose:'注意记忆',audience:'认知评估',scoring:'顺背/倒背位数',scoreRange:'位数',interpretation:'位数越高越好',notes:'注意记忆'},
  {key:'TMT',name:'TMT',fullName:'连线测试',category:'心理状态',purpose:'执行功能',audience:'认知评估',scoring:'A数字连，B数字字母交替，计秒',scoreRange:'秒',interpretation:'耗时越长执行功能越差',notes:'执行功能'},
  /* 心肺评估 */
  {key:'Walk6Min',name:'6分钟步行',fullName:'6分钟步行试验',category:'心肺评估',purpose:'心肺耐力',audience:'心肺疾病',scoring:'6分钟步行距离',scoreRange:'米',interpretation:'<150重度心功能不全；150-300中度；300-450轻度；>450正常',notes:'心肺耐力评估',interactive:true}
];
/* 量表分类（按文档12大类 + 全部 + 自定义） */
var SCALE_CATEGORIES=['全部','疼痛评估','颈肩评估','腰背评估','上肢评估','腕手评估','下肢评估','踝足评估','功能与生活能力','平衡与步行','生活质量','肌肉与关节功能','心理状态','心肺评估','自定义'];

/* Treatment item library */
var TREATMENT_ITEMS={
  '物理因子治疗':[
    {name:'电疗(TENS/干扰电)'},
    {name:'热疗(红外/湿热)'},
    {name:'冷疗'},
    {name:'超声波'},
    {name:'激光'},
    {name:'牵引'}
  ],
  '运动疗法':[
    {name:'功率自行车'},
    {name:'肌力训练'},
    {name:'平衡训练'},
    {name:'关节活动度训练'},
    {name:'核心训练'},
    {name:'步态训练'}
  ],
  '手法治疗':[
    {name:'肌筋膜松解'},
    {name:'关节松动(Maitland I-IV级)'},
    {name:'PNF拉伸'},
    {name:'按摩'}
  ],
  '东营市康复医疗收费项目':[
    {name:'意识障碍康复训练',code:'0152000001000',unit:'半小时',price3:63,price2:60,price1:57},
    {name:'意识障碍训练-每增加10分钟(加)',code:'0152000001001',unit:'10分钟',price3:21,price2:20,price1:19},
    {name:'意识障碍训练-人工智能辅助训练(扩展)',code:'0152000001010',unit:'半小时',price3:63,price2:60,price1:57},
    {name:'认知功能训练',code:'0152000002000',unit:'半小时',price3:70.5,price2:67.5,price1:66},
    {name:'认知功能训练-每增加10分钟(加)',code:'0152000002001',unit:'10分钟',price3:23.5,price2:22.5,price1:22},
    {name:'认知功能训练-人工智能辅助训练(扩展)',code:'0152000002010',unit:'半小时',price3:70.5,price2:67.5,price1:66},
    {name:'吞咽功能训练',code:'0152000003000',unit:'半小时',price3:66,price2:58,price1:54},
    {name:'吞咽功能训练-每增加10分钟(加)',code:'0152000003001',unit:'10分钟',price3:22,price2:19,price1:18},
    {name:'吞咽功能训练-人工智能辅助训练(扩展)',code:'0152000003010',unit:'半小时',price3:66,price2:58,price1:54},
    {name:'言语功能训练',code:'0152000004000',unit:'半小时',price3:66,price2:63,price1:60},
    {name:'言语功能训练-每增加10分钟(加)',code:'0152000004001',unit:'10分钟',price3:22,price2:21,price1:20},
    {name:'言语功能训练-人工智能辅助训练(扩展)',code:'0152000004010',unit:'半小时',price3:66,price2:63,price1:60},
    {name:'运动功能训练',code:'0152000005000',unit:'半小时',price3:66,price2:63,price1:60},
    {name:'运动功能训练-每增加10分钟(加)',code:'0152000005001',unit:'10分钟',price3:22,price2:21,price1:20},
    {name:'运动功能训练-水中运动(加)',code:'0152000005011',unit:'半小时',price3:33,price2:31.5,price1:30},
    {name:'运动功能训练-人工智能辅助训练(扩展)',code:'0152000005010',unit:'半小时',price3:66,price2:63,price1:60},
    {name:'膀胱功能训练',code:'0152000006000',unit:'半小时',price3:66,price2:57,price1:54},
    {name:'膀胱功能训练-人工智能辅助训练(扩展)',code:'0152000006010',unit:'半小时',price3:66,price2:57,price1:54},
    {name:'辅助器具使用训练',code:'0152000007000',unit:'半小时',price3:20,price2:19,price1:0},
    {name:'辅助器具使用训练-人工智能辅助',code:'0152000007010',unit:'半小时',price3:21,price2:20,price1:19},
    {name:'生活技能康复训练',code:'0152000008000',unit:'半小时',price3:66,price2:63,price1:60},
    {name:'生活技能康复训练-每增加10分钟(加)',code:'0152000008001',unit:'10分钟',price3:22,price2:21,price1:20},
    {name:'生活技能康复训练-人工智能辅助(扩展)',code:'0152000008010',unit:'半小时',price3:66,price2:63,price1:60},
    {name:'职业技能康复训练',code:'0152000009000',unit:'半小时',price3:72,price2:67.5,price1:60},
    {name:'职业技能康复训练-每增加10分钟(加)',code:'0152000009001',unit:'10分钟',price3:24,price2:22.5,price1:21},
    {name:'职业技能康复训练-人工智能辅助(扩展)',code:'0152000009010',unit:'半小时',price3:72,price2:67.5,price1:60},
    {name:'神经发育障碍康复训练(个体)',code:'0152000010000',unit:'半小时',price3:78.5,price2:70.5,price1:66},
    {name:'神经发育障碍康复训练(个体)-每增加10分钟(加)',code:'0152000010001',unit:'10分钟',price3:25,price2:23.5,price1:22},
    {name:'神经发育障碍康复训练(个体)-人工智能辅助(扩展)',code:'0152000010010',unit:'半小时',price3:78.5,price2:70.5,price1:66},
    {name:'神经发育障碍康复训练(团体)',code:'0152000011000',unit:'半小时',price3:42,price2:39,price1:36},
    {name:'神经发育障碍康复训练(团体)-每增加10分钟(加)',code:'0152000011001',unit:'10分钟',price3:14,price2:13,price1:12},
    {name:'神经发育障碍康复训练(团体)-人工智能辅助(扩展)',code:'0152000011010',unit:'半小时',price3:42,price2:39,price1:36},
    {name:'认知功能检查',code:'0151000010000',unit:'次',price3:29.5,price2:28,price1:26.5},
    {name:'认知功能检查-人工智能辅助检查(扩展)',code:'0151000010100',unit:'次',price3:29.5,price2:28,price1:26.5},
    {name:'吞咽功能检查',code:'0151000013000',unit:'次',price3:28.5,price2:27,price1:25.5},
    {name:'吞咽功能检查-人工智能辅助检查(扩展)',code:'01510000130100',unit:'次',price3:28.5,price2:27,price1:25.5},
    {name:'言语功能检查',code:'0151000014000',unit:'次',price3:33.5,price2:32,price1:30.5},
    {name:'言语功能检查-人工智能辅助检查(扩展)',code:'01510000140100',unit:'次',price3:33.5,price2:32,price1:30.5},
    {name:'运动功能检查',code:'0151000015000',unit:'次',price3:45,price2:42.5,price1:40},
    {name:'运动功能检查-人工智能辅助检查(扩展)',code:'01510000150100',unit:'次',price3:45,price2:42.5,price1:40},
    {name:'肢体功能检查',code:'0151000016000',unit:'次',price3:45,price2:42.5,price1:40},
    {name:'肢体功能检查-人工智能辅助检查(扩展)',code:'01510000160100',unit:'次',price3:45,price2:42.5,price1:40},
    {name:'神经发育障碍检查',code:'0151000017000',unit:'次',price3:27,price2:25.5,price1:24},
    {name:'神经发育障碍检查-人工智能辅助检查(扩展)',code:'01510000170100',unit:'次',price3:27,price2:25.5,price1:24}
  ]
};

var DY_PRICE_LIST=[
  {category:'1.意识障碍康复训练',code:'0152000001000',name:'意识障碍康复训练',unit:'半小时',price3:63,price2:60,price1:57,desc:'通过康复服务手段对各种疾病造成的昏迷、植物状态和醒状昏迷等进行康复治疗',note:'二级每日最高不超过126元'},
  {category:'1.意识障碍康复训练',code:'0152000001001',name:'意识障碍训练-每增加10分钟(加)',unit:'10分钟',price3:21,price2:20,price1:19},
  {category:'1.意识障碍康复训练',code:'0152000001010',name:'意识障碍训练-人工智能辅助训练(扩展)',unit:'半小时',price3:63,price2:60,price1:57},
  {category:'2.认知功能训练',code:'0152000002000',name:'认知功能训练',unit:'半小时',price3:70.5,price2:67.5,price1:66,desc:'对认知功能障碍进行治疗，改善认知功能',note:'二级每日最高不超过211.5元'},
  {category:'2.认知功能训练',code:'0152000002001',name:'认知功能训练-每增加10分钟(加)',unit:'10分钟',price3:23.5,price2:22.5,price1:22},
  {category:'2.认知功能训练',code:'0152000002010',name:'认知功能训练-人工智能辅助训练(扩展)',unit:'半小时',price3:70.5,price2:67.5,price1:66},
  {category:'3.吞咽功能训练',code:'0152000003000',name:'吞咽功能训练',unit:'半小时',price3:66,price2:58,price1:54,desc:'对吞咽功能障碍进行治疗，改善患者吞咽功能',note:'二级每日最高不超过198元'},
  {category:'3.吞咽功能训练',code:'0152000003001',name:'吞咽功能训练-每增加10分钟(加)',unit:'10分钟',price3:22,price2:19,price1:18},
  {category:'3.吞咽功能训练',code:'0152000003010',name:'吞咽功能训练-人工智能辅助训练(扩展)',unit:'半小时',price3:66,price2:58,price1:54},
  {category:'4.言语功能训练',code:'0152000004000',name:'言语功能训练',unit:'半小时',price3:66,price2:63,price1:60,desc:'对言语-失语功能障碍进行治疗',note:'二级每日最高不超过126元'},
  {category:'4.言语功能训练',code:'0152000004001',name:'言语功能训练-每增加10分钟(加)',unit:'10分钟',price3:22,price2:21,price1:20},
  {category:'4.言语功能训练',code:'0152000004010',name:'言语功能训练-人工智能辅助训练(扩展)',unit:'半小时',price3:66,price2:63,price1:60},
  {category:'5.运动功能训练',code:'0152000005000',name:'运动功能训练',unit:'半小时',price3:66,price2:63,price1:60,desc:'对四肢和躯干的运动功能障碍进行治疗',note:'三级每日最高不超过89~378元(按残疾类型)'},
  {category:'5.运动功能训练',code:'0152000005001',name:'运动功能训练-每增加10分钟(加)',unit:'10分钟',price3:22,price2:21,price1:20},
  {category:'5.运动功能训练',code:'0152000005011',name:'运动功能训练-水中运动(加)',unit:'半小时',price3:33,price2:31.5,price1:30},
  {category:'5.运动功能训练',code:'0152000005010',name:'运动功能训练-人工智能辅助训练(扩展)',unit:'半小时',price3:66,price2:63,price1:60},
  {category:'6.膀胱功能训练',code:'0152000006000',name:'膀胱功能训练',unit:'半小时',price3:66,price2:57,price1:54,desc:'对膀胱功能障碍进行治疗，改善相关排尿功能'},
  {category:'6.膀胱功能训练',code:'0152000006010',name:'膀胱功能训练-人工智能辅助训练(扩展)',unit:'半小时',price3:66,price2:57,price1:54},
  {category:'7.辅助器具使用训练',code:'0152000007000',name:'辅助器具使用训练',unit:'半小时',price3:20,price2:19,price1:0,desc:'通过挑选合适的辅助器具(假肢/矫形器/轮椅/助行器)指导患者正确使用',note:'二级每日最高不超过20元'},
  {category:'7.辅助器具使用训练',code:'0152000007010',name:'辅助器具使用训练-人工智能辅助',unit:'半小时',price3:21,price2:20,price1:19},
  {category:'8.生活技能康复训练',code:'0152000008000',name:'生活技能康复训练',unit:'半小时',price3:66,price2:63,price1:60,desc:'训练日常生活能力(穿脱衣物/进食/如厕)等',note:'二级每日最高不超过132元'},
  {category:'8.生活技能康复训练',code:'0152000008001',name:'生活技能康复训练-每增加10分钟(加)',unit:'10分钟',price3:22,price2:21,price1:20},
  {category:'8.生活技能康复训练',code:'0152000008010',name:'生活技能康复训练-人工智能辅助(扩展)',unit:'半小时',price3:66,price2:63,price1:60},
  {category:'9.职业技能康复训练',code:'0152000009000',name:'职业技能康复训练',unit:'半小时',price3:72,price2:67.5,price1:60,desc:'训练患者职业技能和重返社会的能力'},
  {category:'9.职业技能康复训练',code:'0152000009001',name:'职业技能康复训练-每增加10分钟(加)',unit:'10分钟',price3:24,price2:22.5,price1:21},
  {category:'9.职业技能康复训练',code:'0152000009010',name:'职业技能康复训练-人工智能辅助(扩展)',unit:'半小时',price3:72,price2:67.5,price1:60},
  {category:'10.神经发育障碍康复训练(个体)',code:'0152000010000',name:'神经发育障碍康复训练(个体)',unit:'半小时',price3:78.5,price2:70.5,price1:66,desc:'一对一的形式进行发育能力和神经康复技能训练',note:'二级每日最高不超过157元'},
  {category:'10.神经发育障碍康复训练(个体)',code:'0152000010001',name:'神经发育障碍康复训练(个体)-每增加10分钟(加)',unit:'10分钟',price3:25,price2:23.5,price1:22},
  {category:'10.神经发育障碍康复训练(个体)',code:'0152000010010',name:'神经发育障碍康复训练(个体)-人工智能辅助(扩展)',unit:'半小时',price3:78.5,price2:70.5,price1:66},
  {category:'11.神经发育障碍康复训练(团体)',code:'0152000011000',name:'神经发育障碍康复训练(团体)',unit:'半小时',price3:42,price2:39,price1:36,desc:'一对多的形式进行发育能力和神经康复技能训练',note:'二级每日最高不超过117元'},
  {category:'11.神经发育障碍康复训练(团体)',code:'0152000011001',name:'神经发育障碍康复训练(团体)-每增加10分钟(加)',unit:'10分钟',price3:14,price2:13,price1:12},
  {category:'11.神经发育障碍康复训练(团体)',code:'0152000011010',name:'神经发育障碍康复训练(团体)-人工智能辅助(扩展)',unit:'半小时',price3:42,price2:39,price1:36},
  {category:'12.认知功能检查',code:'0151000010000',name:'认知功能检查',unit:'次',price3:29.5,price2:28,price1:26.5,desc:'应用工具/仪器对记忆/注意/计算/智力/定向/认知功能评估',note:'不同量表不同时收取'},
  {category:'12.认知功能检查',code:'0151000010100',name:'认知功能检查-人工智能辅助检查(扩展)',unit:'次',price3:29.5,price2:28,price1:26.5},
  {category:'13.吞咽功能检查',code:'0151000013000',name:'吞咽功能检查',unit:'次',price3:28.5,price2:27,price1:25.5,desc:'评估患者吞咽功能，评估口腔期/咽期/食管功能有无问题'},
  {category:'13.吞咽功能检查',code:'01510000130100',name:'吞咽功能检查-人工智能辅助检查(扩展)',unit:'次',price3:28.5,price2:27,price1:25.5},
  {category:'14.言语功能检查',code:'0151000014000',name:'言语功能检查',unit:'次',price3:33.5,price2:32,price1:30.5,desc:'检查构音/语音/语言/听力及语言功能障碍'},
  {category:'14.言语功能检查',code:'01510000140100',name:'言语功能检查-人工智能辅助检查(扩展)',unit:'次',price3:33.5,price2:32,price1:30.5},
  {category:'15.运动功能检查',code:'0151000015000',name:'运动功能检查',unit:'次',price3:45,price2:42.5,price1:40,desc:'评估肌力/关节活动/平衡/步态/体感/协调/运动控制障碍'},
  {category:'15.运动功能检查',code:'01510000150100',name:'运动功能检查-人工智能辅助检查(扩展)',unit:'次',price3:45,price2:42.5,price1:40},
  {category:'16.肢体功能检查',code:'0151000016000',name:'肢体功能检查',unit:'次',price3:45,price2:42.5,price1:40,desc:'详细评价肢体感觉功能/运动功能分型/严重程度'},
  {category:'16.肢体功能检查',code:'01510000160100',name:'肢体功能检查-人工智能辅助检查(扩展)',unit:'次',price3:45,price2:42.5,price1:40},
  {category:'17.神经发育障碍检查',code:'0151000017000',name:'神经发育障碍检查',unit:'次',price3:27,price2:25.5,price1:24,desc:'专业人员评估体态/运动/智力/执行/语言/注意力/社交能力'},
  {category:'17.神经发育障碍检查',code:'01510000170100',name:'神经发育障碍检查-人工智能辅助检查(扩展)',unit:'次',price3:27,price2:25.5,price1:24}
];
function getDYCategories(){var map={};DY_PRICE_LIST.forEach(function(it){map[it.category]=1});return Object.keys(map)}
function getDYItemsByCategory(cat){return DY_PRICE_LIST.filter(function(it){return it.category===cat})}
function findDYPrice(name){if(!name)return null;for(var i=0;i<DY_PRICE_LIST.length;i++){if(DY_PRICE_LIST[i].name===name)return DY_PRICE_LIST[i]}return null}
function fmtPrice(p){if(p===0||p==='-'||p==null)return '—';return '￥'+p.toFixed(2)}

var PLAN_STAGES=[
  {key:'acute',name:'急性期（0-2周）',cls:'acute'},
  {key:'subacute',name:'亚急性期（2-6周）',cls:'subacute'},
  {key:'chronic',name:'慢性期（6周+）',cls:'chronic'}
];
var TREAT_FREQ=['每日','隔日','每周2次','每周3次'];

/* ========================= Utils ========================= */
