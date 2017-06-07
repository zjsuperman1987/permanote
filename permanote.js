//一些贯穿始终的变量
var editor, statusline, savebutton, idletimer;

// 首次载入应用
window.onload = function() {
	//第一次载入时初始化本地存储
	if(localStorage.note == null) localStorage.note = "";
	if(localStorage.lastModified == null) localStorage.lastModified = 0;
	if(localStorage.lastSaved == null) localStorage.lastSaved = 0;

	// 查找编辑器UI元素，并初始话全局变量
	editor = document.getElementById("editor");
	statusline = document.getElementById("statusline");
	savebutton = document.getElementById("savebutton");

	editor.value = localStorage.note //初始化编辑器，将保存的笔记数据填充为其能容
	editor.disabled = true;			//同步前禁止编辑

	// 一旦文本区有内容输入
	editor.addEventListener('input', function(e){
		//将新的值保存在localStorage中
		localStorage.note = editor.value;
		localStorage.lastModified = Date.now();
		// 重置闲置定时器 
		if(idletimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(save,5000);
		//启用保存按钮
		savebutton.disabled = false;
	}, false)

		//每次载入应用程序时尝试同步服务器
		sync();
};

//离开页面前保存数据到服务器
window.onbeforeunload = function() {
	if(localStorage.lastModified > localStorage.lastSaved)
		save();
};

// 离线时通知用户
window.onoffline = function(){status("Offline");}

//再次返回在线状态时，进行同步
window.ononline = function(){sync();};

// 当有新版本应用的时候提醒用户
// 这里我们也可以采用localStorage.reload()方法来强制重新载入应用
window.applicationCache.onupdateready = function() {
	status("A new version of this application is available. Reload to run it");
};

// 当没有新版本的时候也通知用户
window.applicationCache.onnoupdate = function() {
	status("You are running the latest version of the application.");
};

function status(msg) {statusline.innerHTML = msg;}

// 每当笔记内容更新后· 当用户输入停止超过5分钟。
// 就会自动将笔记文本上传到服务器(在线状态下)
function save(){
	if(idletimer) clearTimeout(idletimer);
	diletimer = null;
	if(navigator.onLine) {
		var xhr = new XMLHttpRequest();
		xhr.open("PUT","/note");
		xhr.send(editor.value);
		xhr.onload = function() {
			localStorage.lastSaved = Date.now();
			savebutton.disabled = true;
		}
	}
}

// 检查服务器是否有新版本的笔记
// 如果没有，则将当前版本保存到服务器
function sync() {
	if(navigator.onLine) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "/note");
		xhr.send();
		xhr.onload = function() {
			var remoteModTime = 0;
			if(xhr.status == 200) {
				var remoteModTime = xhr.getResponseHeader("Last-Modified");
				remoteModTime = new Date(remoteModTime).getTime();
			}

			if(remoteModTime > localStorage.lastModified) {
				status("Newer note found on server");
				var useit = confirm("There is a newer version of the note\n" +
									"on the server. Click Ok to user that version\n" +
									"or click Cancel to continue editing this\n" +
									"version and overwrite the server");
				var now = Date.now();
				if(useit) {
					editor.value = localStorage.note = xhr.responseText;
					localStorage.lastSaved = now;
					status("Newest version downloaded");
				}else
					status("Ignoring newer version of hte note.");
				 localStorage.lastModified = now;	
			}else
				status("You are editing the current version of the note.");
			if(localStorage.lastModified > localStorage.lastSaved) {
				save();
			}
			editor.disabled = false;	//再次启用编辑器
			editor.focus();				//将光标定位到编辑器中	
		}
	}else {	//离线状态下不能同步
		status("Can't sync while offline");
		editor.disabled = false;
		editor.focus();
	}

}
