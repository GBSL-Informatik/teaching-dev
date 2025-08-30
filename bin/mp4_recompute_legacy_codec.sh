#!/usr/bin/env bash

set -e

usage="usage: ./mp4_recompute.sh path/to/file"

if [ -z "$1" ]; then
  echo "$usage"
  exit 1
fi

MP4=$1

TEMP_FILE="${MP4//\.mp4/-temp\.mp4}"
ffmpeg -i "$MP4" -c:v mpeg4 -q:v 5 -c:a libmp3lame -q:a 2 "$TEMP_FILE"
mv "$TEMP_FILE" "$MP4"
echo "Recomputed and overwritten: $MP4"
