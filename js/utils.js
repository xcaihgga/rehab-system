// ===== utils.js auto-generated =====
function pad(n){return n<10?'0'+n:''+n}
function fmtTime(ts){
  var d=new Date(ts);
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
}
function roundToHalfHour(ts){
  var d=new Date(ts);
  var m=d.getMinutes();
  d.setMinutes(m<30?0:30);
  d.setSeconds(0);
  return d.getTime();
}
function fmtTimeShort(ts){
  var d=new Date(ts);
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes());
}
function fmtDate(ts){
  var d=new Date(ts);
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
}
function todayStr(){
  var d=new Date();
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
}
function genRecordNo(ts){
  var d=new Date(ts);
  return 'TR-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function simpleHash(str){
  var h=5381,i;
  for(i=0;i<str.length;i++){h=((h<<5)+h)+str.charCodeAt(i);h=h&h}
  var hex=(h>>>0).toString(16);
  while(hex.length<16){hex='0'+hex}
  return hex.slice(0,16);
}
function escapeHtml(s){
  if(s==null)s='';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* toast & confirm modal */
function toast(msg){var t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove()},1800)}
/* guard save button against double-click race (sync & async) */
function wrapSaveEl(el){
  if(!el||!el.onclick)return;
  var orig=el.onclick;
  el.onclick=function(){
    if(el.dataset.busy)return;
    el.dataset.busy='1';el.disabled=true;
    var reset=function(){el.dataset.busy='';el.disabled=false};
    var r;
    try{r=orig.apply(this,arguments)}
    catch(e){reset();throw e}
    if(r&&typeof r.then==='function'){r.then(reset,reset)}
    else{
      // sync handler: add minimal visual lockout (150ms) to catch double-tap race
      setTimeout(reset,150);
    }
  };
}
function wrapSave(id){wrapSaveEl(document.getElementById(id))}
function confirmDialog(msg,cb){
  var mask=document.createElement('div');
  mask.className='modal-mask';
  mask.innerHTML='<div class="modal"><div class="modal-bd" style="padding:24px 16px;text-align:center;font-size:15px">'+escapeHtml(msg)+'</div><div class="modal-ft"><button class="btn btn-ghost" id="cfNo">取消</button><button class="btn btn-danger" id="cfYes">确定</button></div></div>';
  document.body.appendChild(mask);
  mask.querySelector('#cfNo').onclick=function(){mask.remove()};
  mask.querySelector('#cfYes').onclick=function(){mask.remove();cb()};
  mask.onclick=function(e){if(e.target===mask)mask.remove()};
}

/* ========================= Share Modal ========================= */
function showShareModal(title,text,key){
  var mask=document.createElement('div');
  mask.className='modal-mask';
  var html='<div class="modal" style="max-width:380px;max-height:85vh;overflow-y:auto">'+
    '<div class="modal-hd" style="padding:14px 16px;border-bottom:1px solid #edf2f7;font-size:15px;font-weight:600">'+escapeHtml(title)+'</div>'+
    '<div class="modal-bd" style="padding:16px">'+
    '<textarea id="share_text" style="width:100%;height:240px;font-size:12px;border:1px solid #e2e8f0;border-radius:6px;padding:8px;resize:none;box-sizing:border-box" readonly>'+escapeHtml(text)+'</textarea>'+
    '</div>'+
    '<div class="modal-ft" style="display:flex;gap:8px;padding:12px 16px">'+
      '<button class="btn btn-ghost" id="share_close" style="flex:1">关闭</button>'+
      '<button class="btn" id="share_copy" style="flex:1">📋 复制</button>'+
      '<button class="btn" id="share_img" style="flex:1;background:#38a169">🖼️ 导出图片</button>'+
    '</div>'+
    '<div style="padding:0 16px 12px;font-size:11px;color:#999;line-height:1.5">💡 如果导出图片出现乱码，请改用以下方式：<br>① 手机截屏本页面长按保存　② 点击「复制」粘贴到微信/备忘录　③ 设置页可导出Excel</div>'+
    '</div>';
  mask.innerHTML=html;
  document.body.appendChild(mask);
  mask.querySelector('#share_close').onclick=function(){mask.remove()};
  mask.querySelector('#share_copy').onclick=function(){
    var ta=mask.querySelector('#share_text');
    try{
      ta.select();
      document.execCommand('copy');
      toast('已复制到剪贴板');
    }catch(e){
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(function(){toast('已复制')}).catch(function(){toast('复制失败，请手动选择')});
      }else{toast('请手动选择文本复制')}
    }
  };
  mask.querySelector('#share_img').onclick=function(){
    // render text to canvas image（指定中文字体回退链，防止移动端 sans-serif 不含中文字形导致乱码）
    var CN_FONT='"PingFang SC","Microsoft YaHei","Heiti SC","Noto Sans CJK SC","WenQuanYi Micro Hei",sans-serif';
    var lines=text.split('\n');
    var canvas=document.createElement('canvas');
    var ctx=canvas.getContext('2d');
    var fontSize=14;
    var lineH=20;
    var padX=30,padY=30;
    var maxWidth=0;
    ctx.font=fontSize+'px '+CN_FONT;
    lines.forEach(function(line){
      var w=ctx.measureText(line).width;
      if(w>maxWidth)maxWidth=w;
    });
    canvas.width=Math.ceil(maxWidth)+padX*2;
    canvas.height=lines.length*lineH+padY*2+40;
    // background
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // title bar
    ctx.fillStyle='#3182ce';
    ctx.fillRect(0,0,canvas.width,36);
    ctx.fillStyle='#fff';
    ctx.font='bold 16px '+CN_FONT;
    ctx.textBaseline='alphabetic';
    ctx.fillText(title,padX,24);
    // text
    ctx.fillStyle='#333';
    ctx.font=fontSize+'px '+CN_FONT;
    var y=padY+36;
    lines.forEach(function(line){
      ctx.fillText(line,padX,y);
      y+=lineH;
    });
    // footer
    ctx.fillStyle='#999';
    ctx.font='11px '+CN_FONT;
    ctx.fillText('生成时间: '+fmtTime(Date.now()),padX,y+10);
    // download
    canvas.toBlob(function(blob){
      if(!blob){toast('⚠️ 图片生成失败，请用截屏或复制文本替代');return}
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url;
      a.download=title.replace(/[\s\/]/g,'_')+'_'+todayStr()+'.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_){}},5000);
      toast('图片已保存，如乱码请用截屏或复制文本');
      mask.remove();
    },'image/png');
  };
  mask.onclick=function(e){if(e.target===mask)mask.remove()};
}

/* ========================= Watermark ========================= */
function blobToDataURL(blob,cb){
  var fr=new FileReader();
  fr.onload=function(){cb(fr.result)};
  fr.readAsDataURL(blob);
}
function dataURLToBlob(dataURL){
  var arr=dataURL.split(','),mime=arr[0].match(/:(.*?);/)[1];
  var bstr=atob(arr[1]),n=bstr.length,u8=new Uint8Array(n);
  for(var i=0;i<n;i++){u8[i]=bstr.charCodeAt(i)}
  return new Blob([u8],{type:mime});
}

/* global to hold current capture before save */
var pendingCapture=null;

function addWatermark(imgURL,data,cb){
  var img=new Image();
  img.onload=function(){
    var canvas=document.createElement('canvas');
    var W=img.naturalWidth,H=img.naturalHeight;
    // limit max dimension for performance
    var maxDim=1600;
    var scale=1;
    if(W>maxDim||H>maxDim){scale=maxDim/Math.max(W,H)}
    canvas.width=Math.round(W*scale);
    canvas.height=Math.round(H*scale);
    var ctx=canvas.getContext('2d');
    ctx.drawImage(img,0,0,canvas.width,canvas.height);

    var barH=Math.max(120,Math.round(canvas.height*0.18));
    // frosted glass effect: capture bottom region into temp canvas, blur, then redraw
    var tmp=document.createElement('canvas');
    tmp.width=canvas.width;
    tmp.height=barH;
    var tctx=tmp.getContext('2d');
    tctx.drawImage(canvas,0,canvas.height-barH,canvas.width,barH,0,0,canvas.width,barH);
    ctx.filter='blur(8px)';
    ctx.drawImage(tmp,0,canvas.height-barH);
    ctx.filter='none';
    // overlay semi-transparent white
    ctx.fillStyle='rgba(255,255,255,0.12)';
    ctx.fillRect(0,canvas.height-barH,canvas.width,barH);
    // top frosted edge line
    ctx.fillStyle='rgba(255,255,255,0.35)';
    ctx.fillRect(0,canvas.height-barH,canvas.width,1.5);

    var pad=Math.round(canvas.width*0.03);
    var fontSize=Math.max(16,Math.round(barH/7.5));
    ctx.fillStyle='rgba(255,255,255,0.95)';
    ctx.font='600 '+fontSize+'px sans-serif';
    ctx.textBaseline='top';
    var lineH=Math.round(fontSize*1.35);
    var x=pad,y=canvas.height-barH+pad*0.6;

    var lines=[
      '📅 '+data.datetime,
      '📍 地点：'+data.location,
      '👨‍⚕️ 治疗师：'+data.therapist+'    🧑 患者：'+data.patient,
      '🏷 类型：'+data.type+'    编号：'+data.recordNo
    ];
    for(var i=0;i<lines.length;i++){
      ctx.fillText(lines[i],x,y+i*lineH);
    }
    // right side small brand
    ctx.font='400 '+Math.round(fontSize*0.7)+'px sans-serif';
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.textAlign='right';
    ctx.fillText('治疗师拍照记录系统',canvas.width-pad,y);

    canvas.toBlob(function(blob){cb(blob,canvas.toDataURL('image/jpeg',0.85))},'image/jpeg',0.9);
  };
  img.onerror=function(){toast('图片加载失败')};
  img.src=imgURL;
}

/* ========================= Router ========================= */
