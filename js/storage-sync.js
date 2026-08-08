// ===== storage-sync.js auto-generated =====
var _selfWriteKeys={};
function _markSelfWrite(k){_selfWriteKeys[k]=Date.now();setTimeout(function(){delete _selfWriteKeys[k]},800)}
function _isSelfWrite(k){return !!(k&&_selfWriteKeys[k]&&(Date.now()-_selfWriteKeys[k]<1000))}

/* 跨标签数据同步：防抖+节流+详细日志+page-load断言 */
var _tabReloading=false;
var _lastTabToast=0;
var _tabSyncKeys={};
var _tabSyncTimer=null;
var _tabSyncBatchStart=0;
var _tabEventCount=0;
var _pageLoadCount=0;
var _lastPageLoadLog=0;
function _tabLog(action,detail){
  var ts=new Date().toISOString().slice(11,23);
  var elapsed=_tabSyncBatchStart?(Date.now()-_tabSyncBatchStart)+'ms':'0ms';
  console.log('[tab-sync]['+ts+'] '+action+(detail?' | '+detail:'')+(action==='flush'?' | batchElapsed='+elapsed:''));
}
function _tabToast(msg,throttle){
  var now=Date.now();
  if(throttle&&(now-_lastTabToast)<throttle){
    _tabLog('toast-throttled','跳过重复toast，距上次'+(now-_lastTabToast)+'ms < '+throttle+'ms');
    return;
  }
  _lastTabToast=now;
  _tabLog('toast-shown',msg.slice(0,40));
  toast(msg);
}
window.addEventListener('storage',function(e){
  if(!e||!e.key)return;
  if(DATA_KEYS.indexOf(e.key)<0&&e.key!==SCHEMA_KEY)return;
  if(_isSelfWrite(e.key)){_tabLog('self-write-skip',e.key);return}
  _tabEventCount++;
  if(_tabSyncBatchStart===0)_tabSyncBatchStart=Date.now();
  _tabLog('event','#'+_tabEventCount+' key='+e.key+' path='+location.hash+' dirty='+isDirty());
  _tabSyncKeys[e.key]=true;
  _tabLog('batch-keys','当前合并: ['+Object.keys(_tabSyncKeys).join(', ')+']');
  if(_tabReloading){_tabLog('debounce-lock','_tabReloading=true，等待当前防抖完成');return}
  if(isDirty()){
    var banner=document.getElementById('tab_conflict_banner');
    if(!banner){
      _tabLog('dirty-create-banner','创建红色横幅（首次）');
      _tabToast('⚠️ 检测到其他标签页已修改数据，当前页面有未保存内容！',2000);
      banner=document.createElement('div');
      banner.id='tab_conflict_banner';
      banner.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;background:#c53030;color:#fff;padding:8px 12px;font-size:13px;text-align:center;cursor:pointer';
      banner.textContent='⚠️ 数据冲突：其他标签页已修改，请先保存当前编辑或点此刷新';
      banner.onclick=function(){
        if(confirmIfDirty('当前有未保存内容，刷新将丢失，确定？')){
          _tabReloading=true;location.reload();
        }
      };
      document.body.appendChild(banner);
    }else{
      _tabLog('dirty-banner-exists','横幅已存在，不重复创建');
    }
  }else{
    var banner2=document.getElementById('tab_conflict_banner');
    if(banner2){_tabLog('clean-remove-banner','移除残留横幅');banner2.remove()}
    _tabReloading=true;
    if(_tabSyncTimer)clearTimeout(_tabSyncTimer);
    _tabSyncTimer=setTimeout(function(){
      var changedKeys=Object.keys(_tabSyncKeys);
      var batchElapsed=Date.now()-_tabSyncBatchStart;
      _tabLog('flush','合并 '+changedKeys.length+' keys: ['+changedKeys.join(', ')+'] | 总耗时='+batchElapsed+'ms | 事件数='+_tabEventCount);
      _tabReloading=false;
      _tabSyncKeys={};
      _tabSyncBatchStart=0;
      _tabEventCount=0;
      if(changedKeys.length>0){
        _tabToast('🔄 检测到其他标签页更新了 '+changedKeys.length+' 项数据，已自动刷新',2000);
        var cur=location.hash.slice(1)||'/home';
        route(cur);
      }
    },300);
    _tabLog('debounce-schedule','300ms 防抖已安排，等待后续事件合并');
  }
});
/* 页面从后台切到前台时，也触发一次数据刷新检查（部分浏览器storage事件在后台时延迟） */
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='visible'){
    _tabLog('visibility-visible','isDirty='+isDirty()+' _tabReloading='+_tabReloading);
    if(!isDirty()&&!_tabReloading){
      var banner=document.getElementById('tab_conflict_banner');
      if(banner){_tabLog('visibility-remove-banner','');banner.remove()}
      var cur=location.hash.slice(1)||'/home';
      route(cur);
    }
  }
});
/* 页面加载：变量重置(每次必执行) + 日志限流(5秒) + 残留警告(不受限流) */
window.addEventListener('load',function(){
  _pageLoadCount++;
  var now=Date.now();
  var ts=new Date().toISOString().slice(11,23);
  var preCheck={
    _tabReloading:_tabReloading,
    _tabSyncKeys:Object.keys(_tabSyncKeys),
    _tabSyncTimer:_tabSyncTimer,
    _tabSyncBatchStart:_tabSyncBatchStart,
    _tabEventCount:_tabEventCount
  };
  var hasResidual=_tabReloading||Object.keys(_tabSyncKeys).length>0||_tabSyncTimer!==null||_tabSyncBatchStart!==0||_tabEventCount!==0;
  _tabReloading=false;
  _tabSyncKeys={};
  if(_tabSyncTimer){clearTimeout(_tabSyncTimer);_tabSyncTimer=null}
  _tabSyncBatchStart=0;
  _tabEventCount=0;
  var allClean=_tabReloading===false&&Object.keys(_tabSyncKeys).length===0&&_tabSyncTimer===null&&_tabSyncBatchStart===0&&_tabEventCount===0;
  if(hasResidual){
    console.log('[tab-sync]['+ts+'] page-load-WARNING | ⚠️ 第'+_pageLoadCount+'次加载发现残留状态! preCheck='+JSON.stringify(preCheck)+' | 已强制重置, allClean='+allClean);
    _lastPageLoadLog=now;
    return;
  }
  if(now-_lastPageLoadLog<5000){
    console.log('[tab-sync]['+ts+'] page-load-suppressed | 第'+_pageLoadCount+'次加载，5秒内跳过详细日志（变量已重置, allClean='+allClean+'）');
    return;
  }
  _lastPageLoadLog=now;
  console.log('[tab-sync]['+ts+'] page-load-pre-check | 加载前内存状态: '+JSON.stringify(preCheck));
  console.log('[tab-sync]['+ts+'] page-load-post-check | 重置后内存状态: allClean='+allClean);
  _tabLog('page-load','第'+_pageLoadCount+'次加载 | 内存变量重置='+(allClean?'✅全部清空':'❌残留')+' | 防抖从零开始');
});

var LS = {
  get:function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},
  set:function(k,v){
    try{
      _markSelfWrite(k);
      localStorage.setItem(k,JSON.stringify(v));
      return true;
    }catch(e){
      if(e.name==='QuotaExceededError'||e.code===22||e.code===1014){
        toast('⚠️ 存储空间已满，无法保存！请导出备份后清理旧数据');
      }else{
        toast('⚠️ 保存失败：'+e.message);
      }
      return false;
    }
  },
  del:function(k){_markSelfWrite(k);localStorage.removeItem(k)}
};

/* IndexedDB for photos */
var DB = {
  db:null,
  ready:null,
  init:function(){
    var self=this;
    this.ready=new Promise(function(resolve,reject){
      var req=indexedDB.open('TherapyRecordDB',1);
      req.onupgradeneeded=function(e){
        var db=e.target.result;
        if(!db.objectStoreNames.contains('photos')){
          db.createObjectStore('photos',{keyPath:'id'});
        }
      };
      req.onsuccess=function(e){self.db=e.target.result;resolve(self.db)};
      req.onerror=function(e){reject(e.target.error)};
    });
    return this.ready;
  },
  putPhoto:function(id,blob){
    // Require image/* type to prevent arbitrary blob storage / XSS via blob: URLs
    if(!blob||!(blob instanceof Blob)){
      return Promise.reject(new Error('putPhoto: invalid blob'));
    }
    if(blob.type&&blob.type.indexOf('image/')!==0){
      return Promise.reject(new Error('putPhoto: only image/* allowed, got '+blob.type));
    }
    return this.ready.then(function(db){
      return new Promise(function(resolve,reject){
        var tx=db.transaction('photos','readwrite');
        tx.objectStore('photos').put({id:id,blob:blob});
        tx.oncomplete=function(){resolve()};
        tx.onerror=function(){reject(tx.error)};
        tx.onabort=function(){reject(tx.error||new Error('tx aborted'))};
      });
    });
  },
  getPhoto:function(id){
    return this.ready.then(function(db){
      return new Promise(function(resolve,reject){
        var tx=db.transaction('photos','readonly');
        var r=tx.objectStore('photos').get(id);
        r.onsuccess=function(){resolve(r.result?r.result.blob:null)};
        r.onerror=function(){reject(r.error)};
      });
    });
  },
  getAllPhotoIds:function(){
    return this.ready.then(function(db){
      return new Promise(function(resolve,reject){
        var tx=db.transaction('photos','readonly');
        var r=tx.objectStore('photos').getAllKeys();
        r.onsuccess=function(){resolve(r.result||[])};
        r.onerror=function(){reject(r.error)};
      });
    });
  },
  delPhoto:function(id){
    return this.ready.then(function(db){
      return new Promise(function(resolve,reject){
        var tx=db.transaction('photos','readwrite');
        tx.objectStore('photos').delete(id);
        tx.oncomplete=function(){resolve()};
        tx.onerror=function(){reject(tx.error)};
      });
    });
  },
  clear:function(){
    return this.ready.then(function(db){
      return new Promise(function(resolve,reject){
        var tx=db.transaction('photos','readwrite');
        tx.objectStore('photos').clear();
        tx.oncomplete=function(){resolve()};
        tx.onerror=function(){reject(tx.error)};
      });
    });
  }
};
DB.init().catch(function(err){
  console.error('[ERR-C1] DB.init 照片存储初始化失败:', err.message||err);
});