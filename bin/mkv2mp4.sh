#!/usr/bin/env bash

set -e

usage="usage: ./mkv2mp4.sh path/to/movie.mkv"

MKV=$1
CONVERTED=${MKV//\.mkv/\.mp4}

ffmpeg -hwaccel cuvid -extra_hw_frames 8 -i $MKV -c:v h264_nvenc $CONVERTED
# no hw accel:
# ffmpeg $MKV $CONVERTED
