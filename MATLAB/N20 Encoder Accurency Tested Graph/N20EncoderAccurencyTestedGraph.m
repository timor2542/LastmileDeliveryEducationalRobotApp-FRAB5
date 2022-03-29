clear all;
Array=readtable('N20 Encoder Accurency Tested Graph.csv');
xref = transpose(Array.Var1);
xget1 = transpose(Array.Var2);
errx1 = transpose(Array.Var3);
xget2 = transpose(Array.Var4);
errx2 = transpose(Array.Var5);
xget3 = transpose(Array.Var6);
errx3 = transpose(Array.Var7);
%title(ax1,'Top Plot')
%ylabel(ax1,'sin(5x)')
figure(1)
subplot(2,1,1);
plot(xref,xget1,xref,xget2,xref,xget3);
title('Reference Distance vs. Get Distance')
xlabel('Reference Distance (m.)') 
ylabel('Get Distance (m.)') 
legend('First Test','Second Test', 'Third Test')
grid on
axis([0 5 0 5]);
subplot(2,1,2);
plot(xref,errx1,xref,errx2,xref,errx3);
title('Reference Distance vs. Error Distance')
xlabel('Reference Distance (m.)') 
ylabel('Error Distance (m.)') 
legend('First Test','Second Test', 'Third Test')
grid on
axis([0 5 -0.003 0.003]);