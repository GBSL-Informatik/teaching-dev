#!/usr/bin/env bash

set -e

usage="usage: ./mp4_scale.sh path/to/movie.mov 720"

MP4=$1
SCALE=$2
echo $SCALE
CONVERTED=${MP4//\.mp4/-scaled\.mp4}

echo $CONVERTED
ffmpeg -i $MP4 -vf scale=$SCALE:-1 $CONVERTED