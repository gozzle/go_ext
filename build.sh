#!/bin/bash

wd=$(dirname $0)
cd $wd

dist=$wd/dist
zip_out=go_ext.zip

# clean up any previous builds
rm -rf $dist
rm -rf $zip_out

# create fresh dist dir
mkdir $dist

# put all src into the distro
rsync -a --exclude=".*" src/* $dist

if [[ `which bower` ]] 
then
  # bower on path
  bower install
else
  echo "bower is not on the path. See https://bower.io for installation instructions"
  exit 1
fi

# put bower deps into the distro
mv bower_components $dist

# zip up the dist directory for uploading to Chrome Webstore
zip -r $zip_out $dist
