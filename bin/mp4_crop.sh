#!/usr/bin/env bash

set -e

usage="usage: ./mp4_crop.sh path/to/movie.mp4 1264:1072:328:4"

# ffmpeg -i in.mp4 -vf "crop=out_w:out_h:x:y" out.mp4
# Where the options are as follows:
# - out_w is the width of the output rectangle
# - out_h is the height of the output rectangle
# - x and y specify the top left corner of the output rectangle (coordinates start at (0,0) in the top left corner of the input)

MP4=$1
CROP=$2
echo $CROP
CONVERTED=${MP4//\.mp4/-cropped\.mp4}

echo $CONVERTED
ffmpeg -i $MP4 -vf "crop=$CROP" $CONVERTED