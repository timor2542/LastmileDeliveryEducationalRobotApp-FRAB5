clear all;
Array=readtable('Step-Up 5V Module Battery Life Tested Graph.csv');
x = transpose(Array.Var2);
y = transpose(Array.Var1);
title(ax1,'Top Plot')
ylabel(ax1,'sin(5x)')
plot(x,y);