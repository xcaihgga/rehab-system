// ===== bootstrap.js auto-generated =====
// PWA Service Worker (自动检测更新 + 强制刷新)
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(function(reg){
    // 每30秒检查一次是否有新版本
    setInterval(function(){reg.update().catch(function(){});},30000);
    // 检测到新 SW 等待激活
    reg.addEventListener('updatefound',function(){
      var newSW=reg.installing;
      if(!newSW)return;
      newSW.addEventListener('statechange',function(){
        if(newSW.state==='installed'&&navigator.serviceWorker.controller){
          // 新版本已下载，显示更新提示
          var bar=document.createElement('div');
          bar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#3182ce;color:#fff;text-align:center;padding:12px;font-size:14px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)';
          bar.innerHTML='🔄 发现新版本 v3.9.3，点击刷新页面加载最新版本 ✅';
          bar.id='_sw_update_bar';
    bar.onclick=function(){
      if(typeof isDirty==='function' && isDirty()){
        if(!confirm('当前页面有未保存内容，刷新将丢失，确定更新版本吗？'))return;
      }
      newSW.postMessage('SKIP_WAITING');
      navigator.serviceWorker.addEventListener('controllerchange',function(){window.location.reload();});
      setTimeout(function(){window.location.reload();},3000);
    };
          document.body.appendChild(bar);
          // 自动延迟刷新（5秒后自动刷新）
          setTimeout(function(){
      if(typeof isDirty==='function' && isDirty()){
        var bar=document.getElementById('_sw_update_bar');
        if(bar){bar.style.background='#c0392b';bar.innerHTML='⚠️ 有未保存内容！请先保存，然后点击这里刷新更新版本';}
        var _tries=0;
        var _iv=setInterval(function(){
          if(!(typeof isDirty==='function' && isDirty()) || _tries++>120){
            clearInterval(_iv);
            try{
              newSW.postMessage('SKIP_WAITING');
              navigator.serviceWorker.addEventListener('controllerchange',function(){window.location.reload();});
              setTimeout(function(){window.location.reload();},3000);
            }catch(e){}
          }
        },500);
      }else{
        newSW.postMessage('SKIP_WAITING');
        navigator.serviceWorker.addEventListener('controllerchange',function(){window.location.reload();});
        setTimeout(function(){window.location.reload();},3000);
      }
    },5000);
        }
      });
    });
  }).catch(function(){});
  // 页面加载时主动触发一次更新检查
  navigator.serviceWorker.addEventListener('controllerchange',function(){
    // controller 变化时自动刷新（新 SW 已接管）
    if(!window._swReloading){
      window._swReloading=true;
      window.location.reload();
    }
  });
}
// PWA Install Prompt
var _deferredPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){
  e.preventDefault();
  _deferredPrompt=e;
  var banner=document.getElementById('pwa_install_banner');
  if(banner && !localStorage.getItem('pwa_dismissed')){
    banner.style.display='flex';
  }
});
window.addEventListener('appinstalled',function(){
  var banner=document.getElementById('pwa_install_banner');
  if(banner)banner.style.display='none';
  toast('安装成功！桌面已添加「康复评估」图标');
});
document.addEventListener('DOMContentLoaded',function(){
  var btn=document.getElementById('pwa_install_btn');
  var closeBtn=document.getElementById('pwa_install_close');
  if(btn){
    btn.onclick=function(){
      if(_deferredPrompt){
        _deferredPrompt.prompt();
        _deferredPrompt.userChoice.then(function(choice){
          if(choice.outcome==='accepted'){
            var banner=document.getElementById('pwa_install_banner');
            if(banner)banner.style.display='none';
          }
          _deferredPrompt=null;
        });
      }
    };
  }
  if(closeBtn){
    closeBtn.onclick=function(){
      var banner=document.getElementById('pwa_install_banner');
      if(banner)banner.style.display='none';
      localStorage.setItem('pwa_dismissed','1');
    };
  }
});
/* ========================= Storage Helpers ========================= */
/* 多标签冲突防护：标记本标签页写入的key，避免storage事件中误判 */
