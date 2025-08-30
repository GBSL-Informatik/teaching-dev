#!/usr/bin/env bash

set -e

usage="usage: ./mp4_mute.sh path/to/movie.mp4"

VID=$1
MUTED=${VID//\.mp4/-muted\.mp4}

ffmpeg -i $VID -vcodec copy -an $MUTED

