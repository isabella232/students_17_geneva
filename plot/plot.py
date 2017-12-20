#!/usr/bin/python3 

import sys
import os
import csv
import matplotlib.pyplot as plt
import numpy as np

if len(sys.argv) < 2:
    print("Missing argument, use as follow:")
    print("./plot.py <csv file #1> <csv file #2> ...")
    sys.exit(1)

any_x = None
any_y = None
set_y = set()
for fname in sys.argv[1:]:
    label = input("Label for file %s: " % fname)
    # label = os.path.basename(fname).split(".")[0]
    x,y = np.loadtxt(fname,
                     unpack=True,
                     delimiter = ',',
                     skiprows=1,
                     usecols=(0,2))
    plt.plot(x,y,label=label,linewidth=2.5)
    any_x = x if any_x is None else any_x
    any_y = y if any_y is None else any_y
    # print("y = ",set(y))
    set_y = set_y | set(y)
    

title = input("Title of the graph: ")
plt.title(title,fontsize=35)
plt.xlabel("Number of exponentiations",fontsize=23)
plt.ylabel("Time in seconds",fontsize=23)
plt.xticks(any_x)

# plt.yticks(any_y)
ly = list(map(lambda t: float("{0:.2f}".format(t)),list(set_y)))
high = max(ly)
low = min(ly)
nbTicks = 10
steps = float("{0:.2f}".format((high - low) / nbTicks))
plt.yticks(np.arange(low,high,steps))

plt.tick_params(axis='both', which='major', labelsize=18)
# plt.xticks(len(any_x),x)
# plt.xticks(np.linspace(0,x_max*1.1,10,endpoint=True))
# plt.yticks(np.linspace(0,y_max*1.1,10,endpoint=True))
plt.legend(loc='upper left',prop={"size":30})
plt.show()
# savefig('plot.png',bbox_inches="tight")
