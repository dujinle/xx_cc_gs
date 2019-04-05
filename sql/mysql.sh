#!/bin/bash
mysql -u root -proot < mysql.sql
mysql -u root -proot < paijiu.sql
mysql -u root -proot < paijiu_gui.sql
mysql -u root -proot < paijiu_xuan.sql

