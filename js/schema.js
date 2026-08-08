// ===== schema.js auto-generated =====
var SCHEMA_VERSION=3;
var SCHEMA_KEY='_schema_version';
var DATA_KEYS=['therapist_profiles','active_profile_id','patients','records','assessments','specialExams','scales','plans','customExams','customScales','userRole','auditLog','pinHash'];

// 返回当前存储 schema 版本（未初始化时为 0）
function getStoredSchemaVersion(){var v=LS.get(SCHEMA_KEY);return (typeof v==='number'&&v>=0)?v:0}

// 迁移：每次升级写一个明确的 from→to 步骤，幂等、可重入
function migrateSchema(from,to){
  var log=[];
  function step(cur,fn){
    if(from<=cur&&to>cur){try{fn();log.push('v'+(cur+1)+':ok')}catch(e){log.push('v'+(cur+1)+':fail '+e.message)}}
  }
  // v0→1: 旧版无 schema，确保 auditLog/pinHash 容器存在
  step(0,function(){
    if(!LS.get('auditLog'))LS.set('auditLog',[]);
    if(!LS.get('pinHash'))LS.set('pinHash','');
  });
  // v1→2: records 缺字段补默认（向后兼容旧导出）
  step(1,function(){
    var rs=getRecords();
    rs.forEach(function(r){
      if(typeof r.photoId==='undefined')r.photoId=null;
      if(typeof r.timestamp!=='number')r.timestamp=Date.now();
    });
    setRecords(rs);
  });
  // v2→3: patients 缺 createdBy 标记为 'legacy'（便于权限判定）
  step(2,function(){
    var ps=getPatients();
    ps.forEach(function(p){if(!p.createdBy)p.createdBy='legacy'});
    setPatients(ps);
  });
  LS.set(SCHEMA_KEY,to);
  console.log('[schema] migrated',from,'→',to,'|',log.join(', '));
  return log;
}

// 启动时自动迁移（包在 try 内，失败不影响加载）
function ensureSchemaMigrated(){
  try{
    var cur=getStoredSchemaVersion();
    if(cur===SCHEMA_VERSION){return{ok:true,from:cur,to:cur,log:['noop']}}
    var before=cur;
    var log=migrateSchema(cur,SCHEMA_VERSION);
    return{ok:true,from:before,to:SCHEMA_VERSION,log:log};
  }catch(e){
    console.error('[schema] migration failed:',e);
    return{ok:false,error:e.message};
  }
}
// ===== A-1 数据层校验（schema validators）=====
function _isPlainObject(v){ return v && typeof v==='object' && !Array.isArray(v) }
function _isStr(v,max){return typeof v==='string' && (max===undefined || v.length<=max)}
function _isStrNonEmpty(v,max){return _isStr(v,max) && v.length>0}

var _VALIDATORS={
  therapist_profiles: function(v){
    if(!Array.isArray(v))return ['必须是数组'];var e=[];
    v.forEach(function(x,i){if(!_isPlainObject(x))e.push('['+i+']不是对象');else{if(!_isStrNonEmpty(x.id))e.push('['+i+'].id缺失');if(!_isStrNonEmpty(x.name))e.push('['+i+'].name缺失');}});
    return e;
  },
  patients: function(v){
    if(!Array.isArray(v))return ['必须是数组'];var e=[];
    v.forEach(function(x,i){
      if(!_isPlainObject(x))e.push('['+i+']不是对象');
      else{
        if(!_isStrNonEmpty(x.id))e.push('['+i+'].id缺失');
        if(!_isStrNonEmpty(x.patientId))e.push('['+i+'].patientId缺失');
        if(!_isStrNonEmpty(x.name))e.push('['+i+'].name缺失');
        if(typeof x.createdAt!=='number'||isNaN(x.createdAt))e.push('['+i+'].createdAt非法');
      }
    });
    return e;
  },
  assessments: function(v){if(!_isPlainObject(v))return['必须是对象'];var e=[];for(var k in v)if(v.hasOwnProperty(k)&&!_isPlainObject(v[k]))e.push(k+':不是对象');return e;},
  scales: function(v){if(!_isPlainObject(v))return['必须是对象'];var e=[];for(var k in v)if(v.hasOwnProperty(k)&&!Array.isArray(v[k]))e.push(k+':必须是数组');return e;},
  specialExams: function(v){if(!_isPlainObject(v))return['必须是对象'];var e=[];for(var k in v)if(v.hasOwnProperty(k)&&!Array.isArray(v[k]))e.push(k+':必须是数组');return e;},
  plans: function(v){if(!_isPlainObject(v))return['必须是对象'];var e=[];for(var k in v)if(v.hasOwnProperty(k)&&!_isPlainObject(v[k]))e.push(k+':不是对象');return e;},
  records: function(v){
    if(!Array.isArray(v))return ['必须是数组'];var e=[];
    v.forEach(function(x,i){
      if(!_isPlainObject(x))e.push('['+i+']不是对象');
      else{
        if(!_isStrNonEmpty(x.id))e.push('['+i+'].id缺失');
        if(!_isStrNonEmpty(x.patientId))e.push('['+i+'].patientId缺失');
        if(typeof x.timestamp!=='number'||isNaN(x.timestamp))e.push('['+i+'].timestamp非法');
      }
    });
    return e;
  },
  customExams: function(v){return Array.isArray(v)?[]:['必须是数组'];},
  customScales: function(v){return Array.isArray(v)?[]:['必须是数组'];},
  auditLog: function(v){return Array.isArray(v)?[]:['必须是数组'];},
  active_profile_id: function(v){return v===null||v===undefined||_isStr(v,100)?[]:['必须是字符串或null'];},
  userRole: function(v){return(v===null||v==='therapist'||v==='director'||v==='admin'||_isStr(v,50))?[]:['角色非法'];},
  pinHash: function(v){return _isStr(v,100)?[]:['必须是字符串'];},
  _schema_version: function(v){return(typeof v==='number'&&v>=0&&!isNaN(v))?[]:['必须是非负整数'];},
};

function validateData(k, v){
  var fn=_VALIDATORS[k];
  if(!fn)return {ok:true,warn:'未定义校验器'};
  try{var errs=fn(v);return (errs&&errs.length)?{ok:false,errors:errs}:{ok:true};}
  catch(e){return {ok:false,errors:['校验器异常: '+(e.message||e)]};}
}
