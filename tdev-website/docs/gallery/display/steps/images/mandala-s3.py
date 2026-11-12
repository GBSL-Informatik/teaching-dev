from turtle import *

speed(0)
def polygon(n):
    for i in range(n):
        forward(60)
        left(360 / n)

polygon(5)

