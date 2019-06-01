var utils = module.exports;

// control variable of func "myPrint"
var isPrintFlag = false;
// var isPrintFlag = true;

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function(cb) {
  if(!!cb && typeof cb === 'function') {
    cb.apply(null, Array.prototype.slice.call(arguments, 1));
  }
};

/**
 * clone an object
 */
utils.clone = function(origin) {
  if(!origin) {
    return;
  }

  var obj = {};
  for(var f in origin) {
    if(origin.hasOwnProperty(f)) {
      obj[f] = origin[f];
    }
  }
  return obj;
};

utils.size = function(obj) {
  if(!obj) {
    return 0;
  }

  var size = 0;
  for(var f in obj) {
    if(obj.hasOwnProperty(f)) {
      size++;
    }
  }

  return size;
};

// print the file name and the line number ~ begin
function getStack(){
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack) {
    return stack;
  };
  var err = new Error();
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}

function getFileName(stack) {
  return stack[1].getFileName();
}

function getLineNumber(stack){
  return stack[1].getLineNumber();
}

utils.myPrint = function() {
  if (isPrintFlag) {
    var len = arguments.length;
    if(len <= 0) {
      return;
    }
    var stack = getStack();
    var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
    for(var i = 0; i < len; ++i) {
      aimStr += arguments[i] + ' ';
    }
    console.log('\n' + aimStr);
  }
};
// print the file name and the line number ~ end
utils.random6num = function(){
	var Num = '';
	for(var i=0;i<6;i++) {
		Num += Math.floor(Math.random()*10);
	}
	return Num;
};

utils.get_random_num = function(minNum,maxNum){
	switch(arguments.length){
		case 1:
			return parseInt(Math.random()*minNum+1,10);
			break;
		case 2:
			return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10);
			break;
		default:
			return 0;
			break;
	}
};

utils.get_uuid = function(){
	var uuid = Date.now() + "" + Math.round(Math.random() * 10000);
	return uuid.substring(0,16);
};

utils.get_up8_flag = function(score){
	if(score >= 43){
		return true;
	}
	return false;
};

utils.pushMessage = function(rid,channel,param,cache){
	param['uuid'] = utils.get_uuid();
	channel.pushMessage(param);
	var cacheData = cache.get(rid);
	console.log('cacheData update before',cacheData,cache);
	cacheData.channelMsg.push(param);
	cache.put(rid,cacheData);
	console.log('cacheData update after',cacheData);
};
/*找到下一个有效的玩家位置*/
utils.get_next_location = function(room_info,cur_local){
	var zhuang_id = cur_local + 1;
	while(true){
		if(zhuang_id > 4){
			zhuang_id = 1;
		}
		if(room_info['location' + zhuang_id] != null && room_info['location' + zhuang_id] != 'null'){
			break;
		}
		zhuang_id = zhuang_id + 1;
	}
	return zhuang_id;
};