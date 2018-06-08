#!/bin/bash

if [ $# != 1 ] ;then
	echo "USAGE: $0 [stop|start]"
	exit -1 ;
fi

if [ $1 == "stop" ];then
	pids=`ps -ef | grep node | awk '{print $2}'`;
	echo "kill all pid:"$pids
	for pid in $pids;do
		kill -9 $pid
	done
elif [ $1 == "start" ];then
	pomelo start &
fi
