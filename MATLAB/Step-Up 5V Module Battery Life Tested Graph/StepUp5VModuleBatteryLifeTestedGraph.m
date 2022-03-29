clear all;
Array=readtable('Step-Up 5V Module Battery Life Tested Graph.csv');
xnl = transpose(Array.Var1);
ynl = transpose(Array.Var2);
znl = transpose([Array.Var3]*25);
xl = transpose(Array.Var4);
yl = transpose(Array.Var5);
zl = transpose([Array.Var6]*25);
%title(ax1,'Top Plot')
%ylabel(ax1,'sin(5x)')
figure(1)
subplot(2,1,1);
plot(xnl,ynl);
title('Time vs. Voltage')
xlabel('Time (Minute)') 
ylabel('Voltage (V)') 
grid on
axis([0 70 3.2 4.2]);
subplot(2,1,2);
plot(xnl,znl);
title('Time vs. Percentage')
xlabel('Time (Minute)') 
ylabel('Percentage (%)') 
grid on
axis([0 70 0 100]);
figure(2)
subplot(2,1,1);
plot(xl,yl);
title('Time vs. Voltage')
xlabel('Time (Minute)') 
ylabel('Voltage (V)') 
grid on
axis([0 40 3.2 4.2]);
subplot(2,1,2);
plot(xl,zl);
title('Time vs. Percentage')
xlabel('Time (Minute)') 
ylabel('Percentage (%)') 
grid on
axis([0 40 0 100]);