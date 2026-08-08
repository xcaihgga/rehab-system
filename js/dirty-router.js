// ===== dirty-router.js auto-generated =====
var routes={};
// Dirty-form guard (for assessment/special-exam/scale/plan pages).
// Call `markDirty(id)` on any form input change; `clearDirty()` on save.
// Router/hashchange will prompt before navigation if dirty.
var _dirtyId=null,_dirtyMsg='当前页面有未保存的内容，离开将丢失，确定？';
function markDirty(id){_dirtyId=id||'any'}
function clearDirty(){_dirtyId=null}
function isDirty(){return _dirtyId!==null}
function confirmIfDirty(msg){if(!isDirty())return true;return confirm(msg||_dirtyMsg)}
/* Attach markDirty listeners to all form inputs (input/select/textarea/radio/checkbox) within root (selector or element). Caller still needs clearDirty on save. */
function bindDirtyGuard(root){
  var el=root;if(typeof root==='string')el=document.getElementById(root);
  if(!el)return;
  var sel='input,select,textarea,[data-rom-active],[data-rom-passive],[data-rom-joint],[data-muscle-group],[data-muscle-note],[data-muscle-grade],[data-adl],[data-plan-goal],[data-plan-freq],[data-plan-freqc],[data-plan-notes]';
  el.querySelectorAll(sel).forEach(function(n){
    n.addEventListener('change',function(){markDirty('form')},true);
    n.addEventListener('input',function(){markDirty('form')},true);
    n.addEventListener('click',function(){if(n.tagName==='LABEL'||n.type==='radio'||n.type==='checkbox')markDirty('form')},true);
  });
  // pill buttons (adl / mpq):
  el.querySelectorAll('.pill,[data-mpq-e],[data-mpq-sa],[data-mpq-af]').forEach(function(n){
    n.addEventListener('click',function(){markDirty('form')});
  });
}

/* ========================= Global Error Boundary ========================= */
var _lastError=null;
// 路由 handler 异常时渲染错误页，避免白屏
