from turtle import *
from math import sqrt
import random

GRID_SIZE = 5, 5

def move_to(x, y):
    penup()
    goto(x, y)
    pendown()

def triangle(side_length):
    for _ in range(3):
        color(random.choice(['red', 'blue', 'orange', 'green', 'purple', 'brown']))
        forward(side_length)
        left(120)

for x in range(0, GRID_SIZE[0] * 30, 30):
    for y in range(0, GRID_SIZE[1] * 15, 15):
        shift_x = 0
        if y % 2 == 1:
            shift_x = -15
        move_to(x + shift_x, y * sqrt(3))
        triangle(30)