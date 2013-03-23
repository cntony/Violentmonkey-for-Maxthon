function $(i){return document.getElementById(i);}
var N=$('main'),L=$('sList'),O=$('overlay'),ids,map={};
function split(t){return t.replace(/^\s+|\s+$/g,'').split(/\s*\n\s*/).filter(function(e){return e;});}
function fillHeight(e,b,p){
	if(p==undefined) p=e.parentNode;
	b=b?b.offsetTop+b.offsetHeight:0;
	e.style.pixelHeight=e.offsetHeight+window.getComputedStyle(p).pixelHeight-b;
}
function fillWidth(e,p){
	if(p==undefined) p=e.parentNode;
	e.style.pixelWidth=e.offsetWidth+window.getComputedStyle(p).pixelWidth-e.offsetLeft-e.offsetWidth;
}

// Main options
function updateMove(d){
	if(!d) return;
	var b=d.querySelectorAll('.move');
	b[0].disabled=!d.previousSibling;
	b[1].disabled=!d.nextSibling;
}
function allowUpdate(n){return n.update&&n.meta.updateURL&&n.meta.downloadURL;}
function getIcon(n){
	var i=cache[n.meta.icon];
	return i?'data:image/x;base64,'+i:'icons/icon_64.png';
}
function loadItem(d,n,m){
	if(typeof n=='string') return;
	d.innerHTML='<img class=icon src="'+getIcon(n)+'">'
	+'<a class="name ellipsis" target=_blank></a>'
	+'<span class=author></span>'
	+'<span class=version>'+(n.meta.version?'v'+n.meta.version:'')+'</span>'
	+(allowUpdate(n)?'<a data=update class=update href=#>'+_('Check for updates')+'</a> ':'')
	+'<div class="descrip ellipsis"></div>'
	+'<span class=message></span>'
	+'<div class=panel>'
		+'<button data=edit>'+_('Edit')+'</button> '
		+'<button data=enable>'+_(n.enabled?'Disable':'Enable')+'</button> '
		+'<button data=remove>'+_('Remove')+'</button>'
		+'<button data=up class=move>'+_('&uarr;')+'</button>'
		+'<button data=down class=move>'+_('&darr;')+'</button>'
	+'</div>';
	d.className=n.enabled?'':'disabled';
	with(d.querySelector('.name')) {
		var name=n.custom.name||n.meta.name;
		title=name||'';
		var h=n.custom.homepage||n.meta.homepage;
		if(h) href=h;
		innerHTML=name?name.replace(/&/g,'&amp;').replace(/</g,'&lt;'):'<em>'+_('Null name')+'</em>';
	}
	if(n.meta.author) d.querySelector('.author').innerText=_('Author: ')+n.meta.author;
	with(d.querySelector('.descrip')) innerText=title=n.meta.description||'';
	if(m) d.querySelector('.message').innerHTML=m;
}
function addItem(n){
	var d=document.createElement('div');
	loadItem(d,n);
	L.appendChild(d);
	return d;
}
function moveUp(i,p){
	var x=ids[i];
	ids[i]=ids[i-1];
	ids[i-1]=x;
	L.insertBefore(p,p.previousSibling);
	rt.post('SetOption',{key:'ids',wkey:'ids',data:ids});
	updateMove(p);updateMove(p.nextSibling);
}
L.onclick=function(e){
	var o=e.target,d=o.getAttribute('data'),p;
	if(!d) return;
	e.preventDefault();
	for(p=o;p&&p.parentNode!=L;p=p.parentNode);
	var i=Array.prototype.indexOf.call(L.childNodes,p);
	switch(d){
		case 'edit':
			edit(i);
			break;
		case 'enable':
			e=map[ids[i]];
			if(e.enabled=!e.enabled) {
				p.classList.remove('disabled');
				o.innerText=_('Disable');
			} else {
				p.classList.add('disabled');
				o.innerText=_('Enable');
			}
			rt.post('SaveScript',e);
			break;
		case 'remove':
			rt.post('RemoveScript',i);
			delete map[ids.splice(i,1)[0]];
			L.removeChild(p);
			if(i==L.childNodes.length) i--;
			updateMove(L.childNodes[i]);
			break;
		case 'update':
			check(i);
			break;
		case 'up':
			if(p.previousSibling) moveUp(i,p);
			break;
		case 'down':
			if(p.nextSibling) moveUp(i+1,p.nextSibling);
			break;
	}
};
rt.listen('GotScript',function(o){
	ids.push(o.id);o=addItem(map[o.id]=o);
	updateMove(o);updateMove(o.previousSibling);
});
$('bNew').onclick=function(){rt.post('NewScript');};
$('bUpdate').onclick=function(){
	for(var i=0;i<ids.length;i++) if(allowUpdate(map[ids[i]])) check(i);
};
$('cDetail').onchange=function(){L.classList.toggle('simple');rt.post('SetOption',{key:'showDetails',data:this.checked});};
var panel=N;
function switchTo(D){
	panel.classList.add('hide');D.classList.remove('hide');panel=D;
}
var dialogs=[];
function showDialog(D,z){
	if(!dialogs.length) {
		O.classList.remove('hide');
		setTimeout(function(){O.classList.add('overlay');},1);
	}
	if(!z) z=dialogs.length?dialogs[dialogs.length-1].zIndex+1:1;
	dialogs.push(D);
	O.style.zIndex=D.style.zIndex=D.zIndex=z;
	D.classList.remove('hide');
	D.style.top=(window.innerHeight-D.offsetHeight)/2+'px';
	D.style.left=(window.innerWidth-D.offsetWidth)/2+'px';
}
function closeDialog(){
	dialogs.pop().classList.add('hide');
	if(dialogs.length) O.style.zIndex=dialogs.length>1?dialogs[dialogs.length-1]:1;
	else {
		O.classList.remove('overlay');
		setTimeout(function(){O.classList.add('hide');},500);
	}
}
O.onclick=function(){
	if(dialogs.length) (dialogs[dialogs.length-1].close||closeDialog)();
};
function confirmCancel(dirty){
	return !dirty||confirm(_('Modifications are not saved!'));
}
function bindChange(e,d){
	function change(){d.forEach(function(i){i.dirty=true;});}
	e.forEach(function(i){i.onchange=change;});
}
initFont();
window.addEventListener('DOMContentLoaded',function(){
	var nodes=document.querySelectorAll('.i18n'),c,s,i,j;
	for(i=0;i<nodes.length;i++)
		nodes[i].innerHTML=_(nodes[i].innerHTML);
},true);

// Advanced
var A=$('advanced');
$('bAdvanced').onclick=function(){showDialog(A);};
$('cInstall').onchange=function(){rt.post('SetOption',{key:'installFile',data:this.checked});};
$('bDefSearch').onclick=function(){$('tSearch').value=_('Search$1');};
$('aExport').onclick=function(){showDialog(X);xLoad();};
$('aImport').onchange=function(e){
	var i,f,files=e.target.files;
	for(i=0;f=files[i];i++) {
		var r=new FileReader();
		r.onload=function(e){rt.post('ImportZip',btoa(e.target.result));};
		r.readAsBinaryString(f);
	}
};
rt.listen('ShowMessage',function(o){alert(o);});
$('aVacuum').onclick=function(){rt.post('Vacuum');};
rt.listen('Cleared',function(){window.location.reload();});
$('aClear').onclick=function(){
	if(confirm(_('All data of Violentmonkey will be cleared! Do you want to continue?'))) rt.post('Clear');
};
rt.listen('Vacuumed',function(){var t=$('aVacuum');t.innerHTML=_('Data vacuumed');t.disabled=true;});
A.close=$('aClose').onclick=function(){
	rt.post('SetOption',{key:'search',data:$('tSearch').value});
	rt.post('SetOption',{key:'gExc',wkey:'gExc',data:split($('tExclude').value)});
	closeDialog();
};

// Export
var X=$('export'),xL=$('xList'),xE=$('bExport');
function xLoad() {
	xL.innerHTML='';xE.disabled=false;xE.innerHTML=_('Export');
	ids.forEach(function(i){
		var d=document.createElement('div');
		d.className='ellipsis';
		d.innerText=d.title=map[i].meta.name;
		xL.appendChild(d);
	});
}
xL.onclick=function(e){
	var t=e.target;
	if(t.parentNode!=this) return;
	t.classList.toggle('selected');
};
$('bSelect').onclick=function(){
	var c=xL.childNodes,v,i;
	for(i=0;i<c.length;i++) if(!c[i].classList.contains('selected')) break;
	v=i<c.length;
	for(i=0;i<c.length;i++) if(v) c[i].classList.add('selected'); else c[i].classList.remove('selected');
};
xE.onclick=function(){
	this.disabled=true;this.innerHTML=_('Exporting...');
	var z=new JSZip(),n,_n,names={},c,i,j,vm={};
	for(i=0;i<ids.length;i++)
		if(xL.childNodes[i].classList.contains('selected')) {
			c=map[ids[i]];
			n=_n=c.custom.name||c.meta.name||'Noname';j=0;
			while(names[n]) n=_n+(++j);names[n]=1;n+='.user.js';
			z.file(n,c.code);
			vm[n]={id:ids[i],custom:c.custom,enabled:c.enabled,update:c.update};
		}
	z.file('ViolentMonkey',JSON.stringify(vm));
	n=z.generate({compression:'DEFLATE'});
	window.open('data:application/zip;base64,'+n);
	X.close();
};
X.close=$('bClose').onclick=closeDialog;

// Update checker
function canUpdate(o,n){
	o=(o||'').split('.');n=(n||'').split('.');
	var r=/(\d*)([a-z]*)(\d*)([a-z]*)/i;
	while(o.length&&n.length) {
		var vo=o.shift().match(r),vn=n.shift().match(r);
		vo.shift();vn.shift();	// origin string
		vo[0]=parseInt(vo[0]||0,10);
		vo[2]=parseInt(vo[2]||0,10);
		vn[0]=parseInt(vn[0]||0,10);
		vn[2]=parseInt(vn[2]||0,10);
		while(vo.length&&vn.length) {
			var eo=vo.shift(),en=vn.shift();
			if(eo!=en) return eo<en;
		}
	}
	return n.length;
}
function check(i){
	var l=L.childNodes[i],s=map[ids[i]],o=l.querySelector('[data=update]'),m=l.querySelector('.message');
	m.innerHTML=_('Checking for updates...');
	o.classList.add('hide');
	function update(){
		m.innerHTML=_('Updating...');
		req=new window.XMLHttpRequest();
		req.open('GET', s.meta.downloadURL, true);
		req.onload=function(){
			rt.listen('UpdatedScript'+s.id,function(r){if(r) m.innerHTML=r;});
			rt.post('ParseScript',{source:'UpdatedScript'+s.id,data:{status:req.status,code:req.responseText,id:s.id}});
			o.classList.remove('hide');
		};
		req.send();
	}
	var req=new window.XMLHttpRequest();
	req.open('GET', s.meta.updateURL, true);
	req.onload=function(){
		try {
			rt.listen('ParsedMeta'+s.id,function(r){
				if(canUpdate(s.meta.version,r.version)) return update();
				m.innerHTML=_('No update found.');
				o.classList.remove('hide');
			});
			rt.post('ParseMeta',{source:'ParsedMeta'+s.id,code:req.responseText});
		} catch(e) {
			m.innerHTML=_('Failed fetching update information.');
			console.log(e);
			o.classList.remove('hide');
		}
	};
	req.send();
}

// Script Editor
var E=$('editor'),U=$('eUpdate'),H=$('mURL'),M=$('meta'),I=$('mName'),
    mI=$('mInclude'),mE=$('mExclude'),mM=$('mMatch'),
    cI=$('cInclude'),cE=$('cExclude'),cM=$('cMatch'),T=null,
		eS=$('eSave'),eSC=$('eSaveClose');
CodeMirror.keyMap.vm={
	'Esc':'close',
	'Ctrl-S':'save',
	'fallthrough':'default'
};
function edit(i){
	switchTo(E);E.scr=map[ids[i]];E.cur=L.childNodes[i];
	U.checked=E.scr.update;H.value=E.scr.custom.homepage||'';
	if(!T) T=CodeMirror.fromTextArea($('eCode'),{
		lineNumbers:true,
		matchBrackets:true,
		mode:'text/typescript',
		lineWrapping:true,
		indentUnit:4,
		indentWithTabs:true,
		extraKeys:{"Enter":"newlineAndIndentContinueComment"},
		keyMap:'vm'
	});
	T.on('change',function(){eS.disabled=eSC.disabled=T.isClean();});
	fillHeight(T.display.wrapper,T.display.wrapper.nextElementSibling);
	T.setValue(E.scr.code);T.markClean();T.getDoc().clearHistory();
	eS.disabled=eSC.disabled=true;T.focus();
}
function eSave(){
	E.scr.update=U.checked;E.scr.custom.homepage=H.value;
	rt.post('ParseScript',{source:'ModifiedScript',data:{code:T.getValue(),id:E.scr.id}});
	eS.disabled=eSC.disabled=true;
}
function eClose(){switchTo(N);E.cur=E.scr=null;}
bindChange([U,H],[E]);
$('custom').onclick=function(){
	var e=[],c=E.scr.custom;M.dirty=false;
	showDialog(M,10);fillWidth(I);fillWidth(H);
	I.value=c.name||'';
	H.value=c.homepage||'';
	switch(c['run-at']){
		case 'document-start':R.value='start';break;
		case 'document-body':R.value='body';break;
		case 'document-end':R.value='end';break;
		default:R.value='default';
	}
	cI.checked=c._include!=false;
	mI.value=(c.include||e).join('\n');
	cM.checked=c._match!=false;
	mM.value=(c.match||e).join('\n');
	cE.checked=c._exclude!=false;
	mE.value=(c.exclude||e).join('\n');
};
bindChange([I,H,mI,mM,mE,cI,cM,cE],[M]);
M.close=function(){if(confirmCancel(M.dirty)) closeDialog();};
$('mCancel').onclick=closeDialog;
$('mOK').onclick=function(){
	if(M.dirty) {
		var c=E.scr.custom;
		c.name=I.value;
		c.homepage=H.value;
		switch(R.value){
			case 'start':c['run-at']='document-start';break;
			case 'body':c['run-at']='document-body';break;
			case 'end':c['run-at']='document-end';break;
			default:delete c['run-at'];
		}
		c._include=cI.checked;
		c.include=split(mI.value);
		c._match=cM.checked;
		c.match=split(mM.value);
		c._exclude=cE.checked;
		c.exclude=split(mE.value);
		loadItem(E.cur,E.scr);
		updateMove(E.cur);
		rt.post('SaveScript',E.scr);
	}
	closeDialog();
};
eS.onclick=eSave;
eSC.onclick=function(){eSave();eClose();};
CodeMirror.commands.save=function(){if(!eS.disabled) setTimeout(eSave,0);};
CodeMirror.commands.close=E.close=$('eClose').onclick=function(){if(confirmCancel(!eS.disabled)) eClose();};

// Load at last
fillHeight(L,$('footer'),document.body);
var ids,map,cache;
rt.listen('GotOptions',function(o){
	ids=o.ids;map=o.map;cache=o.cache;L.innerHTML='';
	ids.forEach(function(i){addItem(map[i]);});
	updateMove(L.firstChild);updateMove(L.lastChild);
	$('cInstall').checked=JSON.parse(o.installFile);
	$('tSearch').value=o.search;
	$('tExclude').value=o.gExc.join('\n');
	if(!($('cDetail').checked=JSON.parse(o.showDetails))) L.classList.add('simple');
});
rt.post('GetOptions',{installFile:0,search:0,showDetails:0});
rt.listen('UpdateItem',function(o){
	var i=o.data,p=L.childNodes[i],n=o.obj;map[n.id]=n;
	switch(o.cmd){
		case 'add':ids.push(n.id);addItem(n);updateMove(L.childNodes[i-1]);break;
		case 'update':loadItem(p,n,o.message);break;
	}
	updateMove(L.childNodes[i]);
});