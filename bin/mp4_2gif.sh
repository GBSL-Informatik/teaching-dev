#!/usr/bin/env bash

set -e

usage="usage: ./mp4_2gif.sh path/to/movie.mp4"

MP4=$1
CROP=$2
SKIP=0

CONVERTED=${MP4//\.mp4/\.gif}
if [ -z "$CROP" ]; then
    echo "--- Get possible crop values and pass them as optional param: ./mp4_t2gif.sh path/to/movie.mov 1584:1072:168:4"
    ffmpeg -ss 10 -i $MP4 -vframes 10 -vf cropdetect -f null - # show possible crop param
else
    echo "--- Process with crop=$CROP"
fi
ffmpeg -i $MP4 -ss $SKIP -vf "crop=$CROP,fps=10,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 $CONVERTED
