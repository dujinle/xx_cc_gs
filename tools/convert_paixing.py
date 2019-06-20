#!/usr/bin/python
#-*- coding:utf-8 -*-
import sys
def open_file(file):

	dicts = dict();
	fp = open(file,'r');
	while True:
		line = fp.readline();
		if not line:break;
		line = line.strip('\r\n');
		arrs = line.split(' ');
		if len(arrs) != 2: continue;
		dicts[arrs[0]] = arrs[1];
	fp.close();

	idx = 0;
	for key in dicts.keys():
		keystr = key;
		array = key.split('+');
		if(int(array[1]) < int(array[0])):
			#print int(array[1]),int(array[0]);
			keystr = array[1] + '+' + array[0];

		if dicts[key] == '零':
			print keystr,dicts[key],0;
#1
		elif dicts[key] == '短一':
			print keystr,dicts[key],1;
		elif dicts[key] == '长一':
			print keystr,dicts[key],2;
		elif dicts[key] == '刀子一':
			print keystr,dicts[key],3;
		elif dicts[key] == '人一':
			print keystr,dicts[key],4;
		elif dicts[key] == '地一':
			print keystr,dicts[key],5;
		elif dicts[key] == '天一':
			print keystr,dicts[key],6;
#2
		elif dicts[key] == '短二':
			print keystr,dicts[key],7;
		elif dicts[key] == '长二':
			print keystr,dicts[key],8;
		elif dicts[key] == '刀子二':
			print keystr,dicts[key],9;
		elif dicts[key] == '人二':
			print keystr,dicts[key],10;
		elif dicts[key] == '地二':
			print keystr,dicts[key],11;
		elif dicts[key] == '天二':
			print keystr,dicts[key],12;
#3
		elif dicts[key] == '短三':
			print keystr,dicts[key],13;
		elif dicts[key] == '长三':
			print keystr,dicts[key],14;
		elif dicts[key] == '刀子三':
			print keystr,dicts[key],15;
		elif dicts[key] == '人三':
			print keystr,dicts[key],16;	
		elif dicts[key] == '地三':
			print keystr,dicts[key],17;
		elif dicts[key] == '天三':
			print keystr,dicts[key],18;
#4
		elif dicts[key] == '短四':
			print keystr,dicts[key],19;
		elif dicts[key] == '长四':
			print keystr,dicts[key],20;
		elif dicts[key] == '刀子四':
			print keystr,dicts[key],21;
		elif dicts[key] == '人四':
			print keystr,dicts[key],22;	
		elif dicts[key] == '地四':
			print keystr,dicts[key],23;
		elif dicts[key] == '天四':
			print keystr,dicts[key],24;
#5
		elif dicts[key] == '短五':
			print keystr,dicts[key],25;
		elif dicts[key] == '长五':
			print keystr,dicts[key],26;	
		elif dicts[key] == '刀子五':
			print keystr,dicts[key],27;
		elif dicts[key] == '人五':
			print keystr,dicts[key],28;
		elif dicts[key] == '地五':
			print keystr,dicts[key],29;
		elif dicts[key] == '天五':
			print keystr,dicts[key],30;
#6			
		elif dicts[key] == '短六':
			print keystr,dicts[key],31;
		elif dicts[key] == '长六':
			print keystr,dicts[key],32;	
		elif dicts[key] == '刀子六':
			print keystr,dicts[key],33;
		elif dicts[key] == '人六':
			print keystr,dicts[key],34;
		elif dicts[key] == '地六':
			print keystr,dicts[key],35;
		elif dicts[key] == '天六':
			print keystr,dicts[key],36;
#7
		elif dicts[key] == '短七':
			print keystr,dicts[key],37;
		elif dicts[key] == '长七':
			print keystr,dicts[key],38;
		elif dicts[key] == '刀子七':
			print keystr,dicts[key],39;
		elif dicts[key] == '人七':
			print keystr,dicts[key],40;
		elif dicts[key] == '地七':
			print keystr,dicts[key],41;	
		elif dicts[key] == '天七':
			print keystr,dicts[key],42;
#8
		elif dicts[key] == '短八':
			print keystr,dicts[key],43;
		elif dicts[key] == '长八':
			print keystr,dicts[key],44;
		elif dicts[key] == '刀子八':
			print keystr,dicts[key],45;
		elif dicts[key] == '人八':
			print keystr,dicts[key],46;
		elif dicts[key] == '地八':
			print keystr,dicts[key],47;
		elif dicts[key] == '天八':
			print keystr,dicts[key],48;
#9
		elif dicts[key] == '短九':
			print keystr,dicts[key],49;
		elif dicts[key] == '长九':
			print keystr,dicts[key],50;
		elif dicts[key] == '刀子九':
			print keystr,dicts[key],51;
		elif dicts[key] == '人九':
			print keystr,dicts[key],52;
		elif dicts[key] == '地九':
			print keystr,dicts[key],53;
		elif dicts[key] == '天九':
			print keystr,dicts[key],54;
##
		elif dicts[key] == '地杠':
			print keystr,dicts[key],60;
		elif dicts[key] == '天杠':
			print keystr,dicts[key],61;
		elif dicts[key] == '对小五':
			print keystr,dicts[key],62;
		elif dicts[key] == '对小七':
			print keystr,dicts[key],63;
		elif dicts[key] == '对小八':
			print keystr,dicts[key],64;
		elif dicts[key] == '对小九':
			print keystr,dicts[key],65;
		elif dicts[key] == '对六':
			print keystr,dicts[key],66;
		elif dicts[key] == '对七':
			print keystr,dicts[key],67;
		elif dicts[key] == '对十':
			print keystr,dicts[key],68;
		elif dicts[key] == '对十一':
			print keystr,dicts[key],69;
		elif dicts[key] == '对长四':
			print keystr,dicts[key],70;
		elif dicts[key] == '对长六':
			print keystr,dicts[key],71;
		elif dicts[key] == '对长十':
			print keystr,dicts[key],72;
		elif dicts[key] == '对刀子四':
			print keystr,dicts[key],73;
		elif dicts[key] == '对人八':
			print keystr,dicts[key],74;
		elif dicts[key] == '对小地':
			print keystr,dicts[key],75;
		elif dicts[key] == '对大天':
			print keystr,dicts[key],76;
		elif dicts[key] == '天九王':
			print keystr,dicts[key],77;
		elif dicts[key] == '皇上':
			print keystr,dicts[key],78;
		elif dicts[key] == '红鬼子':
			print keystr,dicts[key],79;
		elif dicts[key] == '黑鬼子':
			print keystr,dicts[key],80;
		elif dicts[key] == '天地':
			print keystr,dicts[key],81;
		else:
			idx = idx + 1;
			print idx,key,dicts[key],idx;

if __name__ == "__main__":
	if(len(sys.argv) != 2):
		print "%s file" %(sys.argv[0]);
		sys.exit(-1);
	open_file(sys.argv[1]);
