#!/usr/bin/env bash

set -e

usage="usage: ./mov2mp4.sh path/to/movie.mov"

MOV=$1
CONVERTED=${MOV//\.mov/\.mp4}

ffmpeg -i $MOV $CONVERTED
