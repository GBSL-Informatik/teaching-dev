#!/usr/bin/env bash

set -e

usage="usage: ./mp4_recompute_dir.sh path/to/folder"

if [ -z "$1" ]; then
  echo "$usage"
  exit 1
fi

FOLDER=$1

for MP4 in "$FOLDER"/*.mp4; 
do
  if [ -f "$MP4" ]; then
    TEMP_FILE="${MP4//\.mp4/-temp\.mp4}"
    ffmpeg -i "$MP4" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k "$TEMP_FILE"
    mv "$TEMP_FILE" "$MP4"
    echo "Recomputed and overwritten: $MP4"
  fi
done