#!/bin/bash
# +---------+
# | updater |
# +---------+

# get the installer directory
Installer_get_current_dir () {
  SOURCE="${BASH_SOURCE[0]}"
  while [ -h "$SOURCE" ]; do
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
  done
  echo "$( cd -P "$( dirname "$SOURCE" )" && pwd )"
}

Installer_dir="$(Installer_get_current_dir)"

# move to installler directory
cd "$Installer_dir"
source utils.sh

Installer_info "Welcome to EXT-Detector updater !"
echo

MMHOME="${HOME}/MagicMirror"
[ -d ${MMHOME}/modules/EXT-Detector ] || {
  MMHOME=
  for homedir in /usr/local /home/*
  do
    [ "${homedir}" == "/home/*" ] && continue
    [ -d ${homedir}/MagicMirror/modules/EXT-Detector ] && {
      MMHOME="${homedir}/MagicMirror"
      break
    }
  done
}

if [ "${MMHOME}" ]
then
  cd ${MMHOME}/modules/EXT-Detector
else
  cd ~/MagicMirror/modules/EXT-Detector
fi

Installer_info "Updating..."

git reset --hard HEAD
git pull
echo

Installer_info "Ready for Installing..."

# launch installer
npm install
